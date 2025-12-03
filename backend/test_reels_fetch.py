#!/usr/bin/env python3
"""Test that reels data can be fetched like the frontend does"""
import asyncio
from utils.supabase import SupabaseClient

async def main():
    print("🎬 Testing Reels Data Fetch (simulating frontend)...\n")
    
    supabase = SupabaseClient()
    await supabase.initialize()
    
    # Fetch creator videos the same way the frontend does
    result = await supabase.client.table("creator_videos").select("*").order("indexed_at", desc=True).limit(50).execute()
    
    videos = result.data or []
    
    print(f"✅ Found {len(videos)} creator videos\n")
    
    # Show sample data (what frontend will receive)
    for i, video in enumerate(videos[:5], 1):
        print(f"{i}. {video['title']}")
        print(f"   Channel: {video['channel_title']}")
        print(f"   URL: {video['url']}")
        print(f"   Email: {video.get('email', 'N/A')}")
        print()
    
    # Check if they have the required fields for the frontend
    if videos:
        sample = videos[0]
        required_fields = ['id', 'video_id', 'url', 'title', 'channel_title', 'channel_id']
        missing = [f for f in required_fields if f not in sample]
        
        if missing:
            print(f"⚠️  Missing fields: {missing}")
        else:
            print("✅ All required fields present for frontend!")

if __name__ == "__main__":
    asyncio.run(main())
