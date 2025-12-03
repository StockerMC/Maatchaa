"""
Backfill reel_interactions table with existing partnerships
This will populate the archive with historical partnership data
"""

import asyncio
from utils.supabase import SupabaseClient


async def backfill_partnership_interactions():
    """
    Backfill reel_interactions with existing partnerships
    """
    supabase_client = SupabaseClient()
    await supabase_client.initialize()

    try:
        print("🔄 Fetching existing partnerships...")

        # Fetch all partnerships
        result = await supabase_client.client.table("partnerships")\
            .select("company_id, video_id, created_at")\
            .execute()

        partnerships = result.data or []
        print(f"📊 Found {len(partnerships)} existing partnerships")

        if len(partnerships) == 0:
            print("✅ No partnerships to backfill")
            return

        # Create interactions for each partnership
        interactions_created = 0
        interactions_skipped = 0

        for partnership in partnerships:
            # Skip if video_id is None or empty
            if not partnership.get("video_id"):
                print(f"⚠️  Skipping partnership with no video_id: {partnership.get('id')}")
                interactions_skipped += 1
                continue

            # Check if interaction already exists
            existing = await supabase_client.client.table("reel_interactions")\
                .select("id")\
                .eq("company_id", partnership["company_id"])\
                .eq("video_id", partnership["video_id"])\
                .execute()

            if existing.data and len(existing.data) > 0:
                print(f"⏭️  Interaction already exists for video {partnership['video_id']}")
                interactions_skipped += 1
                continue

            # Create interaction
            try:
                await supabase_client.client.table("reel_interactions").insert({
                    "company_id": partnership["company_id"],
                    "video_id": partnership["video_id"],
                    "interaction_type": "partnered",
                    "created_at": partnership["created_at"]  # Preserve original timestamp
                }).execute()

                interactions_created += 1
                print(f"✅ Created interaction for video {partnership['video_id']}")

            except Exception as e:
                print(f"❌ Error creating interaction for video {partnership['video_id']}: {e}")
                interactions_skipped += 1

        print("\n" + "="*60)
        print(f"✅ Backfill complete!")
        print(f"   Created: {interactions_created} interactions")
        print(f"   Skipped: {interactions_skipped} interactions")
        print("="*60)

    except Exception as e:
        print(f"❌ Error during backfill: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await supabase_client.close()


if __name__ == "__main__":
    asyncio.run(backfill_partnership_interactions())
