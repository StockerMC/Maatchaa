from dotenv import load_dotenv
load_dotenv()

import asyncio
from utils import shopify, vectordb, yt_search
from blacksheep import Request, Application, delete, get, post, patch, json, redirect
from blacksheep.server.cors import CORSPolicy
from utils.supabase import SupabaseClient
import product_showcase as ps
from utils.video import parse_video
import json as json_lib
from utils.shopify_oauth import (
    generate_nonce,
    build_install_url,
    exchange_code_for_token,
    verify_shopify_request,
    validate_shop_domain,
    get_shop_info,
    create_uninstall_webhook,
    ShopifyOAuthError,
    APP_URL
)
from utils.shopify_api import ShopifyAPIClient

app = Application()

# Configure CORS
app.use_cors(
    allow_methods="GET POST PUT PATCH DELETE OPTIONS",
    allow_origins="*",  # In production, specify exact origins
    allow_headers="*",
    allow_credentials=True,
    max_age=86400  # Cache preflight for 24 hours
)

# Global SupabaseClient instance
supabase_client: SupabaseClient | None = None

@app.on_start
async def on_start(application: Application):
    """Initialize global resources when the application starts"""
    global supabase_client
    supabase_client = SupabaseClient()
    await supabase_client.initialize()
    print("✅ SupabaseClient initialized")

@app.after_start
async def after_start(application: Application):
    """Called after the application has started"""
    print("🚀 BlackSheep application started successfully")

@get("/health")
async def health_check():
    """Health check endpoint"""
    return json({
        "status": "healthy",
        "service": "maatchaa-api"
    })

@app.on_stop
async def on_stop(application: Application):
    """Clean up global resources when the application shuts down"""
    global supabase_client
    if supabase_client:
        await supabase_client.close()
        print("✅ SupabaseClient closed")

