#!/usr/bin/env python3
"""Test real YouTube search with actual parameters"""
import asyncio
from utils.yt_search import fetch_top_shorts

async def test():
    print("🔎 Testing real YouTube search...")
    
    try:
        results = await fetch_top_shorts(
            keyword="snowboard",
            max_results=3,
            published_after_days=30
        )
        
        if results:
            print(f"\n✅ SUCCESS! Found {len(results)} videos:\n")
            for i, video in enumerate(results, 1):
                print(f"{i}. {video['title']}")
                print(f"   Channel: {video['channelTitle']}")
                print(f"   URL: {video['url']}")
                print()
        else:
            print("❌ No results found")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
