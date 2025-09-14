import asyncio
from supabase import acreate_client, AsyncClient
import os
from dotenv import load_dotenv
from utils.supabase import SupabaseClient
import product_showcase as ps
from utils.video import parse_video
import json

async def main():
    load_dotenv()

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Missing Supabase URL or Key in environment variables")

    client = await SupabaseClient.from_client(await acreate_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
    ))

    short_url = "https://www.youtube.com/shorts/MzIen6fSQwA"
    query = await parse_video(short_url)
    print("Query:", query)
    if query[1] == 200:
        await client.post_yt_row("labubu", short_url, query[0])
    # TODO: create the automatic background searches

asyncio.run(main())

