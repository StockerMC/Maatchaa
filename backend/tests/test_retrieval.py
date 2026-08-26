"""Tests for the retrieval flags, candidate identification, and rerank stage.

Fully offline: the Cohere and Pinecone clients are mocked (conftest stubs both
constructors for the whole session).
"""
import importlib
from types import SimpleNamespace

import cohere
import pytest
from unittest.mock import create_autospec, patch

import utils.rerank as rerank_module
from utils.creator_ranking import (
    creator_document_text,
    rank_creator_candidates,
    stored_match_score,
)
from utils.feature_flags import document_input_type_enabled, rerank_serving_enabled
from utils.rerank import (
    candidate_pool,
    rerank_documents,
    rerank_model,
    reset_client_cache,
    top_n,
)


@pytest.fixture(autouse=True)
def reset_rerank_client_cache():
    reset_client_cache()
    yield
    reset_client_cache()


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


@pytest.fixture
def make_client(real_cohere_client_v2):
    """Build a client autospecced from the real cohere.ClientV2.

    Autospec enforces the live signature, so renaming a keyword (documents ->
    docs, query -> q) or passing positionally raises TypeError instead of
    silently passing the way a bare MagicMock would.
    """

    def build(results=(), error=None):
        client = create_autospec(real_cohere_client_v2, instance=True)
        if error is not None:
            client.rerank.side_effect = error
        else:
            client.rerank.return_value = SimpleNamespace(results=list(results))
        return client

    return build


def result(index, score):
    return SimpleNamespace(index=index, relevance_score=score)


def match_row(video_id, **fields):
    row = {
        "video_id": video_id,
        "creator_videos": {"video_id": video_id, "title": f"{video_id} review"},
    }
    row.update(fields)
    return row


def vector_row(video_id, score):
    return {"video_id": video_id, "score": score, "title": f"{video_id} short", "channel": "c"}


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

    def test_flags_are_independent(self, monkeypatch):
        monkeypatch.setenv("RETRIEVAL_RERANK_ENABLED", "true")
        monkeypatch.delenv("RETRIEVAL_DOC_INPUT_TYPE_ENABLED", raising=False)
        assert rerank_serving_enabled() is True
        assert document_input_type_enabled() is False


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


class TestRerankCallShape:
    """The call shape is the contract with cohere; pin it explicitly."""

    def test_exact_keywords_passed_to_cohere(self, make_client):
        client = make_client([result(0, 0.5)])
        rerank_documents("a query", ["a", "b"], limit=2, client=client)

        assert client.rerank.call_args.args == ()
        kwargs = client.rerank.call_args.kwargs
        assert set(kwargs) == {"model", "query", "documents", "top_n"}
        assert kwargs["query"] == "a query"
        assert kwargs["documents"] == ["a", "b"]
        assert kwargs["top_n"] == 2

    def test_documents_are_passed_as_a_list_of_strings(self, make_client):
        client = make_client([result(0, 0.5)])
        rerank_documents("query", ("a", "b"), client=client)
        documents = client.rerank.call_args.kwargs["documents"]
        assert isinstance(documents, list)
        assert all(isinstance(document, str) for document in documents)

    def test_rerank_resolves_to_the_v2_method(self, real_cohere_client_v2):
        # ClientV2(V2Client, Client): the v1 rerank takes
        # Sequence[RerankRequestDocumentsItem] and max_chunks_per_doc, so an MRO
        # change would silently break the call above. requirements.txt pins the
        # major to keep this true.
        assert real_cohere_client_v2.rerank.__qualname__.startswith("V2Client")


