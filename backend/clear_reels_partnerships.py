"""
Clear all reels and partnerships from the database
WARNING: This will delete all data from these tables!
"""

import asyncio
from utils.supabase import SupabaseClient


async def clear_database():
    """
    Clear all reels, partnerships, and related data
    """
    supabase_client = SupabaseClient()
    await supabase_client.initialize()

    try:
        print("⚠️  WARNING: This will delete all reels and partnerships data!")
        print("=" * 60)

        # Clear reel_interactions
        print("🗑️  Clearing reel_interactions...")
        result = await supabase_client.client.table("reel_interactions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   Deleted from reel_interactions")

        # Clear partnerships
        print("🗑️  Clearing partnerships...")
        result = await supabase_client.client.table("partnerships").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   Deleted from partnerships")

        # Clear product_creator_matches
        print("🗑️  Clearing product_creator_matches...")
        result = await supabase_client.client.table("product_creator_matches").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   Deleted from product_creator_matches")

        # Clear creator_videos
        print("🗑️  Clearing creator_videos...")
        result = await supabase_client.client.table("creator_videos").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   Deleted from creator_videos")

        # Clear yt_shorts_pending (legacy)
        print("🗑️  Clearing yt_shorts_pending...")
        result = await supabase_client.client.table("yt_shorts_pending").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print(f"   Deleted from yt_shorts_pending")

        print("\n" + "=" * 60)
        print("✅ Database cleared successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await supabase_client.close()


if __name__ == "__main__":
    print("\n⚠️  Are you sure you want to clear all reels and partnerships?")
    print("This action cannot be undone!")
    response = input("Type 'yes' to continue: ")

    if response.lower() == 'yes':
        asyncio.run(clear_database())
    else:
        print("❌ Cancelled")
