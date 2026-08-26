"""
Ordering for the creator list served by /products/{id}/creators.

Two candidate sources with incomparable scores: pre-computed rows from
product_creator_matches carry the keyword scorer's 0-10 `relevance_score`, and
vector rows carry a Pinecone cosine `score`. The rerank path rescores both in one
pass so they land on a single scale. That Cohere score is written to
`rerank_score`; the stored `relevance_score` is left alone, because
utils.relevance compares it against a 0-10 threshold.
"""
from typing import Callable, List, Optional, Sequence, Tuple

from utils.rerank import rerank_documents

RerankFn = Callable[..., Optional[List[Tuple[int, float]]]]


def creator_document_text(video: dict) -> str:
    """Text a creator video is reranked on."""
    parts = [
        video.get("title") or "",
        video.get("channel_title") or video.get("channel") or "",
        (video.get("description") or "")[:500],
    ]
    return " ".join(part for part in parts if part).strip()


def stored_match_score(row: dict) -> float:
    """The score a pre-computed match row actually carries.

    `match_score` belongs to the legacy product_matches table and is never
    present here, so sorting on it was a no-op.
    """
    for key in ("relevance_score", "similarity_score"):
        value = row.get(key)
        if value is not None:
            try:
                return float(value)
            except (TypeError, ValueError):
                return 0.0
    return 0.0


def _vector_score(row: dict) -> float:
    try:
        return float(row.get("score") or 0)
    except (TypeError, ValueError):
        return 0.0


def rank_creator_candidates(
    query: str,
    match_rows: Sequence[dict],
    vector_matches: Sequence[dict],
    limit: int,
    keep: int,
    rerank: RerankFn = rerank_documents,
) -> Tuple[List[dict], List[dict]]:
    """Score pre-computed and vector candidates in one rerank pass.

    On success the combined list is truncated to `keep` (the configured top_n).
    On any failure the caller's `limit` applies instead: both lists come back
    whole, only re-sorted on the score each one actually carries, so an
    unavailable rerank degrades to the pre-flag response rather than dropping
    results and emptying the vector list.
    """
    ranked = None
    candidates: List[Tuple[str, dict, str]] = []

    if query:
        try:
            seen = set()
            for row in match_rows:
                video_id = row.get("video_id")
                if video_id in seen:
                    continue
                seen.add(video_id)
                video = row.get("creator_videos") or {}
                candidates.append(("match", row, creator_document_text(video) or str(video_id or "")))
            for vector_match in vector_matches:
                video_id = vector_match.get("video_id")
                if video_id in seen:
                    continue
                seen.add(video_id)
                candidates.append(
                    ("vector", vector_match, creator_document_text(vector_match) or str(video_id or ""))
                )

            if candidates:
                ranked = rerank(query, [doc for _, _, doc in candidates], limit=min(limit, keep))
        except Exception as e:
            print(f"⚠️  Rerank stage failed, keeping similarity order: {e}")
            ranked = None

    if not ranked:
        return (
            sorted(match_rows, key=stored_match_score, reverse=True)[:limit],
            sorted(vector_matches, key=_vector_score, reverse=True),
        )

    ranked_candidates = [
        (candidates[i][0], {**candidates[i][1], "rerank_score": score}) for i, score in ranked
    ]
    return (
        [payload for kind, payload in ranked_candidates if kind == "match"],
        [payload for kind, payload in ranked_candidates if kind == "vector"],
    )
