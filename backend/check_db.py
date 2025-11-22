#!/usr/bin/env python3
"""Quick script to check database state"""
import asyncio
from utils.supabase import SupabaseClient

async def main():
    supabase = SupabaseClient()
    await supabase.initialize()
    
    # Check products
    products = await supabase.client.table("company_products").select("*").execute()
    print(f"📦 Products in DB: {len(products.data)}")
    for p in products.data[:3]:
        print(f"   - {p['title']} ({p['shop_domain']})")
    
    # Check creator videos
    videos = await supabase.client.table("creator_videos").select("*").execute()
    print(f"\n🎥 Creator videos in DB: {len(videos.data)}")
    for v in videos.data[:3]:
        print(f"   - {v['title']} by {v['channel_title']}")
    
    # Check matches
    matches = await supabase.client.table("product_creator_matches").select("*").execute()
    print(f"\n🔗 Product-Creator matches: {len(matches.data)}")

if __name__ == "__main__":
    asyncio.run(main())
