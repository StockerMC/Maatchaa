#!/usr/bin/env python3
"""
Show what Cohere Rerank does to a product's creator candidates.

Retrieves a candidate pool from Pinecone and prints the top N in similarity
order next to the top N in rerank order, with scores, so the ordering change is
visible before turning it on in production.

Reads only. Run from the backend directory with your own .env:

    python scripts/eval_rerank.py --list
    python scripts/eval_rerank.py --product-id <uuid>
    python scripts/eval_rerank.py --query "merino wool base layer"

Neither retrieval flag needs to be set: the script calls the rerank stage
directly so you can compare today's ordering against the flagged path.
"""
import argparse
import asyncio
import sys

from dotenv import load_dotenv

load_dotenv()

from utils.rerank import candidate_pool, rerank_documents, rerank_model, top_n
from utils.supabase import SupabaseClient
from utils.vectordb import is_creator_video_match, query_text

COLUMN_WIDTH = 46


def truncate(text: str, width: int) -> str:
    text = " ".join((text or "").split())
    return text if len(text) <= width else text[: width - 1] + "…"


def document_text(video: dict) -> str:
    """Same document text the serving path reranks on."""
    parts = [
        video.get("title") or "",
        video.get("channel_title") or video.get("channel") or "",
        (video.get("description") or "")[:500],
    ]
    return " ".join(part for part in parts if part).strip()


def label(video: dict) -> str:
    title = video.get("title") or video.get("video_id") or "?"
    channel = video.get("channel_title") or video.get("channel") or ""
    return f"{title} — {channel}" if channel else title


async def load_products(supabase: SupabaseClient, product_id: str = None) -> list:
    query = supabase.client.table("company_products").select("id, title, description")
    if product_id:
        query = query.eq("id", product_id)
    result = await query.limit(25).execute()
    return result.data or []


async def load_videos(supabase: SupabaseClient, video_ids: list) -> dict:
    if not video_ids:
        return {}
    result = await supabase.client.table("creator_videos")\
        .select("video_id, title, description, channel_title")\
        .in_("video_id", video_ids)\
        .execute()
    return {row["video_id"]: row for row in (result.data or [])}


async def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--product-id", help="Product to evaluate")
    parser.add_argument("--query", help="Raw query text instead of a product")
    parser.add_argument("--list", action="store_true", help="List products and exit")
    parser.add_argument("--pool", type=int, default=candidate_pool(), help="Pinecone candidates to retrieve")
    parser.add_argument("--top-n", type=int, default=top_n(), help="Results to display")
    args = parser.parse_args()

    supabase = SupabaseClient()
    await supabase.initialize()

    if args.list:
        for product in await load_products(supabase):
            print(f"{product['id']}  {product['title']}")
        return 0

    if args.query:
        query = args.query
    elif args.product_id:
        products = await load_products(supabase, args.product_id)
        if not products:
            print(f"No product with id {args.product_id}")
            return 1
        product = products[0]
        query = f"{product['title']} {product.get('description') or ''}"
        print(f"Product: {product['title']}")
    else:
        parser.error("pass --product-id, --query, or --list")

    query = query[:500]
    print(f"Query: {truncate(query, 120)}")
    print(f"Pool: {args.pool}   Top N: {args.top_n}   Rerank model: {rerank_model()}\n")

    results = query_text(query, top_k=args.pool)
    candidates = [m for m in results.matches if is_creator_video_match(m.metadata or {})]
    if not candidates:
        print("No creator video vectors in the candidate pool.")
        print("Videos indexed before the type metadata key are matched on video_id;")
        print("if this is empty the pool is all products, or the index is empty.")
        return 1

    videos = await load_videos(supabase, [m.metadata.get("video_id") for m in candidates])
    enriched = []
    for match in candidates:
        video_id = match.metadata.get("video_id")
        video = videos.get(video_id) or dict(match.metadata or {})
        video.setdefault("video_id", video_id)
        enriched.append((video, match.score))

    ranked = rerank_documents(query, [document_text(v) for v, _ in enriched], limit=args.top_n)
    if ranked is None:
        print("Rerank unavailable — the serving path would keep similarity order.")
        return 1

    print(f"{'similarity (today)'.upper():<{COLUMN_WIDTH + 8}}{'rerank (flagged path)'.upper()}")
    print("-" * (COLUMN_WIDTH + 8) + "-" * (COLUMN_WIDTH + 8))

    left = enriched[: args.top_n]
    for rank in range(max(len(left), len(ranked))):
        if rank < len(left):
            video, score = left[rank]
            before = f"{rank + 1:>2}. [{score:.3f}] {truncate(label(video), COLUMN_WIDTH - 12)}"
        else:
            before = ""
        if rank < len(ranked):
            index, score = ranked[rank]
            video = enriched[index][0]
            after = f"{rank + 1:>2}. [{score:.3f}] {truncate(label(video), COLUMN_WIDTH - 12)}"
        else:
            after = ""
        print(f"{before:<{COLUMN_WIDTH + 8}}{after}")

    moved = sum(
        1
        for position, (index, _) in enumerate(ranked)
        if index != position
    )
    print(f"\n{moved} of {len(ranked)} positions changed.")
    print("The served endpoint also merges pre-computed keyword matches into this pool.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
