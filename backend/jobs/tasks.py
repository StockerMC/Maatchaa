"""
Background job tasks using ARQ.

All long-running operations moved from asyncio.create_task() to persistent jobs.
Jobs survive server restarts and include automatic retries with exponential backoff.
"""
import json
import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()


# ============================================================================
# CREATOR DISCOVERY JOB
# ============================================================================

async def discover_creators_job(
    ctx: Dict[str, Any],
    company_id: str,
    shop_domain: str = None
) -> Dict[str, Any]:
    """
    Background job for creator discovery.

    Replaces the fire-and-forget asyncio.create_task() pattern.
    Uses distributed locking to prevent duplicate processing.

    Args:
        ctx: ARQ context (includes Redis connection)
        company_id: UUID of the company
        shop_domain: Optional shop domain to filter products

    Returns:
        Job result with status and metadata
    """
    from utils.supabase import SupabaseClient
    from utils.redis_client import DistributedLock

    print(f"[Job] Starting creator discovery for company: {company_id}")

    # Use distributed lock to prevent duplicate processing
    async with DistributedLock(f"discovery:{company_id}", timeout_seconds=3600) as acquired:
        if not acquired:
            print(f"[Job] Discovery already running for {company_id}")
            return {"status": "skipped", "reason": "already_running"}

        supabase = SupabaseClient()
        await supabase.initialize()

        try:
            # Import the actual discovery function
            from background_worker import trigger_immediate_discovery
            await trigger_immediate_discovery(company_id, shop_domain)

            return {
                "status": "success",
                "company_id": company_id,
                "shop_domain": shop_domain
            }
        except Exception as e:
            print(f"[Job] Discovery failed: {e}")
            raise  # ARQ will retry based on retry config
        finally:
            await supabase.close()


# ============================================================================
# EMAIL SENDING JOB
# ============================================================================

async def send_email_job(
    ctx: Dict[str, Any],
    to_email: str,
    creator_name: str,
    shop_name: str,
    products: list,
    partnership_id: str,
    custom_message: str = None
) -> Dict[str, Any]:
    """
    Background job for sending partnership emails with retries.

    Emails are critical - using a job queue ensures delivery even if
    the server crashes mid-send.

    Args:
        ctx: ARQ context
        to_email: Recipient email address
        creator_name: Name of the creator
        shop_name: Name of the shop/brand
        products: List of matched products
        partnership_id: UUID of the partnership
        custom_message: Optional custom message

    Returns:
        Job result with status and delivery info
    """
    from utils.supabase import SupabaseClient

    print(f"[Job] Sending email to {to_email} for partnership {partnership_id}")

    # Import email utility
    from utils.email import send_partnership_email

    app_url = os.getenv("APP_URL", "http://localhost:3000")
    partnership_url = f"{app_url}/partnership/{partnership_id}"

    success, message = await send_partnership_email(
        to_email=to_email,
        creator_name=creator_name,
        shop_name=shop_name,
        products=products,
        custom_message=custom_message,
        partnership_url=partnership_url
    )

    if not success:
        print(f"[Job] Email failed: {message}")
        raise Exception(f"Email failed: {message}")

    # Update partnership record
    supabase = SupabaseClient()
    await supabase.initialize()

    try:
        await supabase.client.table("partnerships").update({
            "email_sent": True,
            "last_contact_date": "now()",
            "status": "contacted",
            "contacted_at": "now()"
        }).eq("id", partnership_id).execute()

        return {"status": "sent", "to": to_email, "partnership_id": partnership_id}
    finally:
        await supabase.close()


# ============================================================================
# EMBEDDING GENERATION JOB
# ============================================================================

async def generate_embeddings_job(
    ctx: Dict[str, Any],
    video_id: str,
    text: str,
    product_id: str = None
) -> Dict[str, Any]:
    """
    Background job for generating Cohere embeddings.

    Rate-limited to respect API quotas. Uses distributed lock
    to prevent duplicate embedding generation.

    Args:
        ctx: ARQ context
        video_id: YouTube video ID
        text: Text to embed
        product_id: Optional product ID for linking

    Returns:
        Job result with status and embedding info
    """
    from utils.redis_client import DistributedLock, cohere_limiter
    from utils.vectordb import text_to_embedding, upsert_embeddings

    print(f"[Job] Generating embedding for video: {video_id}")

    # Check rate limit
    if not await cohere_limiter.is_allowed():
        print(f"[Job] Cohere rate limit exceeded, will retry")
        raise Exception("Cohere rate limit exceeded, will retry")

    async with DistributedLock(f"embedding:{video_id}") as acquired:
        if not acquired:
            return {"status": "skipped", "reason": "already_processing"}

        try:
            embedding_response = text_to_embedding(text)
            embedding_vector = embedding_response.embeddings.float_[0]

            upsert_embeddings([{
                "id": f"video_{video_id}",
                "values": embedding_vector,
                "metadata": {
                    "video_id": video_id,
                    "product_id": product_id,
                    "type": "creator_video"
                }
            }])

            return {"status": "success", "video_id": video_id}
        except Exception as e:
            print(f"[Job] Embedding generation failed: {e}")
            raise


