from supabase import acreate_client, AsyncClient
import os
from typing import List, Dict, Optional
from uuid import uuid4
from dotenv import load_dotenv
import base64
from io import BytesIO

class SupabaseClient:
    def __init__(self):
        load_dotenv()
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not self.url or not self.key:
            raise ValueError("Missing Supabase URL or Key in environment variables")

        # TODO
        # self.client: AsyncClient = await acreate_client(self.url, self.key)

    async def post_row(self, title: str, showcase_images: List[str], products: Dict,
                 main_image_url: str, row_id: str | None = None) -> Dict:
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
            result = await self.client.table("youtube_shorts").insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error posting to database: {e}")
            raise e

    async def upload_image_to_supabase(self, image_b64: str, youtube_short_id: str) -> str | None:
        """
        Uploads an in-memory image file to Supabase Storage.

        Args:
            image: A file-like object (e.g., BytesIO) containing the image.
            file_name: The name to save the file as in Supabase Storage.
            bucket_name: The storage bucket name.

        Returns:
            The public URL of the uploaded image, or None if failed.
        """
        # Remove base64 prefix if present
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]
        image_bytes = base64.b64decode(image_b64)
        file_obj = BytesIO(image_bytes)
        file_obj.seek(0)
        file_name = f"{youtube_short_id}_showcase_{str(uuid4())}.png"
        try:
            response = await self.client.storage.from_('images').upload(file_name, file_obj.read())
            public_url = await self.client.storage.from_('images').get_public_url(file_name)
        except Exception as e:
            print(f"Error uploading image to Supabase: {e}")
            return None

        await (self.client
            .table('youtube_shorts')
            .update({"showcase_images": [public_url]})
            .eq("id", youtube_short_id)
            .execute())

        return public_url

client = SupabaseClient()
