#!/usr/bin/env python3
"""Test improved discovery with relevance filtering and stats"""
import asyncio
from utils.yt_search import fetch_top_shorts
from utils.relevance import calculate_relevance_score, is_video_relevant

async def test():
    print("🔍 Testing improved YouTube discovery with relevance filtering\n")

    # Test product
    test_product = {
        "title": "Snowboard Complete Kit",
        "description": "Professional snowboarding equipment for beginners and pros"
    }

    print(f"📦 Test Product: {test_product['title']}")
    print(f"   Description: {test_product['description']}\n")

    # Search for videos
    keyword = "snowboard review"
    print(f"🔎 Searching YouTube for: '{keyword}'")

    videos = await fetch_top_shorts(
        keyword=keyword,
        max_results=5,
        published_after_days=60
    )

    if not videos:
        print("❌ No videos found")
        return

    print(f"✅ Found {len(videos)} videos\n")
    print("="*80)

    # Analyze relevance for each video
    for i, video in enumerate(videos, 1):
        print(f"\n{i}. {video['title'][:70]}")
        print(f"   Channel: {video['channelTitle']}")
        print(f"   Views: {video.get('views', 0):,}")
        print(f"   Likes: {video.get('likes', 0):,}")
        print(f"   URL: {video['url']}")

        # Calculate relevance (without Gemini analysis for now)
        score, reasoning = calculate_relevance_score(
            product=test_product,
            video=video,
            analysis={},  # No Gemini analysis yet
            source_keyword=keyword
        )

        is_relevant, relevance_reason = is_video_relevant(
            score=score,
            views=video.get('views', 0),
            min_score=5.0,
            min_views=5000
        )

        print(f"   📊 Relevance Score: {score:.1f}/10")
        print(f"   📈 Reasoning: {reasoning}")
        print(f"   {'✅ RELEVANT' if is_relevant else '❌ FILTERED OUT'}: {relevance_reason}")

    print("\n" + "="*80)

    # Summary
    relevant_count = sum(
        1 for v in videos
        if is_video_relevant(
            calculate_relevance_score(test_product, v, {}, keyword)[0],
            v.get('views', 0),
            5.0,
            5000
        )[0]
    )

    print(f"\n✨ Summary:")
    print(f"   Total videos found: {len(videos)}")
    print(f"   Relevant videos: {relevant_count}")
    print(f"   Filtered out: {len(videos) - relevant_count}")

if __name__ == "__main__":
    asyncio.run(test())
