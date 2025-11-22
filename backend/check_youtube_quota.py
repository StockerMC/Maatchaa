#!/usr/bin/env python3
"""Check YouTube API quota details"""
from dotenv import load_dotenv
load_dotenv()

import os
from googleapiclient.discovery import build

api_key = os.getenv("YOUTUBE_API_KEY")
print(f"API Key: {api_key[:20]}...")

try:
    youtube = build("youtube", "v3", developerKey=api_key)
    
    # Try a very simple search with max_results=1
    request = youtube.search().list(
        part="snippet",
        q="test",
        type="video",
        maxResults=1
    )
    
    response = request.execute()
    print("\n✅ API IS WORKING!")
    print(f"Found {len(response.get('items', []))} videos")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    if "quota" in str(e).lower():
        print("\n⚠️  This project's quota is exhausted.")
        print("You need to either:")
        print("  1. Wait for quota reset (midnight PT)")
        print("  2. Create ANOTHER new Google Cloud project")
        print("  3. Enable billing on this project for higher quota")
