"""
Seed demo partnerships into Supabase for the demo company.
Uses real creator_videos data and company product titles.

Usage:
    PYTHONPATH=. python3 scripts/seed_demo_partnerships.py            # add new partnerships
    PYTHONPATH=. python3 scripts/seed_demo_partnerships.py --reseed   # clear and re-seed
"""

import asyncio
import random
import sys
from uuid import uuid4
from datetime import datetime, timedelta
from utils.supabase import SupabaseClient

DEMO_COMPANY_ID = "bbcd5209-93ed-4b50-a25a-fe3d9c67a909"

STATUSES = ["to_contact", "contacted", "in_discussion", "active"]


async def seed_partnerships(reseed: bool = False):
    supabase = SupabaseClient()
    await supabase.initialize()

    try:
        if reseed:
            print("Clearing existing partnerships for demo company...")
            await supabase.client.table("partnerships").delete().eq("company_id", DEMO_COMPANY_ID).execute()
            print("Done.\n")

        # Fetch creator videos
        videos_result = await supabase.client.table("creator_videos").select("*").execute()
        videos = videos_result.data or []
        print(f"Found {len(videos)} creator videos")

        if not videos:
            print("No creator videos found — cannot seed partnerships")
            return

        # Fetch company products for matched_products field
        products_result = await supabase.client.table("company_products").select("title").eq("company_id", DEMO_COMPANY_ID).execute()
        product_titles = [p["title"] for p in (products_result.data or []) if p.get("title") and p["title"] != "Gift Card"]
        print(f"Found {len(product_titles)} company products")

        if not product_titles:
            print("Warning: no products found, partnerships will have empty matched_products")

        # Check for existing partnerships to avoid duplicates
        existing = await supabase.client.table("partnerships").select("video_id").eq("company_id", DEMO_COMPANY_ID).execute()
        existing_video_ids = {p["video_id"] for p in (existing.data or [])}

        available = [v for v in videos if v["id"] not in existing_video_ids]
        if not available:
            print("All videos already have partnerships — nothing to seed")
            return

        selected = random.sample(available, min(7, len(available)))

        status_distribution = ["to_contact", "to_contact", "contacted", "contacted", "in_discussion", "in_discussion", "active"]
        random.shuffle(status_distribution)

        partnerships = []
        now = datetime.utcnow()
        used_products: set[str] = set()

        for i, video in enumerate(selected):
            status = status_distribution[i] if i < len(status_distribution) else random.choice(STATUSES)
            created_at = now - timedelta(days=random.randint(1, 14), hours=random.randint(0, 23))

            # Assign 1-3 products, prioritizing ones not yet used
            num_products = random.randint(1, 3)
            unused = [p for p in product_titles if p not in used_products]
            if len(unused) >= num_products:
                matched = random.sample(unused, num_products)
            else:
                matched = random.sample(product_titles, min(num_products, len(product_titles)))
            used_products.update(matched)

            partnership = {
                "id": str(uuid4()),
                "company_id": DEMO_COMPANY_ID,
                "video_id": video["id"],
                "creator_name": video.get("channel_title") or "Unknown Creator",
                "creator_handle": video.get("channel_id") or None,
                "creator_email": None,
                "creator_avatar": video.get("thumbnail_url") or None,
                "creator_channel_url": f"https://youtube.com/channel/{video['channel_id']}" if video.get("channel_id") else None,
                "video_title": video.get("title") or "Untitled Video",
                "video_url": video.get("url") or f"https://youtube.com/shorts/{video.get('video_id', '')}",
                "video_thumbnail": video.get("thumbnail_url") or None,
                "matched_products": matched,
                "views": video.get("views") or random.randint(5000, 500000),
                "likes": video.get("likes") or random.randint(100, 20000),
                "comments": video.get("comments") or random.randint(10, 2000),
                "status": status,
                "created_at": created_at.isoformat(),
                "updated_at": now.isoformat(),
            }
            partnerships.append(partnership)

        result = await supabase.client.table("partnerships").insert(partnerships).execute()
        print(f"\nInserted {len(result.data)} partnerships:")
        for p in result.data:
            print(f"  [{p['status']:15}] {p['creator_name']}")
            print(f"                    {p['video_title'][:60]}")
            print(f"                    products: {p['matched_products']}")

    except Exception as e:
        print(f"Error seeding partnerships: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await supabase.close()


if __name__ == "__main__":
    reseed = "--reseed" in sys.argv
    asyncio.run(seed_partnerships(reseed=reseed))