# Shopify App landing page
@get("/")
async def app_home():
    from blacksheep import html
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Maatchaa - Connected</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        h1 {
            color: #2d3748;
            margin-bottom: 1rem;
            font-size: 2rem;
        }
        .status {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: #48bb78;
            color: white;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }
        .logo {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        p {
            color: #4a5568;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        .api-info {
            background: #f7fafc;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1.5rem;
            font-size: 0.875rem;
            color: #718096;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🎯</div>
        <h1>Maatchaa API</h1>
        <div class="status">✓ Python Backend Connected</div>
        <p>Your Shopify app is successfully connected to the Maatchaa API.</p>
        <p>AI-powered creator discovery and partnership management platform.</p>
        <div class="api-info">
            <strong>API Status:</strong> Running<br>
            <strong>Service:</strong> maatchaa-api<br>
            <strong>Health:</strong> Healthy
        </div>
    </div>
</body>
</html>"""
    return html(html_content)

# Ingest products from Shopify store
@post("/ingest")
async def ingest_products(request: Request):
    try:
        data = await request.json()
        shop_url = data.get("shop_url")

        if not shop_url:
            return json({"error": "shop_url is required"}, status=200)

        # Get products from Shopify
        products = shopify.get_products(shop_url)

        products_with_images = [p for p in products if p.get("image")]

        if not products_with_images:
            return json({"error": "No products with images found"}, status=200)

        # Create embeddings and upsert to vector DB
        embeddings = vectordb.embed_products(products_with_images)
        vectordb.upsert_embeddings(embeddings)

        return json({
            "message": f"Successfully ingested {len(embeddings)} products",
            "products_processed": len(embeddings),
            "total_products": len(products)
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=200)

# Search for similar products by image URL
@post("/search/image")
async def search_by_image(request: Request):
    try:
        data = await request.json()
        image_url = data.get("image_url")
        top_k = data.get("top_k", 5)

        if not image_url:
            return json({"error": "image_url is required"}, status=400)

        # Get embedding for the query image
        embedding_response = vectordb.imageurl_to_embedding(image_url)
        query_vector = embedding_response.embeddings.float_[0]

        # Search in vector database
        results = vectordb.index.query(
            vector=query_vector,
            top_k=top_k,
            include_metadata=True
        )

        return json({
            "query_image": image_url,
            "results": [
                {
                    "id": match.id,
                    "score": match.score,
                    "metadata": match.metadata
                }
                for match in results.matches
            ]
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

# Search products by text query (using metadata)
@post("/search/text")
async def search_by_text(request: Request):
    try:
        data = await request.json()
        query_text = data.get("query")
        top_k = data.get("top_k", 10)

        if not query_text:
            return json({"error": "query is required"}, status=400)

        # Search using metadata filter (simple text search in body_html)
        results = vectordb.index.query(
            vector=vectordb.text_to_embedding(query_text).embeddings.float_[0],
            top_k=top_k,
            include_values=False,
            include_metadata=True
        )

        return json({
            "query": query_text,
            "results": [
                {
                    "id": match.id,
                    "score": match.score,
                    "metadata": match.metadata
                }
                for match in results.matches
            ]
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

# Get all products (with pagination)
@get("/products/vector-search")
async def get_products_vector(request: Request):
    """
    Legacy endpoint: Query products from Pinecone vector database
    Note: Use GET /products instead for company products from Supabase
    """
    try:
        # Get query parameters
        limit = int(request.query.get("limit", "20"))
        offset = int(request.query.get("offset", "0"))

        # Query vector database to get products
        results = vectordb.index.query(
            vector=[0.0] * 1024,  # Dummy vector to get all results
            top_k=min(limit, 100),  # Pinecone has limits
            include_metadata=True
        )

        return json({
            "products": [
                {
                    "id": match.id,
                    "metadata": match.metadata
                }
                for match in results.matches[offset:offset+limit]
            ],
            "total_returned": len(results.matches),
            "limit": limit,
            "offset": offset
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

# Get specific product by ID
@get("/products/{product_id}")
async def get_product(product_id: str):
    try:
        # Fetch specific product by ID
        results = vectordb.index.fetch(ids=[product_id])

        if product_id not in results.vectors:
            return json({"error": "Product not found"}, status=404)

        product = results.vectors[product_id]

        return json({
            "id": product_id,
            "metadata": product.metadata,
            "values": product.values  # Include embedding values if needed
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

# Delete products (useful for testing)
@delete("/products/{product_id}")
async def delete_product(product_id: str):
    try:
        vectordb.index.delete(ids=[product_id])
        return json({"message": f"Product {product_id} deleted successfully"})

    except Exception as e:
        return json({"error": str(e)}, status=500)

# Get database stats
@get("/stats")
async def get_stats():
    try:
        stats = vectordb.index.describe_index_stats()
        return json({
            "total_vectors": stats.total_vector_count,
            "dimension": stats.dimension,
            "index_fullness": stats.index_fullness,
            "namespaces": dict(stats.namespaces) if stats.namespaces else {}
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

@delete("/pending-shorts")
async def delete_pending_short(id: str):
    try:
        global supabase_client
        await supabase_client.delete_pending_short(id)
        return json({"message": "short deleted successfully"})
    except Exception as e:
        return json({"error": str(e)}, status=500)

@post("/comments/update")
async def update_comment(request: Request):
    try:
        data = await request.json()

        # Validate required fields
        required_fields = ["channel_id", "comment_id", "text"]
        for field in required_fields:
            if field not in data:
                return json({"error": f"Missing required field: {field}"}, status=400)

        # Extract fields
        channel_id = data["channel_id"]
        comment_id = data["comment_id"]
        new_text = data["text"]
        video_id = data.get("video_id")  # Optional, but required if comment doesn't exist

        from utils.comments import update_comment as yt_update_comment

        # Update or create the comment using the YouTube API
        updated_comment = await yt_update_comment(channel_id, comment_id, new_text, video_id)

        return json({
            "message": "Comment updated/created successfully",
            "comment": updated_comment
        })

    except ValueError as e:
        # Handle specific errors (like missing tokens)
        return json({"error": str(e)}, status=400)
    except Exception as e:
        # Handle unexpected errors
        print(f"Error updating comment: {str(e)}")
        return json({"error": "Failed to update comment"}, status=500)

@post("/create-showcase")
async def create_showcase(request: Request):
    try:
        assert supabase_client

        data = await request.json()

        query = await parse_video(data["url"])
        res = await ps.create_showcase(
            query=json_lib.dumps(query[0]),
            supabase_client=supabase_client
        )

        if not res:
            return json({"error": "Failed to create showcase"}, status=500)

        return json({
            "message": "Showcase created successfully",
            "slug": res
        })

    except Exception as e:
        print(f"Error creating showcase: {str(e)}")
        return json({"error": "Failed to create showcase"}, status=500)

@get("/channel/email/{channel_id}")
async def get_channel_email_endpoint(channel_id: str):
    try:
        email = await yt_search.get_channel_email(channel_id)
        if email is not None:
            return json({"channel_id": channel_id, "email": email})
        else:
            return json({"error": "Email not found in channel description"}, status=404)
    except Exception as e:
        return json({"error": str(e)}, status=500)

# ============ Shopify Product Management Endpoints ============

@post("/shopify/products/sync")
async def sync_shopify_products(request: Request):
    """Save or update Shopify products in the database"""
    try:
        assert supabase_client
        data = await request.json()

        store_url = data.get("store_url")
        products = data.get("products", [])

        if not store_url or not products:
            return json({"error": "store_url and products are required"}, status=400)

        saved_count = 0
        updated_count = 0

        for product in products:
            # Check if product already exists
            result = await supabase_client.client.table("shopify_products").select("id").eq("shopify_id", product["shopifyId"]).eq("store_url", store_url).execute()

            product_data = {
                "shopify_id": product["shopifyId"],
                "store_url": store_url,
                "title": product["name"],
                "handle": product["handle"],
                "body_html": product.get("description", ""),
                "vendor": product["vendor"],
                "product_type": product["category"],
                "tags": product.get("tags", []),
                "variants": product["variants"],
                "images": product["images"],
                "options": product.get("options", []),
                "updated_at": "now()"
            }

            if result.data and len(result.data) > 0:
                # Update existing product
                await supabase_client.client.table("shopify_products").update(product_data).eq("id", result.data[0]["id"]).execute()
                updated_count += 1
            else:
                # Insert new product
                await supabase_client.client.table("shopify_products").insert(product_data).execute()
                saved_count += 1

        return json({
            "message": "Products synced successfully",
            "saved": saved_count,
            "updated": updated_count,
            "total": len(products)
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)

@get("/shopify/products")
async def get_shopify_products(request: Request):
    """Retrieve Shopify products from the database"""
    try:
        assert supabase_client

        store_url = request.query.get("store_url")
        limit = int(request.query.get("limit", "50"))
        offset = int(request.query.get("offset", "0"))

        query = supabase_client.client.table("shopify_products").select("*")

        if store_url:
            query = query.eq("store_url", store_url)

        result = await query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()

        # Transform to match frontend Product interface
        products = []
        for row in result.data:
            products.append({
                "id": str(row["id"]),
                "shopifyId": row["shopify_id"],
                "name": row["title"],
                "description": row["body_html"][:150] + "..." if len(row["body_html"]) > 150 else row["body_html"],
                "price": min([float(v["price"]) for v in row["variants"]]) if row["variants"] else 0,
                "compareAtPrice": float(row["variants"][0].get("compare_at_price")) if row["variants"] and row["variants"][0].get("compare_at_price") else None,
                "category": row["product_type"],
                "vendor": row["vendor"],
                "imageUrl": row["images"][0]["src"] if row["images"] else "",
                "images": row["images"],
                "shopifyUrl": f"{row['store_url']}/products/{row['handle']}",
                "status": "Active" if any(v.get("available") for v in row["variants"]) else "Out of Stock",
                "matchCount": row["match_count"],
                "lastMatched": row["last_matched_at"] or "Never",
                "variants": row["variants"],
                "tags": row["tags"],
                "options": row["options"],
                "handle": row["handle"]
            })

        return json({
            "products": products,
            "count": len(products),
            "offset": offset,
            "limit": limit
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)

@get("/shopify/products/{product_id}")
async def get_shopify_product_by_id(product_id: str):
    """Get a specific Shopify product by ID"""
    try:
        assert supabase_client

        result = await supabase_client.client.table("shopify_products").select("*").eq("id", product_id).execute()

        if not result.data:
            return json({"error": "Product not found"}, status=404)

        row = result.data[0]
        product = {
            "id": str(row["id"]),
            "shopifyId": row["shopify_id"],
            "name": row["title"],
            "description": row["body_html"],
            "price": min([float(v["price"]) for v in row["variants"]]) if row["variants"] else 0,
            "compareAtPrice": float(row["variants"][0].get("compare_at_price")) if row["variants"] and row["variants"][0].get("compare_at_price") else None,
            "category": row["product_type"],
            "vendor": row["vendor"],
            "imageUrl": row["images"][0]["src"] if row["images"] else "",
            "images": row["images"],
            "shopifyUrl": f"{row['store_url']}/products/{row['handle']}",
            "status": "Active" if any(v.get("available") for v in row["variants"]) else "Out of Stock",
            "matchCount": row["match_count"],
            "lastMatched": row["last_matched_at"],
            "variants": row["variants"],
            "tags": row["tags"],
            "options": row["options"],
            "handle": row["handle"]
        }

        return json({"product": product})

    except Exception as e:
        return json({"error": str(e)}, status=500)

@post("/shopify/products/{product_id}/match")
async def record_product_match(product_id: str, request: Request):
    """Record a match between a product and a video"""
    try:
        assert supabase_client
        data = await request.json()

        short_id = data.get("short_id")
        match_score = data.get("match_score", 0.0)

        if not short_id:
            return json({"error": "short_id is required"}, status=400)

        # Insert match record
        await supabase_client.client.table("product_matches").insert({
            "product_id": product_id,
            "short_id": short_id,
            "match_score": match_score
        }).execute()

        # Update product match count and last matched timestamp
        await supabase_client.client.rpc("increment_product_match_count", {"product_uuid": product_id}).execute()
        await supabase_client.client.table("shopify_products").update({
            "last_matched_at": "now()"
        }).eq("id", product_id).execute()

        return json({"message": "Match recorded successfully"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)

@get("/shopify/products/{product_id}/matches")
async def get_product_matches(product_id: str):
    """Get all video matches for a specific product"""
    try:
        assert supabase_client

        result = await supabase_client.client.table("product_matches").select("*, youtube_shorts(*)").eq("product_id", product_id).order("matched_at", desc=True).execute()

        matches = []
        for row in result.data:
            matches.append({
                "id": row["id"],
                "matchScore": row["match_score"],
                "matchedAt": row["matched_at"],
                "short": row["youtube_shorts"]
            })

        return json({
            "matches": matches,
            "count": len(matches)
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

# ============ Shopify OAuth Endpoints ============

@get("/shopify/install")
async def shopify_install(request: Request):
    """
    Initiate Shopify OAuth flow

    Query params:
        - shop: Shopify store domain (e.g., 'my-store.myshopify.com' or 'my-store')
        - company_id: The company ID from our database

    Redirects merchant to Shopify authorization page
    """
    try:
        assert supabase_client

        shop = request.query.get("shop")
        company_id = request.query.get("company_id")

        # Handle if parameters are returned as lists
        if isinstance(shop, list):
            shop = shop[0] if shop else None
        if isinstance(company_id, list):
            company_id = company_id[0] if company_id else None

        if not shop:
            return json({"error": "Missing 'shop' parameter"}, status=400)

        if not company_id:
            return json({"error": "Missing 'company_id' parameter"}, status=400)

        # Extract and clean shop domain
        shop = shop.replace("https://", "").replace("http://", "")

        # Remove trailing slashes
        shop = shop.rstrip("/")

        # Handle admin URL format: admin.shopify.com/store/my-store
        if "admin.shopify.com/store/" in shop:
            shop = shop.split("admin.shopify.com/store/")[-1]
            shop = shop.split("/")[0]  # Remove any trailing paths

        # Remove .myshopify.com if present, we'll add it back
        shop = shop.replace(".myshopify.com", "")

        # Add .myshopify.com
        shop = f"{shop}.myshopify.com"

        # Validate shop domain
        if not validate_shop_domain(shop):
            return json({"error": "Invalid shop domain"}, status=400)

        # Generate random state for CSRF protection
        state = generate_nonce()

        # Store state in database for verification
        await supabase_client.client.table("shopify_oauth_states").insert({
            "state": state,
            "company_id": company_id,
            "shop_domain": shop
        }).execute()

        # Build OAuth authorization URL
        auth_url = build_install_url(shop, state)

        # Use JavaScript redirect to avoid ampersand escaping issues
        # (BlackSheep's redirect() might HTML-escape & to &amp;)
        return json({
            "redirect_url": auth_url
        })

    except ShopifyOAuthError as e:
        return json({"error": str(e)}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)

async def sync_products_background(shop: str, access_token: str, company_id: str):
    """
    Background task to sync products after OAuth (doesn't block redirect)
    """
    try:
        from utils.shopify import get_products
        from utils.vectordb import embed_products, upsert_embeddings

        print(f"🔄 [Background] Syncing products for {shop}...")
        products = get_products(shop, access_token=access_token)
        print(f"✅ [Background] Found {len(products)} products")

        # Create embeddings
        product_embeddings = embed_products(products)

        # Store in Pinecone
        upsert_embeddings(product_embeddings)
        print(f"✅ [Background] Stored {len(product_embeddings)} embeddings in Pinecone")

        # Store in Supabase
        for i, product in enumerate(products):
            await supabase_client.client.table("company_products").insert({
                "company_id": company_id,
                "shop_domain": shop,
                "title": product["name"],
                "description": product.get("body_html", ""),
                "image": product.get("image", ""),
                "price": product.get("price", 0),
                "pinecone_id": str(i),
                "synced_at": "now()"
            }).execute()

        # Update sync status
        await supabase_client.client.table("shopify_oauth_tokens").update({
            "products_synced": True,
            "last_product_sync": "now()",
            "product_count": len(products)
        }).eq("company_id", company_id).eq("shop_domain", shop).execute()

        print(f"✅ [Background] Product sync complete for {shop}")

        # Trigger immediate creator discovery
        try:
            from background_worker import trigger_immediate_discovery
            asyncio.create_task(trigger_immediate_discovery(company_id, shop))
            print(f"🚀 [Background] Triggered immediate creator discovery for {shop}")
        except Exception as discovery_error:
            print(f"⚠️  [Background] Failed to trigger discovery: {discovery_error}")

    except Exception as sync_error:
        print(f"❌ [Background] Product sync failed: {sync_error}")
        import traceback
        traceback.print_exc()


@get("/shopify/callback")
async def shopify_callback(request: Request):
    """
    OAuth callback endpoint - Shopify redirects here after merchant authorizes

    Query params (from Shopify):
        - code: Authorization code
        - hmac: HMAC signature for verification
        - shop: Shop domain
        - state: CSRF protection token
        - timestamp: Request timestamp
    """
    try:
        assert supabase_client

        # Extract query parameters
        query_params = dict(request.query)

        code = query_params.get("code")
        hmac_param = query_params.get("hmac")
        shop = query_params.get("shop")
        state = query_params.get("state")

        # Handle if parameters are returned as lists by BlackSheep
        if isinstance(code, list):
            code = code[0] if code else None
        if isinstance(hmac_param, list):
            hmac_param = hmac_param[0] if hmac_param else None
        if isinstance(shop, list):
            shop = shop[0] if shop else None
        if isinstance(state, list):
            state = state[0] if state else None

        # Validate required parameters
        if not all([code, hmac_param, shop, state]):
            return json({"error": "Missing required OAuth parameters"}, status=400)

        # Verify HMAC signature
        if not verify_shopify_request(query_params):
            return json({"error": "Invalid HMAC signature"}, status=403)

        # Verify and retrieve state from database
        state_result = await supabase_client.client.table("shopify_oauth_states").select("*").eq("state", state).eq("used", False).execute()

        if not state_result.data or len(state_result.data) == 0:
            return json({"error": "Invalid or expired state parameter"}, status=403)

        state_record = state_result.data[0]
        company_id = state_record["company_id"]

        # Mark state as used
        await supabase_client.client.table("shopify_oauth_states").update({"used": True}).eq("state", state).execute()

        # Exchange authorization code for access token
        token_data = exchange_code_for_token(shop, code)

        access_token = token_data["access_token"]
        scope = token_data["scope"]

        # Get shop information
        shop_info = get_shop_info(shop, access_token)

        # Store access token in database
        token_insert = {
            "company_id": company_id,
            "shop_domain": shop,
            "access_token": access_token,
            "scope": scope,
            "token_type": "offline",
            "is_active": True
        }

        # Upsert token (update if exists, insert if new)
        await supabase_client.client.table("shopify_oauth_tokens").upsert(
            token_insert,
            on_conflict="shop_domain"
        ).execute()

        # Store shop information
        shop_insert = {
            "company_id": company_id,
            "shop_domain": shop,
            "shop_id": shop_info.get("id"),
            "shop_name": shop_info.get("name"),
            "shop_owner": shop_info.get("shop_owner"),
            "email": shop_info.get("email"),
            "domain": shop_info.get("domain"),
            "country": shop_info.get("country"),
            "currency": shop_info.get("currency"),
            "timezone": shop_info.get("timezone"),
            "iana_timezone": shop_info.get("iana_timezone"),
            "plan_name": shop_info.get("plan_name"),
            "plan_display_name": shop_info.get("plan_display_name"),
            "shop_created_at": shop_info.get("created_at"),
            "province": shop_info.get("province"),
            "city": shop_info.get("city"),
            "address1": shop_info.get("address1"),
            "zip": shop_info.get("zip"),
            "phone": shop_info.get("phone"),
            "latitude": shop_info.get("latitude"),
            "longitude": shop_info.get("longitude"),
            "primary_locale": shop_info.get("primary_locale"),
            "money_format": shop_info.get("money_format"),
            "money_with_currency_format": shop_info.get("money_with_currency_format"),
            "weight_unit": shop_info.get("weight_unit"),
            "myshopify_domain": shop_info.get("myshopify_domain"),
            "last_synced_at": "now()"
        }

        await supabase_client.client.table("shopify_shops").upsert(
            shop_insert,
            on_conflict="shop_domain"
        ).execute()

        # Create uninstall webhook
        try:
            create_uninstall_webhook(shop, access_token)
        except Exception as webhook_error:
            print(f"Warning: Failed to create uninstall webhook: {webhook_error}")
            # Don't fail the OAuth flow if webhook creation fails

        # Trigger product sync in background (don't block redirect)
        print(f"🚀 Starting background product sync for {shop}...")
        asyncio.create_task(sync_products_background(shop, access_token, company_id))

        # Redirect immediately (don't wait for product sync)
        print(f"[Redirect] Redirecting user to dashboard immediately")
        success_url = f"{APP_URL}/dashboard/products?shopify=connected&shop={shop}"
        return redirect(success_url)

    except ShopifyOAuthError as e:
        # Redirect to error page
        error_url = f"{APP_URL}/dashboard/settings?shopify=error&message={str(e)}"
        return redirect(error_url)
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_url = f"{APP_URL}/dashboard/settings?shopify=error&message=OAuth+failed"
        return redirect(error_url)

@post("/shopify/webhooks/uninstall")
async def shopify_webhook_uninstall(request: Request):
    """
    Webhook endpoint for app uninstall events
    Shopify calls this when a merchant uninstalls the app
    """
    try:
        assert supabase_client

        # Verify webhook authenticity
        # TODO: Add webhook HMAC verification

        data = await request.json()
        shop_domain = data.get("domain") or data.get("myshopify_domain")

        if not shop_domain:
            return json({"error": "Missing shop domain"}, status=400)

        # Deactivate the OAuth token
        await supabase_client.client.table("shopify_oauth_tokens").update({
            "is_active": False
        }).eq("shop_domain", shop_domain).execute()

        print(f"App uninstalled from shop: {shop_domain}")

        return json({"status": "success"})

    except Exception as e:
        print(f"Error handling uninstall webhook: {str(e)}")
        return json({"error": str(e)}, status=500)

@get("/shopify/status")
async def shopify_status(request: Request):
    """
    Check Shopify connection status for a company

    Query params:
        - company_id: The company ID
    """
    try:
        assert supabase_client

        company_id = request.query.get("company_id")

        # Handle if company_id is returned as a list
        if isinstance(company_id, list):
            company_id = company_id[0] if company_id else None

        if not company_id:
            return json({"error": "Missing company_id parameter"}, status=400)

        # Get active token for company
        result = await supabase_client.client.table("shopify_oauth_tokens").select("*").eq("company_id", company_id).eq("is_active", True).execute()

        if not result.data or len(result.data) == 0:
            return json({
                "connected": False,
                "shop": None
            })

        token_data = result.data[0]
        shop_domain = token_data["shop_domain"]

        # Get shop info separately (since we don't have foreign keys)
        shop_result = await supabase_client.client.table("shopify_shops").select("*").eq("shop_domain", shop_domain).execute()
        shop_data = shop_result.data[0] if shop_result.data else None

        return json({
            "connected": True,
            "shop": {
                "domain": shop_domain,
                "name": shop_data["shop_name"] if shop_data else None,
                "email": shop_data["email"] if shop_data else None,
                "currency": shop_data["currency"] if shop_data else None,
            },
            "scopes": token_data["scope"],
            "connected_at": token_data["created_at"]
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

@post("/shopify/disconnect")
async def shopify_disconnect(request: Request):
    """
    Disconnect Shopify store (deactivate token)

    Request body:
        - company_id: The company ID
    """
    try:
        assert supabase_client

        data = await request.json()
        company_id = data.get("company_id")

        if not company_id:
            return json({"error": "Missing company_id"}, status=400)

        # Deactivate token
        await supabase_client.client.table("shopify_oauth_tokens").update({
            "is_active": False
        }).eq("company_id", company_id).execute()

        return json({"message": "Shopify store disconnected successfully"})

    except Exception as e:
        return json({"error": str(e)}, status=500)

@get("/shopify/shop-info")
async def get_shop_info_endpoint(request: Request):
    """
    Get shop information (name, owner, domain, logo)

    Query params:
        - company_id: The company ID (optional, returns first shop if not provided)
    """
    try:
        assert supabase_client

        company_id = request.query.get("company_id")
        if isinstance(company_id, list):
            company_id = company_id[0] if company_id else None

        # Query shopify_shops table
        query = supabase_client.client.table("shopify_shops").select("*")

        if company_id:
            query = query.eq("company_id", company_id)

        result = await query.limit(1).execute()

        if not result.data:
            return json({"error": "No shop found"}, status=404)

        shop = result.data[0]

        # Return relevant shop info
        return json({
            "shop_name": shop.get("shop_name"),
            "shop_owner": shop.get("shop_owner"),
            "shop_domain": shop.get("shop_domain"),
            "email": shop.get("email"),
            "logo_url": shop.get("logo_url"),  # Will be None if not set
            "myshopify_domain": shop.get("myshopify_domain"),
            "plan_display_name": shop.get("plan_display_name"),
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

# ============================================================================
# PRODUCT & CREATOR MATCHING ENDPOINTS
# ============================================================================

@get("/products")
async def get_company_products(request: Request):
    """
    Get all synced products for a company

    Query params:
        - company_id: The company ID
    """
    try:
        assert supabase_client

        company_id = request.query.get("company_id")

        # Handle if company_id is returned as a list
        if isinstance(company_id, list):
            company_id = company_id[0] if company_id else None

        if not company_id:
            return json({"error": "Missing company_id parameter"}, status=400)

        # Get products
        result = await supabase_client.client.table("company_products")\
            .select("*")\
            .eq("company_id", company_id)\
            .order("synced_at", desc=True)\
            .execute()

        return json({
            "products": result.data,
            "count": len(result.data) if result.data else 0
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

@get("/products/{product_id}/creators")
async def get_product_creators(product_id: str, request: Request):
    """
    Get matched creators for a specific product

    Path params:
        - product_id: The product ID

    Query params:
        - limit: Max number of results (default 50)
    """
    try:
        assert supabase_client

        limit_param = request.query.get("limit", "50")
        if isinstance(limit_param, list):
            limit_param = limit_param[0]
        limit = int(limit_param)

        # Get pre-matched creators from background worker
        matches = await supabase_client.client.table("product_creator_matches")\
            .select("*, creator_videos(*)")\
            .eq("product_id", product_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()

        # Also do real-time vector search for fresh matches
        product = await supabase_client.client.table("company_products")\
            .select("title, description, pinecone_id")\
            .eq("id", product_id)\
            .single()\
            .execute()

        vector_matches = []
        if product.data and product.data.get("pinecone_id"):
            try:
                from utils.vectordb import query_text

                search_text = f"{product.data['title']} {product.data.get('description', '')}"
                vector_results = query_text(search_text[:500], top_k=20)  # Limit text length

                # Convert Pinecone results to our format
                for match in vector_results.matches:
                    if match.metadata.get("type") == "creator_video":
                        vector_matches.append({
                            "video_id": match.metadata.get("video_id"),
                            "score": match.score
                        })
            except Exception as vector_error:
                print(f"Vector search error: {vector_error}")

        return json({
            "matches": matches.data if matches.data else [],
            "vector_matches": vector_matches,
            "count": len(matches.data) if matches.data else 0
        })

    except Exception as e:
        return json({"error": str(e)}, status=500)

@post("/products/resync")
async def resync_products(request: Request):
    """
    Manually trigger product resync for a company

    Request body:
        - company_id: The company ID
    """
    try:
        assert supabase_client

        data = await request.json()
        company_id = data.get("company_id")

        if not company_id:
            return json({"error": "Missing company_id"}, status=400)

        # Get shop domain and token
        token_result = await supabase_client.client.table("shopify_oauth_tokens")\
            .select("shop_domain, access_token")\
            .eq("company_id", company_id)\
            .eq("is_active", True)\
            .single()\
            .execute()

        if not token_result.data:
            return json({"error": "No active Shopify connection found"}, status=404)

        shop = token_result.data["shop_domain"]

        # Use existing utilities
        from utils.shopify import get_products
        from utils.vectordb import embed_products, upsert_embeddings

        print(f"🔄 Resyncing products for {shop}...")
        products = get_products(shop)

        # Delete old products for this company
        await supabase_client.client.table("company_products")\
            .delete()\
            .eq("company_id", company_id)\
            .execute()

        # Create new embeddings
        product_embeddings = embed_products(products)
        upsert_embeddings(product_embeddings)

        # Store in Supabase
        for i, product in enumerate(products):
            await supabase_client.client.table("company_products").insert({
                "company_id": company_id,
                "shop_domain": shop,
                "title": product["name"],
                "description": product.get("body_html", ""),
                "image": product.get("image", ""),
                "price": product.get("price", 0),
                "pinecone_id": str(i),
                "synced_at": "now()"
            }).execute()

        # Update sync status
        await supabase_client.client.table("shopify_oauth_tokens").update({
            "products_synced": True,
            "last_product_sync": "now()",
            "product_count": len(products)
        }).eq("company_id", company_id).execute()

        return json({
            "message": "Products resynced successfully",
            "count": len(products)
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@post("/products/trigger-discovery")
async def trigger_discovery(request: Request):
    """
    Trigger immediate creator discovery for a company.
    Useful for testing or manually starting discovery without waiting for scheduled cycle.
    """
    try:
        data = await request.json()
        company_id = data.get("company_id")
        shop_domain = data.get("shop_domain")

        if not company_id:
            return json({"error": "company_id is required"}, status=400)

        # Import and trigger discovery in background
        from background_worker import trigger_immediate_discovery

        # Run discovery in background (don't wait for it to complete)
        asyncio.create_task(trigger_immediate_discovery(company_id, shop_domain))

        return json({
            "message": "Discovery triggered successfully",
            "company_id": company_id,
            "status": "processing"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)
# ============================================================================
# PARTNERSHIPS ENDPOINTS
# ============================================================================

@get("/partnerships")
async def get_partnerships(request: Request):
    """
    Get all partnerships for a company

    Query params:
        - company_id: The company ID (required)
        - status: Filter by status (optional)
    """
    try:
        assert supabase_client

        company_id = request.query.get("company_id")
        if isinstance(company_id, list):
            company_id = company_id[0] if company_id else None

        if not company_id:
            return json({"error": "Missing company_id parameter"}, status=400)

        # Build query
        query = supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("company_id", company_id)\
            .order("created_at", desc=True)

        # Optional status filter
        status_filter = request.query.get("status")
        if isinstance(status_filter, list):
            status_filter = status_filter[0] if status_filter else None

        if status_filter:
            query = query.eq("status", status_filter)

        result = await query.execute()

        # Decode HTML entities in video titles and creator names
        import html
        partnerships = result.data or []
        for partnership in partnerships:
            if partnership.get("video_title"):
                partnership["video_title"] = html.unescape(partnership["video_title"])
            if partnership.get("creator_name"):
                partnership["creator_name"] = html.unescape(partnership["creator_name"])

        return json({
            "partnerships": partnerships,
            "count": len(partnerships)
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@get("/partnerships/<partnership_id>")
async def get_partnership(partnership_id: str):
    """
    Get a single partnership by ID
    """
    try:
        assert supabase_client

        result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("id", partnership_id)\
            .single()\
            .execute()

        if not result.data:
            return json({"error": "Partnership not found"}, status=404)

        # Decode HTML entities in video title and creator name
        import html
        partnership = result.data
        if partnership.get("video_title"):
            partnership["video_title"] = html.unescape(partnership["video_title"])
        if partnership.get("creator_name"):
            partnership["creator_name"] = html.unescape(partnership["creator_name"])

        return json(partnership)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@post("/partnerships")
async def create_partnership(request: Request):
    """
    Create a new partnership from a creator video match

    Body:
        - company_id: UUID (required)
        - video_id: string - YouTube video ID (required)
        - creator_name: string (required)
        - creator_handle: string
        - creator_email: string (optional)
        - creator_avatar: string (optional)
        - creator_channel_url: string (optional)
        - creator_channel_id: string (optional)
        - video_title: string (required)
        - video_url: string (required)
        - video_thumbnail: string (optional)
        - video_description: string (optional - for extracting contact info)
        - matched_products: array of product objects (optional)
        - views: integer (optional)
        - likes: integer (optional)
        - comments: integer (optional)
    """
    try:
        assert supabase_client

        data = await request.json()

        # Validate required fields
        if not data.get("company_id"):
            return json({"error": "company_id is required"}, status=400)
        if not data.get("video_id"):
            return json({"error": "video_id is required"}, status=400)
        if not data.get("creator_name"):
            return json({"error": "creator_name is required"}, status=400)
        if not data.get("video_title"):
            return json({"error": "video_title is required"}, status=400)
        if not data.get("video_url"):
            return json({"error": "video_url is required"}, status=400)

        # Check for duplicate (same company + video)
        existing = await supabase_client.client.table("partnerships")\
            .select("id")\
            .eq("company_id", data["company_id"])\
            .eq("video_url", data["video_url"])\
            .execute()

        if existing.data:
            return json({
                "error": "Partnership already exists for this video",
                "partnership_id": existing.data[0]["id"]
            }, status=409)

        # Try to get contact info if channel_id provided
        contact_info = None
        if data.get("creator_channel_id"):
            from utils.email import get_creator_contact_info
            contact_info = await get_creator_contact_info(
                channel_id=data["creator_channel_id"],
                channel_description=data.get("video_description")
            )

        # Create partnership
        import html
        from datetime import datetime, timezone

        partnership_data = {
            "company_id": data["company_id"],
            "video_id": data.get("video_id"),
            "creator_name": html.unescape(data["creator_name"]),
            "creator_handle": data.get("creator_handle"),
            "creator_email": data.get("creator_email") or (contact_info.get("email") if contact_info else None),
            "creator_avatar": data.get("creator_avatar"),
            "creator_channel_url": data.get("creator_channel_url") or (contact_info.get("channel_url") if contact_info else None),
            "video_title": html.unescape(data["video_title"]),
            "video_url": data["video_url"],
            "video_thumbnail": data.get("video_thumbnail"),
            "matched_products": data.get("matched_products", []),
            "views": data.get("views", 0),
            "likes": data.get("likes", 0),
            "comments": data.get("comments", 0),
            "status": "to_contact",
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        result = await supabase_client.client.table("partnerships")\
            .insert(partnership_data)\
            .execute()

        partnership = result.data[0] if result.data else None

        # Add contact info to response
        if partnership and contact_info:
            partnership["_contact_info"] = contact_info["social_links"]

        return json({
            "message": "Partnership created successfully",
            "partnership": partnership
        }, status=201)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@patch("/partnerships/<partnership_id>")
async def update_partnership(partnership_id: str, request: Request):
    """
    Update a partnership

    Body (all optional):
        - status: string (to_contact, contacted, in_discussion, active, closed)
        - creator_email: string
        - email_sent: boolean
        - email_draft: string
        - notes: string
        - contract_drafted: boolean
        - contract_sent: boolean
        - contract_signed: boolean
        - contract_url: string
        - affiliate_link: string
        - affiliate_link_generated: boolean
        - discount_code: string
        - commission_rate: decimal
        - payment_terms: string
        - clicks: integer
        - sales: integer
        - revenue: decimal
        - performance_data: object
    """
    try:
        assert supabase_client

        data = await request.json()

        # Build update object
        update_data = {}

        # Status updates with timestamp tracking
        if "status" in data:
            from datetime import datetime, timezone

            update_data["status"] = data["status"]
            now = datetime.now(timezone.utc).isoformat()

            if data["status"] == "contacted":
                update_data["contacted_at"] = now
            elif data["status"] == "in_discussion":
                update_data["discussion_started_at"] = now
            elif data["status"] == "active":
                update_data["activated_at"] = now
            elif data["status"] == "closed":
                update_data["closed_at"] = now

        # Email fields
        if "creator_email" in data:
            update_data["creator_email"] = data["creator_email"]
        if "email_sent" in data:
            update_data["email_sent"] = data["email_sent"]
            if data["email_sent"]:
                from datetime import datetime, timezone
                update_data["last_contact_date"] = datetime.now(timezone.utc).isoformat()
        if "email_draft" in data:
            update_data["email_draft"] = data["email_draft"]

        # Contract fields
        if "contract_drafted" in data:
            update_data["contract_drafted"] = data["contract_drafted"]
        if "contract_sent" in data:
            update_data["contract_sent"] = data["contract_sent"]
        if "contract_signed" in data:
            update_data["contract_signed"] = data["contract_signed"]
        if "contract_url" in data:
            update_data["contract_url"] = data["contract_url"]
        if "contract_data" in data:
            update_data["contract_data"] = data["contract_data"]

        # Affiliate fields
        if "affiliate_link" in data:
            update_data["affiliate_link"] = data["affiliate_link"]
        if "affiliate_link_generated" in data:
            update_data["affiliate_link_generated"] = data["affiliate_link_generated"]
        if "discount_code" in data:
            update_data["discount_code"] = data["discount_code"]
        if "commission_rate" in data:
            update_data["commission_rate"] = data["commission_rate"]
        if "payment_terms" in data:
            update_data["payment_terms"] = data["payment_terms"]

        # Performance tracking
        if "clicks" in data:
            update_data["clicks"] = data["clicks"]
        if "sales" in data:
            update_data["sales"] = data["sales"]
        if "revenue" in data:
            update_data["revenue"] = data["revenue"]
        if "performance_data" in data:
            update_data["performance_data"] = data["performance_data"]

        # Notes
        if "notes" in data:
            update_data["notes"] = data["notes"]

        if not update_data:
            return json({"error": "No valid fields to update"}, status=400)

        # Perform update
        result = await supabase_client.client.table("partnerships")\
            .update(update_data)\
            .eq("id", partnership_id)\
            .execute()

        if not result.data:
            return json({"error": "Partnership not found"}, status=404)

        return json({
            "message": "Partnership updated successfully",
            "partnership": result.data[0] if result.data else None
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@get("/partnerships/<partnership_id>/contact-info")
async def get_partnership_contact_info(partnership_id: str):
    """
    Get contact information for a partnership's creator

    Returns email and social media links
    """
    try:
        assert supabase_client

        # Get partnership
        partnership_result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("id", partnership_id)\
            .single()\
            .execute()

        if not partnership_result.data:
            return json({"error": "Partnership not found"}, status=404)

        partnership = partnership_result.data

        # If we have video_id, get the video details
        video_description = None
        channel_id = None

        if partnership.get("video_id"):
            video_result = await supabase_client.client.table("creator_videos")\
                .select("description, channel_id")\
                .eq("video_id", partnership["video_id"])\
                .single()\
                .execute()

            if video_result.data:
                video_description = video_result.data.get("description")
                channel_id = video_result.data.get("channel_id")

        # Extract channel ID from URL if not found
        if not channel_id and partnership.get("creator_channel_url"):
            import re
            match = re.search(r'/channel/([^/\s]+)', partnership["creator_channel_url"])
            if match:
                channel_id = match.group(1)

        # Get contact info
        contact_info = {
            "email": partnership.get("creator_email"),
            "social_links": {
                "instagram": None,
                "tiktok": None,
                "twitter": None,
                "other_links": []
            },
            "channel_url": partnership.get("creator_channel_url")
        }

        if channel_id:
            from utils.email import get_creator_contact_info
            fetched_info = await get_creator_contact_info(
                channel_id=channel_id,
                channel_description=video_description
            )
            # Merge with existing info (prefer existing email if set)
            if not contact_info["email"]:
                contact_info["email"] = fetched_info.get("email")
            contact_info["social_links"] = fetched_info.get("social_links", contact_info["social_links"])
            if not contact_info["channel_url"]:
                contact_info["channel_url"] = fetched_info.get("channel_url")

        return json(contact_info)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@post("/partnerships/<partnership_id>/send-email")
async def send_partnership_email_endpoint(partnership_id: str, request: Request):
    """
    Send partnership outreach email to creator

    Body:
        - to_email: string (required if not in partnership record)
        - custom_message: string (optional - custom message to include)
        - save_email: boolean (default true - whether to update partnership record)
    """
    try:
        assert supabase_client

        data = await request.json()

        # Get partnership
        partnership_result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("id", partnership_id)\
            .single()\
            .execute()

        if not partnership_result.data:
            return json({"error": "Partnership not found"}, status=404)

        partnership = partnership_result.data

        # Get email
        to_email = data.get("to_email") or partnership.get("creator_email")
        if not to_email:
            return json({"error": "Email address is required"}, status=400)

        # Get shop info
        shop_result = await supabase_client.client.table("shopify_shops")\
            .select("shop_name")\
            .eq("company_id", partnership["company_id"])\
            .single()\
            .execute()

        shop_name = shop_result.data.get("shop_name") if shop_result.data else "Our Brand"

        # Send email
        from utils.email import send_partnership_email
        import os

        # Generate partnership URL
        app_url = os.getenv("APP_URL", "http://localhost:3000")
        partnership_url = f"{app_url}/partnership/{partnership_id}"

        success, message = await send_partnership_email(
            to_email=to_email,
            creator_name=partnership["creator_name"],
            shop_name=shop_name,
            products=partnership.get("matched_products", []),
            custom_message=data.get("custom_message"),
            partnership_url=partnership_url
        )

        if not success:
            return json({"error": message}, status=500)

        # Update partnership record if requested
        if data.get("save_email", True):
            update_data = {
                "email_sent": True,
                "last_contact_date": "now()",
                "status": "contacted",
                "contacted_at": "now()"
            }

            # Save email if it was provided and different
            if data.get("to_email") and data["to_email"] != partnership.get("creator_email"):
                update_data["creator_email"] = data["to_email"]

            # Save custom message as draft if provided
            if data.get("custom_message"):
                update_data["email_draft"] = data["custom_message"]

            await supabase_client.client.table("partnerships")\
                .update(update_data)\
                .eq("id", partnership_id)\
                .execute()

        return json({
            "message": "Email sent successfully",
            "to": to_email
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@post("/partnerships/<partnership_id>/generate-affiliate")
async def generate_affiliate_link_endpoint(partnership_id: str, request: Request):
    """
    Generate affiliate tracking link and optionally create Shopify discount code

    Body:
        - commission_rate: decimal (optional - default 10%)
        - create_discount: boolean (optional - default false)
        - discount_amount: decimal (optional - default 10)
        - discount_type: string (optional - "percentage" or "fixed", default "percentage")
    """
    try:
        assert supabase_client

        data = await request.json()

        # Get partnership
        partnership_result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("id", partnership_id)\
            .single()\
            .execute()

        if not partnership_result.data:
            return json({"error": "Partnership not found"}, status=404)

        partnership = partnership_result.data

        # Get shop domain
        shop_result = await supabase_client.client.table("shopify_shops")\
            .select("shop_domain, myshopify_domain")\
            .eq("company_id", partnership["company_id"])\
            .single()\
            .execute()

        if not shop_result.data:
            return json({"error": "Shop not found"}, status=404)

        shop_domain = shop_result.data.get("shop_domain") or shop_result.data.get("myshopify_domain")

        # Generate affiliate link
        creator_handle = partnership.get("creator_handle") or ""
        if creator_handle:
            creator_handle = creator_handle.strip('@').lower()

        if not creator_handle:
            # Fallback to creator name
            creator_handle = (partnership.get("creator_name") or "creator").lower().replace(" ", "")

        affiliate_link = f"https://{shop_domain}/ref/{creator_handle}?pid={partnership_id}"

        # Optionally create Shopify discount code
        discount_code = None
        if data.get("create_discount", False):
            from utils.shopify_api import create_discount_code, get_access_token

            try:
                access_token = await get_access_token(partnership["company_id"])
                if access_token:
                    discount_amount = data.get("discount_amount", 10)
                    discount_type = data.get("discount_type", "percentage")

                    discount_code = f"{creator_handle.upper()}{discount_amount}"

                    # Create discount in Shopify
                    created = await create_discount_code(
                        shop=shop_result.data.get("myshopify_domain"),
                        access_token=access_token,
                        code=discount_code,
                        value=discount_amount,
                        value_type=discount_type
                    )

                    if not created:
                        discount_code = None  # Failed to create
            except Exception as e:
                print(f"Failed to create Shopify discount: {e}")
                # Continue without discount code

        # Update partnership
        update_data = {
            "affiliate_link": affiliate_link,
            "affiliate_link_generated": True,
            "commission_rate": data.get("commission_rate", 10)
        }

        if discount_code:
            update_data["discount_code"] = discount_code

        result = await supabase_client.client.table("partnerships")\
            .update(update_data)\
            .eq("id", partnership_id)\
            .execute()

        return json({
            "message": "Affiliate link generated successfully",
            "affiliate_link": affiliate_link,
            "discount_code": discount_code,
            "partnership": result.data[0] if result.data else None
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)

# ============================================================================
# REEL INTERACTIONS ENDPOINTS
# ============================================================================

@post("/reels/interactions")
async def record_reel_interaction(request: Request):
    """
    Record a reel interaction (dismiss or partner)

    Body:
        - company_id: UUID (required)
        - video_id: string - YouTube video ID (required)
        - interaction_type: string - 'dismissed' or 'partnered' (required)
    """
    try:
        assert supabase_client

        data = await request.json()

        # Validate required fields
        if not data.get("company_id"):
            return json({"error": "company_id is required"}, status=400)
        if not data.get("video_id"):
            return json({"error": "video_id is required"}, status=400)
        if not data.get("interaction_type"):
            return json({"error": "interaction_type is required"}, status=400)

        # Validate interaction type
        valid_types = ["dismissed", "partnered"]
        if data["interaction_type"] not in valid_types:
            return json({"error": f"interaction_type must be one of: {', '.join(valid_types)}"}, status=400)

        # Upsert interaction (update if exists, insert if new)
        interaction_data = {
            "company_id": data["company_id"],
            "video_id": data["video_id"],
            "interaction_type": data["interaction_type"],
            "created_at": "now()"
        }

        result = await supabase_client.client.table("reel_interactions")\
            .upsert(interaction_data, on_conflict="company_id,video_id")\
            .execute()

        return json({
            "message": "Interaction recorded successfully",
            "interaction": result.data[0] if result.data else None
        }, status=201)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@get("/reels/interactions")
async def get_reel_interactions(request: Request):
    """
    Get all reel interactions for a company

    Query params:
        - company_id: The company ID (required)
        - interaction_type: Filter by type (optional)
    """
    try:
        assert supabase_client

        company_id = request.query.get("company_id")
        if isinstance(company_id, list):
            company_id = company_id[0] if company_id else None

        if not company_id:
            return json({"error": "Missing company_id parameter"}, status=400)

        # Build query
        query = supabase_client.client.table("reel_interactions")\
            .select("*")\
            .eq("company_id", company_id)\
            .order("created_at", desc=True)

        # Optional type filter
        interaction_type = request.query.get("interaction_type")
        if isinstance(interaction_type, list):
            interaction_type = interaction_type[0] if interaction_type else None

        if interaction_type:
            query = query.eq("interaction_type", interaction_type)

        result = await query.execute()

        return json({
            "interactions": result.data or [],
            "count": len(result.data) if result.data else 0
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    """
    Get comprehensive dashboard statistics for a company

    Query params:
        - company_id: The company ID (required)

    Returns:
        - pending_matches: Count of partnerships in 'to_contact' or 'contacted' status
        - active_partnerships: Count of partnerships in 'active' status
        - total_reach: Sum of views from all partnerships
        - products_count: Total number of products synced
        - recent_matches: Last 3 partnerships created
        - recent_activity: Recent activity log entries
    """
    try:
        assert supabase_client

        company_id = request.query.get("company_id")
        if isinstance(company_id, list):
            company_id = company_id[0] if company_id else None

        if not company_id:
            return json({"error": "Missing company_id parameter"}, status=400)

        # Get all partnerships for this company
        partnerships_result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("company_id", company_id)\
            .execute()

        partnerships = partnerships_result.data or []

        # Calculate stats
        pending_matches = len([p for p in partnerships if p.get("status") in ["to_contact", "contacted"]])
        active_partnerships = len([p for p in partnerships if p.get("status") == "active"])
        total_reach = sum(p.get("views", 0) for p in partnerships)

        # Get products count
        products_result = await supabase_client.client.table("company_products")\
            .select("id", count="exact")\
            .eq("company_id", company_id)\
            .execute()

        products_count = products_result.count or 0

        # Get recent matches (last 3 partnerships)
        recent_partnerships = sorted(
            partnerships,
            key=lambda p: p.get("created_at", ""),
            reverse=True
        )[:3]

        recent_matches = [
            {
                "id": p.get("id"),
                "creator": p.get("creator_handle") or p.get("creator_name", "Unknown Creator"),
                "action": get_partnership_action(p),
                "time": format_time_ago(p.get("created_at")),
                "status": p.get("status", "pending")
            }
            for p in recent_partnerships
        ]

        # Get recent activity from partnership updates
        recent_activity = []

        # Add product sync activity if available
        shop_result = await supabase_client.client.table("shopify_shops")\
            .select("last_synced_at")\
            .eq("company_id", company_id)\
            .execute()

        if shop_result.data and len(shop_result.data) > 0:
            last_sync = shop_result.data[0].get("last_synced_at")
            if last_sync:
                recent_activity.append({
                    "id": "sync-1",
                    "action": "Product sync completed",
                    "detail": f"{products_count} products updated",
                    "time": format_time_ago(last_sync)
                })

        # Add recent partnership actions
        for p in recent_partnerships[:2]:
            if p.get("status") == "active":
                recent_activity.append({
                    "id": f"partnership-{p.get('id')}",
                    "action": "Partnership activated",
                    "detail": f"With {p.get('creator_handle') or p.get('creator_name', 'creator')}",
                    "time": format_time_ago(p.get("activated_at") or p.get("updated_at"))
                })
            elif p.get("email_sent"):
                recent_activity.append({
                    "id": f"email-{p.get('id')}",
                    "action": "Partnership request sent",
                    "detail": f"To {p.get('creator_handle') or p.get('creator_name', 'creator')}",
                    "time": format_time_ago(p.get("contacted_at") or p.get("created_at"))
                })

        return json({
            "stats": {
                "pending_matches": pending_matches,
                "active_partnerships": active_partnerships,
                "total_reach": total_reach,
                "products_count": products_count
            },
            "recent_matches": recent_matches,
            "recent_activity": recent_activity[:3]  # Limit to 3 most recent
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


def get_partnership_action(partnership):
    """Generate action text based on partnership status"""
    status = partnership.get("status", "pending")

    if status == "active":
        return "Partnership confirmed"
    elif status == "in_discussion":
        return "In active discussion"
    elif status == "contacted":
        return "Creator contacted"
    else:
        return "New creator match found"


def format_time_ago(timestamp):
    """Format timestamp as relative time (e.g., '2 hours ago')"""
    if not timestamp:
        return "Recently"

    from datetime import datetime, timezone

    try:
        if isinstance(timestamp, str):
            # Parse ISO format timestamp
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        else:
            dt = timestamp

        now = datetime.now(timezone.utc)
        diff = now - dt

        seconds = diff.total_seconds()

        if seconds < 60:
            return "Just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days != 1 else ''} ago"
        else:
            weeks = int(seconds / 604800)
            return f"{weeks} week{'s' if weeks != 1 else ''} ago"
    except Exception:
        return "Recently"


@get("/notifications")
async def get_notifications(request: Request):
    """
    Get notifications for a company based on recent activity

    Query params:
        - company_id: The company ID (required)
        - limit: Number of notifications to return (default: 10)

    Returns notifications for:
        - New partnerships created
        - Partnership status changes
        - Product syncs completed
    """
    try:
        assert supabase_client

        company_id = request.query.get("company_id")
        if isinstance(company_id, list):
            company_id = company_id[0] if company_id else None

        if not company_id:
            return json({"error": "Missing company_id parameter"}, status=400)

        limit_param = request.query.get("limit")
        limit = int(limit_param[0] if isinstance(limit_param, list) else limit_param) if limit_param else 10

        notifications = []

        # Get recent partnerships (last 7 days)
        from datetime import datetime, timezone, timedelta
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

        partnerships_result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("company_id", company_id)\
            .gte("created_at", week_ago)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()

        # Create notifications for partnerships
        for partnership in (partnerships_result.data or []):
            # New partnership notification
            if partnership.get("created_at"):
                import html
                creator = html.unescape(partnership.get("creator_handle") or partnership.get("creator_name", "Unknown"))
                product_names = []
                if partnership.get("matched_products"):
                    products = partnership["matched_products"]
                    if isinstance(products, list) and len(products) > 0:
                        # Get first product name
                        first_product = products[0]
                        if isinstance(first_product, dict):
                            product_names.append(first_product.get("title") or first_product.get("name", ""))
                        elif isinstance(first_product, str):
                            product_names.append(first_product)

                product_text = product_names[0] if product_names else "your products"

                # Determine notification type and message based on status
                status = partnership.get("status", "to_contact")
                if status == "active":
                    notifications.append({
                        "id": f"partnership-active-{partnership['id']}",
                        "title": "Partnership Activated",
                        "message": f"{creator} partnership is now active",
                        "time": format_time_ago(partnership.get("activated_at") or partnership.get("updated_at")),
                        "unread": True,
                        "type": "partnership_active"
                    })
                elif status == "in_discussion":
                    notifications.append({
                        "id": f"partnership-discussion-{partnership['id']}",
                        "title": "Partnership In Discussion",
                        "message": f"{creator} is discussing partnership for {product_text}",
                        "time": format_time_ago(partnership.get("discussion_started_at") or partnership.get("updated_at")),
                        "unread": True,
                        "type": "partnership_discussion"
                    })
                else:
                    notifications.append({
                        "id": f"partnership-new-{partnership['id']}",
                        "title": "New Creator Match",
                        "message": f"{creator} matched with {product_text}",
                        "time": format_time_ago(partnership.get("created_at")),
                        "unread": True,
                        "type": "partnership_new"
                    })

        # Get product sync notifications
        shop_result = await supabase_client.client.table("shopify_shops")\
            .select("last_synced_at")\
            .eq("company_id", company_id)\
            .execute()

        if shop_result.data and len(shop_result.data) > 0:
            last_sync = shop_result.data[0].get("last_synced_at")
            if last_sync:
                # Get product count
                products_result = await supabase_client.client.table("company_products")\
                    .select("id", count="exact")\
                    .eq("company_id", company_id)\
                    .execute()

                product_count = products_result.count or 0

                notifications.append({
                    "id": f"sync-{company_id}",
                    "title": "Product Sync Complete",
                    "message": f"{product_count} products successfully synced from Shopify",
                    "time": format_time_ago(last_sync),
                    "unread": False,
                    "type": "product_sync"
                })

        # Sort by time (most recent first) and limit
        notifications = sorted(
            notifications,
            key=lambda n: n.get("time", ""),
            reverse=False  # "Just now" comes before "2 hours ago"
        )[:limit]

        return json({
            "notifications": notifications,
            "unread_count": len([n for n in notifications if n.get("unread")])
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)