# ============================================================================
# SHOPIFY SYNC JOB
# ============================================================================

async def sync_shopify_products_job(
    ctx: Dict[str, Any],
    shop: str,
    access_token: str,
    company_id: str
) -> Dict[str, Any]:
    """
    Background job for syncing products from Shopify.

    Moved from sync_products_background() in API.py to ensure
    persistence across server restarts.

    Args:
        ctx: ARQ context
        shop: Shopify shop domain
        access_token: Shopify access token
        company_id: UUID of the company

    Returns:
        Job result with sync status and product count
    """
    from utils.supabase import SupabaseClient
    from utils.shopify import get_products
    from utils.vectordb import embed_products, upsert_embeddings
    from utils.redis_client import DistributedLock

    print(f"[Job] Syncing products for shop: {shop}")

    async with DistributedLock(f"shopify_sync:{shop}", timeout_seconds=1800) as acquired:
        if not acquired:
            return {"status": "skipped", "reason": "sync_already_running"}

        supabase = SupabaseClient()
        await supabase.initialize()

        try:
            # Fetch products from Shopify
            products = get_products(shop, access_token=access_token)
            print(f"[Job] Found {len(products)} products in shop")

            if not products:
                return {"status": "success", "count": 0}

            # Create embeddings
            product_embeddings = embed_products(products)
            upsert_embeddings(product_embeddings)
            print(f"[Job] Stored {len(product_embeddings)} embeddings in Pinecone")

            # Store in Supabase
            for i, product in enumerate(products):
                await supabase.client.table("company_products").upsert({
                    "company_id": company_id,
                    "shop_domain": shop,
                    "title": product["name"],
                    "description": product.get("body_html", ""),
                    "image": product.get("image", ""),
                    "price": product.get("price", 0),
                    "pinecone_id": str(i),
                    "synced_at": "now()"
                }, on_conflict="company_id,shop_domain,title").execute()

            # Update sync status
            await supabase.client.table("shopify_oauth_tokens").update({
                "products_synced": True,
                "last_product_sync": "now()",
                "product_count": len(products)
            }).eq("company_id", company_id).eq("shop_domain", shop).execute()

            print(f"[Job] Product sync complete for {shop}")

            return {"status": "success", "count": len(products), "shop": shop}

        except Exception as e:
            print(f"[Job] Product sync failed: {e}")
            raise
        finally:
            await supabase.close()


# ============================================================================
# VIDEO PROCESSING JOB
# ============================================================================

async def process_video_job(
    ctx: Dict[str, Any],
    video_id: str,
    video_data: dict,
    product_id: str,
    source_keyword: str
) -> Dict[str, Any]:
    """
    Background job for processing a single creator video.

    Includes Gemini analysis, embedding, and database storage.
    Uses rate limiting for external API calls.

    Args:
        ctx: ARQ context
        video_id: YouTube video ID
        video_data: Video metadata dict
        product_id: Product ID to link
        source_keyword: Search keyword that found this video

    Returns:
        Job result with processing status
    """
    from utils.supabase import SupabaseClient
    from utils.redis_client import DistributedLock, gemini_limiter

    print(f"[Job] Processing video: {video_id}")

    async with DistributedLock(f"video:{video_id}") as acquired:
        if not acquired:
            return {"status": "skipped", "reason": "already_processing"}

        # Check Gemini rate limit
        if not await gemini_limiter.is_allowed():
            print(f"[Job] Gemini rate limit exceeded, will retry")
            raise Exception("Gemini rate limit exceeded, will retry")

        supabase = SupabaseClient()
        await supabase.initialize()

        try:
            # Get product data
            product_result = await supabase.client.table("company_products")\
                .select("id, title, description")\
                .eq("id", product_id)\
                .single()\
                .execute()

            if not product_result.data:
                return {"status": "failed", "reason": "product_not_found"}

            product = product_result.data

            # Import and call the video processor
            from background_worker import process_creator_video
            await process_creator_video(
                video=video_data,
                product=product,
                source_keyword=source_keyword,
                supabase=supabase
            )

            return {"status": "success", "video_id": video_id}
        except Exception as e:
            print(f"[Job] Video processing failed: {e}")
            raise
        finally:
            await supabase.close()


# ============================================================================
# TRIGGER DISCOVERY WITH QUEUE
# ============================================================================

async def trigger_discovery_with_queue_job(
    ctx: Dict[str, Any],
    company_id: str,
    shop_domain: str = None
) -> Dict[str, Any]:
    """
    Trigger creator discovery and optionally enqueue follow-up jobs.

    This is a lighter version that just triggers the discovery
    and returns immediately. Useful when you want the discovery
    to happen but don't need to track its completion.
    """
    from utils.redis_client import DistributedLock

    async with DistributedLock(f"discovery_trigger:{company_id}", timeout_seconds=60) as acquired:
        if not acquired:
            return {"status": "skipped", "reason": "already_triggered"}

        # Import and run discovery
        from background_worker import trigger_immediate_discovery
        await trigger_immediate_discovery(company_id, shop_domain)

        return {"status": "triggered", "company_id": company_id}
