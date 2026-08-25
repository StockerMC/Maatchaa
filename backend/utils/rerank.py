"""
Cohere Rerank stage for retrieval.

Pinecone similarity is a first-pass filter; rerank scores each candidate against
the query text directly. Callers ask for a wide candidate pool and keep the top N.

Every failure mode returns None so callers can fall back to similarity order
instead of failing the request.
"""
import os
from typing import Any, List, Optional, Sequence, Tuple

DEFAULT_RERANK_MODEL = "rerank-v3.5"
DEFAULT_CANDIDATE_POOL = 30
DEFAULT_TOP_N = 10


def rerank_model() -> str:
    return os.getenv("COHERE_RERANK_MODEL", DEFAULT_RERANK_MODEL)


def candidate_pool() -> int:
    try:
        return max(1, int(os.getenv("RETRIEVAL_CANDIDATE_POOL", str(DEFAULT_CANDIDATE_POOL))))
    except ValueError:
        return DEFAULT_CANDIDATE_POOL


def top_n() -> int:
    try:
        return max(1, int(os.getenv("RETRIEVAL_TOP_N", str(DEFAULT_TOP_N))))
    except ValueError:
        return DEFAULT_TOP_N


def _client() -> Optional[Any]:
    key = os.getenv("COHERE_KEY")
    if not key:
        return None
    import cohere

    return cohere.ClientV2(key)


def rerank_documents(
    query: str,
    documents: Sequence[str],
    limit: Optional[int] = None,
    client: Optional[Any] = None,
) -> Optional[List[Tuple[int, float]]]:
    """Rerank documents against query.

    Returns (index into documents, relevance score) best first, or None when
    rerank is unavailable — missing key, empty input, or an API error.
    """
    if not query or not documents:
        return None

    co = client or _client()
    if co is None:
        print("⚠️  Rerank skipped: COHERE_KEY not set")
        return None

    requested = limit or top_n()
    try:
        response = co.rerank(
            model=rerank_model(),
            query=query,
            documents=list(documents),
            top_n=min(requested, len(documents)),
        )
    except Exception as e:
        print(f"⚠️  Rerank failed, keeping similarity order: {e}")
        return None

    results = getattr(response, "results", None)
    if not results:
        return None

    ranked: List[Tuple[int, float]] = []
    for item in results:
        index = getattr(item, "index", None)
        if index is None or not 0 <= index < len(documents):
            continue
        ranked.append((index, float(getattr(item, "relevance_score", 0.0) or 0.0)))
    return ranked or None
