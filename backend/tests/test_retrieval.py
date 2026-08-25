"""Tests for the retrieval flags, candidate identification, and rerank stage.

Fully offline: the Cohere and Pinecone clients are mocked.
"""
import importlib

import pytest
from unittest.mock import MagicMock, patch

from utils.feature_flags import document_input_type_enabled, rerank_serving_enabled
from utils.rerank import candidate_pool, rerank_documents, rerank_model, top_n


@pytest.fixture
def vectordb(monkeypatch):
    monkeypatch.setenv("COHERE_KEY", "test-cohere-key")
    monkeypatch.setenv("PINECONE_KEY", "test-pinecone-key")
    monkeypatch.setenv("INDEX_NAME", "test-index")
    # patch() only bites on the first import, and utils.vectordb may already be
    # in sys.modules from another test file. Reload so the module-level clients
    # are rebuilt against the mocks either way.
    with patch("cohere.ClientV2"), patch("pinecone.Pinecone"):
        import utils.vectordb as module

        importlib.reload(module)
        yield module


def fake_client(results):
    client = MagicMock()
    client.rerank.return_value = MagicMock(results=results)
    return client


def result(index, score):
    return MagicMock(index=index, relevance_score=score)


class TestFlags:
    def test_default_off(self, monkeypatch):
        monkeypatch.delenv("RETRIEVAL_RERANK_ENABLED", raising=False)
        monkeypatch.delenv("RETRIEVAL_DOC_INPUT_TYPE_ENABLED", raising=False)
        assert rerank_serving_enabled() is False
        assert document_input_type_enabled() is False

    @pytest.mark.parametrize("value", ["true", "TRUE", "1", "yes", "on"])
    def test_truthy_values(self, monkeypatch, value):
        monkeypatch.setenv("RETRIEVAL_RERANK_ENABLED", value)
        assert rerank_serving_enabled() is True

    @pytest.mark.parametrize("value", ["false", "0", "", "off", "maybe"])
    def test_falsy_values(self, monkeypatch, value):
        monkeypatch.setenv("RETRIEVAL_RERANK_ENABLED", value)
        assert rerank_serving_enabled() is False


class TestCorpusInputType:
    def test_defaults_to_search_query(self, vectordb, monkeypatch):
        monkeypatch.delenv("RETRIEVAL_DOC_INPUT_TYPE_ENABLED", raising=False)
        assert vectordb.corpus_input_type() == "search_query"

    def test_search_document_when_enabled(self, vectordb, monkeypatch):
        monkeypatch.setenv("RETRIEVAL_DOC_INPUT_TYPE_ENABLED", "true")
        assert vectordb.corpus_input_type() == "search_document"

    def test_query_embedding_is_always_search_query(self, vectordb, monkeypatch):
        monkeypatch.setenv("RETRIEVAL_DOC_INPUT_TYPE_ENABLED", "true")
        vectordb.co.embed.reset_mock()
        vectordb.text_to_embedding("a query")
        assert vectordb.co.embed.call_args.kwargs["input_type"] == "search_query"

    def test_document_embedding_follows_flag(self, vectordb, monkeypatch):
        monkeypatch.setenv("RETRIEVAL_DOC_INPUT_TYPE_ENABLED", "true")
        vectordb.co.embed.reset_mock()
        vectordb.document_to_embedding("corpus content")
        assert vectordb.co.embed.call_args.kwargs["input_type"] == "search_document"


class TestIsCreatorVideoMatch:
    def test_typed_video(self, vectordb):
        assert vectordb.is_creator_video_match({"type": "creator_video", "video_id": "abc"})

    def test_typed_product(self, vectordb):
        assert not vectordb.is_creator_video_match({"type": "product", "title": "Snowboard"})

    def test_legacy_video_without_type(self, vectordb):
        assert vectordb.is_creator_video_match({"video_id": "abc", "title": "Review"})

    def test_legacy_product_without_type(self, vectordb):
        assert not vectordb.is_creator_video_match({"title": "Snowboard", "price": 10})

    def test_empty(self, vectordb):
        assert not vectordb.is_creator_video_match({})
        assert not vectordb.is_creator_video_match(None)


class TestRerankDocuments:
    def test_returns_ranked_indices_and_scores(self):
        client = fake_client([result(2, 0.9), result(0, 0.4)])
        ranked = rerank_documents("query", ["a", "b", "c"], limit=2, client=client)
        assert ranked == [(2, 0.9), (0, 0.4)]

    def test_caps_top_n_at_document_count(self):
        client = fake_client([result(0, 0.5)])
        rerank_documents("query", ["a"], limit=10, client=client)
        assert client.rerank.call_args.kwargs["top_n"] == 1

    def test_uses_configured_model(self, monkeypatch):
        monkeypatch.setenv("COHERE_RERANK_MODEL", "rerank-english-v3.0")
        client = fake_client([result(0, 0.5)])
        rerank_documents("query", ["a"], client=client)
        assert client.rerank.call_args.kwargs["model"] == "rerank-english-v3.0"

    def test_no_documents(self):
        client = fake_client([result(0, 0.5)])
        assert rerank_documents("query", [], client=client) is None
        client.rerank.assert_not_called()

    def test_api_error_falls_back(self):
        client = MagicMock()
        client.rerank.side_effect = RuntimeError("rerank is down")
        assert rerank_documents("query", ["a", "b"], client=client) is None

    def test_empty_results_fall_back(self):
        assert rerank_documents("query", ["a"], client=fake_client([])) is None

    def test_out_of_range_index_is_dropped(self):
        client = fake_client([result(99, 0.9), result(1, 0.2)])
        assert rerank_documents("query", ["a", "b"], client=client) == [(1, 0.2)]

    def test_missing_key_falls_back(self, monkeypatch):
        monkeypatch.delenv("COHERE_KEY", raising=False)
        assert rerank_documents("query", ["a", "b"]) is None


class TestRerankSettings:
    def test_defaults(self, monkeypatch):
        monkeypatch.delenv("COHERE_RERANK_MODEL", raising=False)
        monkeypatch.delenv("RETRIEVAL_CANDIDATE_POOL", raising=False)
        monkeypatch.delenv("RETRIEVAL_TOP_N", raising=False)
        assert rerank_model() == "rerank-v3.5"
        assert candidate_pool() == 30
        assert top_n() == 10

    def test_env_overrides(self, monkeypatch):
        monkeypatch.setenv("RETRIEVAL_CANDIDATE_POOL", "50")
        monkeypatch.setenv("RETRIEVAL_TOP_N", "5")
        assert candidate_pool() == 50
        assert top_n() == 5

    def test_invalid_values_are_handled(self, monkeypatch):
        monkeypatch.setenv("RETRIEVAL_CANDIDATE_POOL", "not-a-number")
        monkeypatch.setenv("RETRIEVAL_TOP_N", "0")
        assert candidate_pool() == 30
        assert top_n() == 1
