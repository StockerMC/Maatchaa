import asyncio
from supabase import acreate_client, AsyncClient
import os
from dotenv import load_dotenv
from utils.supabase import SupabaseClient
import product_showcase as ps

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

    await ps.create_showcase("performative soft male aesthetic", client)

    # TODO: create the automatic background searches

asyncio.run(main())

