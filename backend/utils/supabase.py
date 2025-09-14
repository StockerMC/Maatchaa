from __future__ import annotations
import uuid

from supabase import acreate_client, AsyncClient
import os
from typing import List, Dict, Optional
from uuid import uuid4
from dotenv import load_dotenv
import base64
from io import BytesIO

class SupabaseClient:
    client: AsyncClient

    def __init__(self):
        load_dotenv()
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not self.url or not self.key:
            raise ValueError("Missing Supabase URL or Key in environment variables")

    @classmethod
    async def from_client(cls, client: AsyncClient) -> SupabaseClient:
        instance = cls()
        instance.client = client
        return instance

    async def post_row(self, title: str, showcase_images: List[str], products: Dict,
                 main_image_url: str, row_id: Optional[str] = None) -> Dict:
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
            "youtube_id": str(uuid4()), # Placeholder, replace with actual YouTube ID if available
            "title": title,
            "showcase_images": showcase_images,
            "products": products,
            "main_image_url": main_image_url
        }

        try:
            result = await self.client.table("youtube_shorts").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error posting to database: {e}")
            raise e

    async def upload_image_to_supabase(self, image: BytesIO, youtube_short_id: str) -> str | None:
        """
        Uploads an in-memory image file to Supabase Storage.

        Args:
            image: A file-like object (e.g., BytesIO) containing the image.
            file_name: The name to save the file as in Supabase Storage.
            bucket_name: The storage bucket name.

        Returns:
            The public URL of the uploaded image, or None if failed.
        """
        image.seek(0)
        file_name = f"{youtube_short_id}_showcase_{str(uuid4())}.png"
        try:
            response = await self.client.storage.from_('images').upload(file_name, image.read(), file_options={"content-type": "image/png"})
            public_url = await self.client.storage.from_('images').get_public_url(file_name)
        except Exception as e:
            print(f"Error uploading image to Supabase: {e}")
            return None

        return public_url
