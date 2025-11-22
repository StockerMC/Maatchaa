T6Y7Y7











import asyncio
from utils.supabase import SupabaseClient

async def check():
    sb = SupabaseClient()
    await sb.initialize()
    
    result = await sb.client.table('company_products')\
        .select('title, search_keywords')\
        .execute()
    
    for p in result.data:
        kw = p.get('search_keywords', [])
        print(f'{p["title"][:40]:40} → {len(kw)} keywords')
    
    await sb.close()

asyncio.run(check())