#!/usr/bin/env python3
"""
Test YouTube API to see if search is working
"""
from dotenv import load_dotenv
load_dotenv()

import asyncio
import os
from utils.yt_search import fetch_top_shorts

async def test_youtube():
    print("🧪 Testing YouTube Search API\n")

    # Check API key
    api_key = os.getenv("YOUTUBE_API_KEY")
    if api_key:
        print(f"✅ YouTube API Key found: {api_key[:10]}...")
    else:
        print("❌ YouTube API Key NOT found in .env")
        print("   Add YOUTUBE_API_KEY to your .env file")
        return

    # Test with generic search that should definitely have results
    test_queries = [
        "snowboard review",  # Generic - should find many
        "The Collection Snowboard: Hydrogen",  # Your exact product
        "Selling Plans Ski Wax",  # Another product
    ]

    for query in test_queries:
        print(f"\n🔎 Searching: '{query}'")
        try:
            results = await fetch_top_shorts(
                keyword=query,
                max_results=5,
                published_after_days=30
            )

            if results:
                print(f"   ✅ Found {len(results)} videos!")
                for i, video in enumerate(results[:3], 1):
                    print(f"      {i}. {video['title'][:50]}...")
            else:
                print(f"   ❌ No results returned")

        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_youtube())
