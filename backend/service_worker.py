import asyncio
import json
from supabase import acreate_client, AsyncClient
import os
from dotenv import load_dotenv
from utils.supabase import SupabaseClient
import product_showcase as ps
from utils.video import parse_video
from utils.yt_search import fetch_top_shorts

async def evaluate_video(short_url: str, client: SupabaseClient) -> bool:
    if await client.video_exists(short_url):
        print(f"Video {short_url} already exists in the database.")
        return False
    await client.add_video_to_all(short_url)
    query = await parse_video(short_url)
    print("Query:", query)
    if query[1] == 200:
        chosen_products = ps.choose_best_products(json.dumps(query[0]))
        if not chosen_products:
            return False

        store = {}
        for p in chosen_products:
            if p["vendor"] not in store:
                store[p["vendor"]] = {"titles": [], "images": []}
            store[p["vendor"]]["titles"].append(p["title"])
            store[p["vendor"]]["images"].append(p["image"])

        await asyncio.gather(*[client.post_yt_row(key, short_url, value["images"], value["titles"]) for key, value in store.items()])

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

    shorts = await fetch_top_shorts("matcha")
    print(shorts)
    for short in shorts:
        await evaluate_video(short["url"], client)

asyncio.run(main())