class TestRerankDocuments:
    def test_returns_ranked_indices_and_scores(self, make_client):
        client = make_client([result(2, 0.9), result(0, 0.4)])
        ranked = rerank_documents("query", ["a", "b", "c"], limit=2, client=client)
        assert ranked == [(2, 0.9), (0, 0.4)]

    def test_caps_top_n_at_document_count(self, make_client):
        client = make_client([result(0, 0.5)])
        rerank_documents("query", ["a"], limit=10, client=client)
        assert client.rerank.call_args.kwargs["top_n"] == 1

    def test_uses_configured_model(self, monkeypatch, make_client):
        monkeypatch.setenv("COHERE_RERANK_MODEL", "rerank-english-v3.0")
        client = make_client([result(0, 0.5)])
        rerank_documents("query", ["a"], client=client)
        assert client.rerank.call_args.kwargs["model"] == "rerank-english-v3.0"

    def test_no_documents(self, make_client):
        client = make_client([result(0, 0.5)])
        assert rerank_documents("query", [], client=client) is None
        client.rerank.assert_not_called()

    def test_no_query(self, make_client):
        client = make_client([result(0, 0.5)])
        assert rerank_documents("", ["a"], client=client) is None
        client.rerank.assert_not_called()

    def test_api_error_falls_back(self, make_client):
        client = make_client(error=RuntimeError("rerank is down"))
        assert rerank_documents("query", ["a", "b"], client=client) is None

    def test_empty_results_fall_back(self, make_client):
        assert rerank_documents("query", ["a"], client=make_client([])) is None

    def test_out_of_range_index_is_dropped(self, make_client):
        client = make_client([result(99, 0.9), result(1, 0.2)])
        assert rerank_documents("query", ["a", "b"], client=client) == [(1, 0.2)]

    def test_missing_key_falls_back(self, monkeypatch):
        monkeypatch.delenv("COHERE_KEY", raising=False)
        assert rerank_documents("query", ["a", "b"]) is None

    def test_client_construction_failure_falls_back(self, monkeypatch):
        def explode():
            raise ImportError("no cohere here")

        monkeypatch.setattr(rerank_module, "_client", explode)
        assert rerank_documents("query", ["a", "b"]) is None


class TestClientCache:
    @pytest.fixture
    def built_with(self, monkeypatch):
        """Keys every ClientV2 construction was made with. One entry per client."""
        keys = []

        def factory(key):
            keys.append(key)
            return SimpleNamespace(key=key)

        monkeypatch.setattr(cohere, "ClientV2", factory)
        return keys

    def test_client_is_reused_across_calls(self, monkeypatch, built_with):
        monkeypatch.setenv("COHERE_KEY", "key-1")
        assert rerank_module._client() is rerank_module._client()
        assert built_with == ["key-1"]

    def test_rotated_key_builds_a_new_client(self, monkeypatch, built_with):
        monkeypatch.setenv("COHERE_KEY", "key-1")
        first = rerank_module._client()
        monkeypatch.setenv("COHERE_KEY", "key-2")
        assert rerank_module._client() is not first
        assert built_with == ["key-1", "key-2"]

    def test_missing_key_returns_none_and_does_not_cache(self, monkeypatch, built_with):
        monkeypatch.delenv("COHERE_KEY", raising=False)
        assert rerank_module._client() is None
        assert built_with == []
        monkeypatch.setenv("COHERE_KEY", "key-1")
        assert rerank_module._client() is not None

    def test_cache_does_not_defeat_client_injection(self, monkeypatch, make_client):
        monkeypatch.setenv("COHERE_KEY", "key-1")
        client = make_client([result(0, 0.5)])
        rerank_documents("query", ["a"], client=client)
        client.rerank.assert_called_once()
        assert rerank_module._cached_client is None


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


class TestCreatorDocumentText:
    def test_uses_title_channel_and_truncated_description(self):
        text = creator_document_text(
            {"title": "Snowboard review", "channel_title": "Ride", "description": "z" * 600}
        )
        assert text.startswith("Snowboard review Ride ")
        assert text.count("z") == 500

    def test_falls_back_to_channel_key(self):
        assert creator_document_text({"title": "T", "channel": "C"}) == "T C"

    def test_empty_video(self):
        assert creator_document_text({}) == ""


class TestStoredMatchScore:
    def test_prefers_relevance_score(self):
        assert stored_match_score({"relevance_score": 8.5, "similarity_score": 0.2}) == 8.5

    def test_falls_back_to_similarity_score(self):
        assert stored_match_score({"similarity_score": 0.2}) == 0.2

    def test_ignores_the_legacy_match_score_column(self):
        # match_score belongs to the legacy product_matches table and is never
        # present on product_creator_matches rows.
        assert stored_match_score({"match_score": 99}) == 0.0

    def test_non_numeric_is_zero(self):
        assert stored_match_score({"relevance_score": "high"}) == 0.0


