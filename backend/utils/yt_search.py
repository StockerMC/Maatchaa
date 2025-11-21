from __future__ import annotations
import os
from googleapiclient.discovery import build
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import traceback
from typing import Optional
import asyncio
import random

load_dotenv()

async def fetch_top_shorts(keyword: str, max_results: int = 10, relevance_language: Optional[list[str]] = None, region_code: str | None = None, order: str = "viewCount", published_after_days: int = 7):
    # Check if mock mode is enabled
    use_mock = os.getenv("USE_MOCK_YOUTUBE", "false").lower() == "true"

    if use_mock:
        print(f"🎭 Mock mode: Generating fake YouTube results for '{keyword}'")
        return await _generate_mock_videos(keyword, max_results)

    # Get API key from environment
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise ValueError("YOUTUBE_API_KEY not found in environment")

    youtube = build("youtube", "v3", developerKey=api_key)
    published_after = (datetime.now(timezone.utc) - timedelta(days=published_after_days)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Simplified params to reduce quota usage
    # videoDuration and location filters use extra quota units
    request_params = {
        "part": "snippet",
        "q": f"{keyword} #shorts",  # Use #shorts hashtag instead of videoDuration filter
        "type": "video",
        "maxResults": max_results,
        "order": order,
        "publishedAfter": published_after,
    }

    if relevance_language:
        request_params["relevanceLanguage"] = relevance_language
    if region_code:
        request_params["regionCode"] = region_code

    request = youtube.search().list(**request_params)
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(None, request.execute)

    videos = []
    video_ids = []

    # Collect video IDs first
    for item in response.get("items", []):
        video_ids.append(item["id"]["videoId"])

    if not video_ids:
        return []

    # Fetch video statistics in batch (more efficient)
    stats_request = youtube.videos().list(
        part="statistics,contentDetails",
        id=",".join(video_ids)
    )
    loop = asyncio.get_event_loop()
    stats_response = await loop.run_in_executor(None, stats_request.execute)

    # Create a map of video_id -> stats
    stats_map = {}
    for item in stats_response.get("items", []):
        stats_map[item["id"]] = {
            "views": int(item["statistics"].get("viewCount", 0)),
            "likes": int(item["statistics"].get("likeCount", 0)),
            "comments": int(item["statistics"].get("commentCount", 0)),
            "duration": item["contentDetails"].get("duration", ""),
        }

    # Build video list with stats
    for item in response.get("items", []):
        video_id = item["id"]["videoId"]
        snippet = item["snippet"]
        channel_id = snippet["channelId"]
        stats = stats_map.get(video_id, {})

        # Skip videos with very low engagement (likely private/unlisted/deleted)
        if stats.get("views", 0) < 1000:
            continue

        # Get channel email for this video (optional - skip if quota exceeded)
        try:
            email = await get_channel_email(channel_id)
        except Exception:
            # Quota exceeded or other error - use default email
            email = os.getenv("DEFAULT_EMAIL")

        videos.append({
            "id": video_id,
            "short_id": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "title": snippet["title"],
            "description": snippet["description"],
            "thumbnail": snippet["thumbnails"]["high"]["url"],
            "channelTitle": snippet["channelTitle"],
            "channel_id": channel_id,
            "publishedAt": snippet["publishedAt"],
            "email": email,
            "views": stats.get("views", 0),
            "likes": stats.get("likes", 0),
            "comments": stats.get("comments", 0),
        })

    return videos

async def get_channel_email(channel_id: str):
    """
    Fetches the email from a YouTube channel's description.

    Args:
        channel_id: The ID of the YouTube channel.

    Returns:
        The first email found in the description, or None if not found.
    """
    try:
        youtube = build("youtube", "v3")
        request = youtube.channels().list(
            part="snippet",
            id=channel_id
        )
        response = request.execute()

        if response.get("items"):
            description = response["items"][0]["snippet"]["description"]
            print(description)
            # TEMPORARILY:
            return os.getenv("DEFAULT_EMAIL")
            # match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", description)
            # if match:
                # return match.group(0)
        return os.getenv("DEFAULT_EMAIL")
    except Exception as e:
        print(f"An error occurred: {e}")
        traceback.print_exc()
        return None

async def _generate_mock_videos(keyword: str, max_results: int):
    """
    Generate mock YouTube video data for testing when API quota is exceeded.

    Args:
        keyword: The search keyword
        max_results: Number of mock videos to generate

    Returns:
        List of mock video dictionaries matching the real API format
    """
    mock_creators = [
        {"name": "TechReviews", "id": "UCmock001"},
        {"name": "ProductSpotlight", "id": "UCmock002"},
        {"name": "UnboxingPro", "id": "UCmock003"},
        {"name": "DailyDeals", "id": "UCmock004"},
        {"name": "TheBestProducts", "id": "UCmock005"},
        {"name": "ReviewMaster", "id": "UCmock006"},
    ]

    videos = []
    for i in range(min(max_results, len(mock_creators))):
        creator = mock_creators[i]
        video_id = f"mock{random.randint(1000, 9999)}{i}"

        videos.append({
            "id": video_id,
            "short_id": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "title": f"{keyword.title()} Review - {creator['name']}",
            "description": f"Check out this awesome {keyword}! Full review and unboxing.",
            "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
            "channelTitle": creator["name"],
            "channel_id": creator["id"],
            "publishedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "email": os.getenv("DEFAULT_EMAIL", "creator@example.com"),
        })

    return videos
