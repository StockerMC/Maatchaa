from dotenv import load_dotenv
load_dotenv()

from utils import shopify, vectordb
from blacksheep import Request, Application, delete, get, post, json

app = Application()

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
            return json({"error": "shop_url is required"}, status=400)
        
        # Get products from Shopify
        products = shopify.get_products(shop_url)
        
        products_with_images = [p for p in products if p.get("image")]
        
        if not products_with_images:
            return json({"error": "No products with images found"}, status=400)
        
        # Create embeddings and upsert to vector DB
        embeddings = vectordb.embed_products(products_with_images)
        vectordb.upsert_embeddings(embeddings)
        
        return json({
            "message": f"Successfully ingested {len(embeddings)} products",
            "products_processed": len(embeddings),
            "total_products": len(products)
        })
        
    except Exception as e:
        return json({"error": str(e)}, status=500)

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
            vector=[0] * 1024,  # Dummy vector to get all results
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