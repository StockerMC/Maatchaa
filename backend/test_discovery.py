#!/usr/bin/env python3
"""Test immediate creator discovery with mock mode"""
import asyncio
from background_worker import trigger_immediate_discovery
from utils.supabase import SupabaseClient

async def main():
    print("🚀 Testing immediate creator discovery with MOCK mode...\n")
    
    # Get first company
    supabase = SupabaseClient()
    await supabase.initialize()
    
    products = await supabase.client.table("company_products").select("company_id, shop_domain").limit(1).execute()
    
    if not products.data:
        print("❌ No products found in database")
        return
    
    company_id = products.data[0]["company_id"]
    shop_domain = products.data[0]["shop_domain"]
    
    print(f"📍 Company: {company_id}")
    print(f"📍 Shop: {shop_domain}\n")
    
    # Trigger discovery
    await trigger_immediate_discovery(company_id, shop_domain)
    
    print("\n✅ Discovery completed! Checking results...\n")
    
    # Check updated counts
    videos = await supabase.client.table("creator_videos").select("*").execute()
    print(f"🎥 Total creator videos now: {len(videos.data)}")
    
    matches = await supabase.client.table("product_creator_matches").select("*").execute()
    print(f"🔗 Total matches now: {len(matches.data)}")

if __name__ == "__main__":
    asyncio.run(main())
