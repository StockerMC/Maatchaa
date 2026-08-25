"""
Retrieval feature flags.

Both default off. With neither set, indexing and serving behave exactly as they
did before these flags existed.
"""
import os

TRUTHY = {"1", "true", "yes", "on"}


def _enabled(name: str) -> bool:
    return os.getenv(name, "false").strip().lower() in TRUTHY


def rerank_serving_enabled() -> bool:
    """Serving path: merge vector matches, rerank them, order by relevance score."""
    return _enabled("RETRIEVAL_RERANK_ENABLED")


def document_input_type_enabled() -> bool:
    """Indexing path: embed corpus content with input_type=search_document.

    Vectors written this way are not comparable with the search_query vectors
    already in the index, so this stays off until the index is fully re-embedded.
    """
    return _enabled("RETRIEVAL_DOC_INPUT_TYPE_ENABLED")
