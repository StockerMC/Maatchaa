import os
from googleapiclient.discovery import build
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import traceback

load_dotenv()
API_KEY = "AQ.Ab8RN6KHcwQc_n4zGCkYw2FydTUNGHZ9MyhOIyI-w4lHTQ35ww"
async def fetch_top_shorts(keyword: str, max_results: int = 5, relevance_language: str = None, region_code: str = None, order: str = "viewCount", published_after_days: int = 7):
    youtube = build("youtube", "v3", developerKey=API_KEY)
    published_after = (datetime.now(timezone.utc) - timedelta(days=published_after_days)).isoformat("T") + "Z"

    request_params = {
        "part": "snippet",
        "q": keyword,
        "type": "video",
        "maxResults": max_results,
        "order": order,
        "publishedAfter": published_after,
        "videoDuration": "short"
    }

    if relevance_language:
        request_params["relevanceLanguage"] = relevance_language
    if region_code:
        request_params["regionCode"] = region_code

    request = youtube.search().list(**request_params)
    response = request.execute()

    videos = []
    for item in response.get("items", []):
        video_id = item["id"]["videoId"]
        snippet = item["snippet"]
        videos.append({
            "id": video_id,
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "title": snippet["title"],
            "description": snippet["description"],
            "thumbnail": snippet["thumbnails"]["high"]["url"],
            "channelTitle": snippet["channelTitle"],
            "publishedAt": snippet["publishedAt"],
        })

    return videos

# Example usage
import asyncio
analyzed_videos = asyncio.run((fetch_top_shorts(keyword="fitness")))
print(analyzed_videos)