def never_called(*args, **kwargs):
    raise AssertionError("rerank should not have been called")


def unavailable(*args, **kwargs):
    return None


class TestRankCreatorCandidatesFallback:
    """With rerank unavailable the response must match the pre-flag one."""

    def test_keeps_every_row_and_the_vector_list(self):
        rows = [match_row(f"m{i}", relevance_score=i) for i in range(12)]
        vectors = [vector_row(f"v{i}", 0.5) for i in range(6)]

        matches, vector_matches = rank_creator_candidates(
            "query", rows, vectors, limit=50, keep=10, rerank=unavailable
        )

        assert len(matches) == 12
        assert len(vector_matches) == 6

    def test_respects_the_callers_limit_not_top_n(self):
        rows = [match_row(f"m{i}", relevance_score=i) for i in range(12)]
        vectors = [vector_row("v1", 0.5)]

        matches, vector_matches = rank_creator_candidates(
            "query", rows, vectors, limit=50, keep=10, rerank=unavailable
        )

        assert len(matches) == 12  # not truncated to keep=10
        assert vector_matches

    def test_limit_still_bounds_the_match_list(self):
        rows = [match_row(f"m{i}", relevance_score=i) for i in range(12)]
        matches, _ = rank_creator_candidates(
            "query", rows, [], limit=5, keep=10, rerank=unavailable
        )
        assert len(matches) == 5

    def test_orders_on_relevance_score(self):
        rows = [
            match_row("low", relevance_score=2.0),
            match_row("high", relevance_score=9.0),
            match_row("mid", relevance_score=5.0),
        ]
        matches, _ = rank_creator_candidates(
            "query", rows, [], limit=50, keep=10, rerank=unavailable
        )
        assert [row["video_id"] for row in matches] == ["high", "mid", "low"]

    def test_legacy_match_score_does_not_drive_the_order(self):
        rows = [
            match_row("legacy", match_score=99),
            match_row("real", relevance_score=1.0),
        ]
        matches, _ = rank_creator_candidates(
            "query", rows, [], limit=50, keep=10, rerank=unavailable
        )
        assert [row["video_id"] for row in matches] == ["real", "legacy"]

    def test_equal_scores_keep_insertion_order(self):
        rows = [match_row("a"), match_row("b"), match_row("c")]
        matches, _ = rank_creator_candidates(
            "query", rows, [], limit=50, keep=10, rerank=unavailable
        )
        assert [row["video_id"] for row in matches] == ["a", "b", "c"]

    def test_vector_list_is_ordered_by_similarity(self):
        vectors = [vector_row("low", 0.1), vector_row("high", 0.9)]
        _, vector_matches = rank_creator_candidates(
            "query", [], vectors, limit=50, keep=10, rerank=unavailable
        )
        assert [row["video_id"] for row in vector_matches] == ["high", "low"]

    def test_empty_query_never_calls_rerank(self):
        rows = [match_row("a"), match_row("b")]
        vectors = [vector_row("v", 0.5)]

        matches, vector_matches = rank_creator_candidates(
            "", rows, vectors, limit=50, keep=10, rerank=never_called
        )

        assert [row["video_id"] for row in matches] == ["a", "b"]
        assert len(vector_matches) == 1

    def test_a_raising_rerank_is_contained(self):
        def explode(*args, **kwargs):
            raise RuntimeError("cohere exploded")

        rows = [match_row("a"), match_row("b")]
        matches, vector_matches = rank_creator_candidates(
            "query", rows, [vector_row("v", 0.5)], limit=50, keep=10, rerank=explode
        )

        assert len(matches) == 2
        assert len(vector_matches) == 1

    def test_no_rerank_score_is_added(self):
        matches, _ = rank_creator_candidates(
            "query", [match_row("a", relevance_score=8.5)], [], limit=50, keep=10, rerank=unavailable
        )
        assert "rerank_score" not in matches[0]


