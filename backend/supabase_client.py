from supabase import create_client, Client
import os
from typing import List, Dict, Optional
from uuid import uuid4
import json
from dotenv import load_dotenv

class SupabaseClient:
    def __init__(self):
        load_dotenv()
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not self.url or not self.key:
            raise ValueError("Missing Supabase URL or Key in environment variables")
        self.client: Client = create_client(self.url, self.key)

    def post_row(self, title: str, showcase_images: List[str], products: Dict,
                 main_image_url: str, row_id: str = None) -> Dict:
        """
        Post a complete row to the database

        Args:
            title: The title text
            showcase_images: Array of showcase image URLs
            products: JSONB object containing product data
            main_image_url: URL to the main image
            row_id: Optional UUIfD, will generate one if not provided

        Returns:
            Response from Supabase insert operation
        """
        data = {
            "id": row_id or str(uuid4()),
            "title": title,
            "showcase_images": showcase_images,
            "products": products,
            "main_image_url": main_image_url
        }

        try:
            result = self.client.table("youtube_shorts").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error posting to database: {e}")
            raise e

# Singleton instance
supabase_client = SupabaseClient()
