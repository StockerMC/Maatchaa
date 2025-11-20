from dotenv import load_dotenv
load_dotenv()

from utils import shopify, vectordb, yt_search
from blacksheep import Request, Application, delete, get, post, json, redirect
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
    allow_methods="GET POST PUT DELETE OPTIONS",
    allow_origins="*",  # In production, specify exact origins
    allow_headers="*",
    allow_credentials=True
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

@app.on_stop
async def on_stop(application: Application):
    """Clean up global resources when the application shuts down"""
    global supabase_client
    if supabase_client:
        await supabase_client.close()
        print("✅ SupabaseClient closed")

# Health check endpoint
@get("/")
async def health_check():
    return json({"status": "healthy", "message": "API is running"})

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
@get("/products")
async def get_products(request: Request):
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

        # Redirect merchant to Shopify
        return redirect(auth_url)

    except ShopifyOAuthError as e:
        return json({"error": str(e)}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)

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

        # Redirect to success page in frontend
        success_url = f"{APP_URL}/dashboard/settings?shopify=connected&shop={shop}"
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
