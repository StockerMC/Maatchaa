"""
Seed demo partnerships into Supabase for the demo company.
Uses real creator_videos data already in the database.
"""

import asyncio
import random
from uuid import uuid4
from datetime import datetime, timedelta
from utils.supabase import SupabaseClient

DEMO_COMPANY_ID = "bbcd5209-93ed-4b50-a25a-fe3d9c67a909"

STATUSES = ["to_contact", "contacted", "in_discussion", "active"]


async def seed_partnerships():
    supabase = SupabaseClient()
    await supabase.initialize()

    try:
        # Fetch existing creator videos
        videos_result = await supabase.client.table("creator_videos").select("*").execute()
        videos = videos_result.data or []
        print(f"Found {len(videos)} creator videos")

        if not videos:
            print("No creator videos found — cannot seed partnerships")
            return

        # Fetch existing matches to get product info
        matches_result = await supabase.client.table("product_creator_matches").select("*").execute()
        matches = matches_result.data or []
        print(f"Found {len(matches)} product-creator matches")

        # Build a map of video_id -> matched product titles
        video_products: dict[str, list[str]] = {}
        for m in matches:
            vid = m.get("video_id")
            product_title = m.get("product_title") or m.get("matched_product_title")
            if vid and product_title:
                video_products.setdefault(vid, []).append(product_title)

        # Check for existing partnerships to avoid duplicates
        existing = await supabase.client.table("partnerships").select("video_id").eq("company_id", DEMO_COMPANY_ID).execute()
        existing_video_ids = {p["video_id"] for p in (existing.data or [])}

        # Pick videos that aren't already partnerships
        available = [v for v in videos if v["id"] not in existing_video_ids]
        if not available:
            print("All videos already have partnerships — nothing to seed")
            return

        # Select 7 videos (or fewer if not enough available)
        selected = random.sample(available, min(7, len(available)))

        # Distribute statuses: 2 to_contact, 2 contacted, 2 in_discussion, 1 active
        status_distribution = ["to_contact", "to_contact", "contacted", "contacted", "in_discussion", "in_discussion", "active"]
        random.shuffle(status_distribution)

        partnerships = []
        now = datetime.utcnow()

        for i, video in enumerate(selected):
            status = status_distribution[i] if i < len(status_distribution) else random.choice(STATUSES)
            created_at = now - timedelta(days=random.randint(1, 14), hours=random.randint(0, 23))
            matched = video_products.get(video["id"], [])

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
                "matched_products": matched[:3],
                "views": video.get("views") or random.randint(5000, 500000),
                "likes": video.get("likes") or random.randint(100, 20000),
                "comments": video.get("comments") or random.randint(10, 2000),
                "status": status,
                "created_at": created_at.isoformat(),
                "updated_at": now.isoformat(),
            }
            partnerships.append(partnership)

        # Insert into Supabase
        result = await supabase.client.table("partnerships").insert(partnerships).execute()
        print(f"\nInserted {len(result.data)} partnerships:")
        for p in result.data:
            print(f"  [{p['status']:15}] {p['creator_name']} — {p['video_title'][:50]}")

    except Exception as e:
        print(f"Error seeding partnerships: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await supabase.close()


if __name__ == "__main__":
    asyncio.run(seed_partnerships())
