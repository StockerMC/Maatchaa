"""
Cohere Rerank stage for retrieval.

Pinecone similarity is a first-pass filter; rerank scores each candidate against
the query text directly. Callers ask for a wide candidate pool and keep the top N.

Every failure mode returns None so callers can fall back to similarity order
instead of failing the request. That includes constructing the client, so an
unimportable or misconfigured cohere never turns into a 500.
"""
import os
import threading
from typing import Any, List, Optional, Sequence, Tuple

DEFAULT_RERANK_MODEL = "rerank-v3.5"
DEFAULT_CANDIDATE_POOL = 30
DEFAULT_TOP_N = 10

# cohere.ClientV2 owns an httpx.Client, so a per-request instance leaks a
# connection pool. Cached against the key it was built from so a rotated or
# removed COHERE_KEY is still honoured.
_client_lock = threading.Lock()
_cached_client: Optional[Any] = None
_cached_client_key: Optional[str] = None


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


def reset_client_cache() -> None:
    """Drop the cached client. Used by tests; production never needs it."""
    global _cached_client, _cached_client_key
    with _client_lock:
        _cached_client = None
        _cached_client_key = None


def _client() -> Optional[Any]:
    global _cached_client, _cached_client_key

    key = os.getenv("COHERE_KEY")
    if not key:
        return None

    with _client_lock:
        if _cached_client is None or _cached_client_key != key:
            import cohere

            _cached_client = cohere.ClientV2(key)
            _cached_client_key = key
        return _cached_client


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

    requested = limit or top_n()
    try:
        co = client or _client()
        if co is None:
            print("⚠️  Rerank skipped: COHERE_KEY not set")
            return None

        response = co.rerank(
            model=rerank_model(),
            query=query,
            documents=list(documents),
            top_n=min(requested, len(documents)),
        )

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
    except Exception as e:
        print(f"⚠️  Rerank failed, keeping similarity order: {e}")
        return None