class TestRankCreatorCandidatesRerank:
    def test_relevance_score_survives_and_rerank_score_is_added(self):
        rows = [match_row("a", relevance_score=8.5, relevance_reasoning="keyword hit")]

        matches, _ = rank_creator_candidates(
            "query", rows, [], limit=50, keep=10, rerank=lambda *a, **kw: [(0, 0.31)]
        )

        assert matches[0]["relevance_score"] == 8.5
        assert matches[0]["rerank_score"] == 0.31
        assert matches[0]["relevance_reasoning"] == "keyword hit"

    def test_the_stored_row_is_not_mutated(self):
        row = match_row("a", relevance_score=8.5)
        rank_creator_candidates(
            "query", [row], [], limit=50, keep=10, rerank=lambda *a, **kw: [(0, 0.31)]
        )
        assert "rerank_score" not in row

    def test_truncates_to_top_n_on_success(self):
        rows = [match_row(f"m{i}") for i in range(12)]
        seen = {}

        def rerank(query, documents, limit=None):
            seen["limit"] = limit
            return [(i, 1.0 - i / 100) for i in range(limit)]

        matches, _ = rank_creator_candidates("query", rows, [], limit=50, keep=3, rerank=rerank)

        assert seen["limit"] == 3
        assert len(matches) == 3

    def test_orders_by_rerank_score_across_both_sources(self):
        rows = [match_row("m1"), match_row("m2")]
        vectors = [vector_row("v1", 0.9)]

        # Cohere returns best first: v1, m2, m1.
        matches, vector_matches = rank_creator_candidates(
            "query", rows, vectors, limit=50, keep=10, rerank=lambda *a, **kw: [(2, 0.9), (1, 0.5), (0, 0.1)]
        )

        assert [row["video_id"] for row in matches] == ["m2", "m1"]
        assert [row["video_id"] for row in vector_matches] == ["v1"]
        assert vector_matches[0]["rerank_score"] == 0.9

    def test_deduplicates_a_video_present_in_both_sources(self):
        documents = {}

        def rerank(query, documents_, limit=None):
            documents["count"] = len(documents_)
            return [(0, 0.9)]

        rank_creator_candidates(
            "query",
            [match_row("shared")],
            [vector_row("shared", 0.9)],
            limit=50,
            keep=10,
            rerank=rerank,
        )
        assert documents["count"] == 1

    def test_reranks_on_the_embedded_video_text(self):
        captured = {}

        def rerank(query, documents, limit=None):
            captured["documents"] = documents
            return [(0, 0.9)]

        rank_creator_candidates(
            "query", [match_row("abc")], [], limit=50, keep=10, rerank=rerank
        )
        assert captured["documents"] == ["abc review"]

    def test_row_without_video_text_falls_back_to_the_video_id(self):
        captured = {}

        def rerank(query, documents, limit=None):
            captured["documents"] = documents
            return [(0, 0.9)]

        rank_creator_candidates(
            "query",
            [{"video_id": "abc", "creator_videos": None}],
            [],
            limit=50,
            keep=10,
            rerank=rerank,
        )
        assert captured["documents"] == ["abc"]


class TestFlagOffContract:
    """With RETRIEVAL_RERANK_ENABLED unset the endpoint never reaches the
    ranking helper; when it does reach it without a usable rerank, the result is
    the pre-flag response."""

    def test_flag_defaults_to_off(self, monkeypatch):
        monkeypatch.delenv("RETRIEVAL_RERANK_ENABLED", raising=False)
        assert rerank_serving_enabled() is False

    def test_unavailable_rerank_returns_the_same_rows(self):
        rows = [match_row(f"m{i}") for i in range(12)]
        vectors = [vector_row(f"v{i}", 0.5) for i in range(20)]

        matches, vector_matches = rank_creator_candidates(
            "query", rows, vectors, limit=50, keep=10, rerank=unavailable
        )

        assert [row["video_id"] for row in matches] == [row["video_id"] for row in rows]
        assert [row["video_id"] for row in vector_matches] == [row["video_id"] for row in vectors]

    def test_missing_cohere_key_takes_the_fallback(self, monkeypatch):
        monkeypatch.delenv("COHERE_KEY", raising=False)
        rows = [match_row(f"m{i}") for i in range(12)]

        matches, vector_matches = rank_creator_candidates(
            "query", rows, [vector_row("v", 0.5)], limit=50, keep=10
        )

        assert len(matches) == 12
        assert len(vector_matches) == 1
