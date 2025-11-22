# Creator Matching Architecture
*AI-Powered Product-to-Creator Matching System*

## 🎯 Overview

**Goal:** Continuously discover creators making content relevant to connected companies' products, then allow companies to find and connect with the best matches.

**Key Innovation:** Product-driven creator discovery using AI to generate intelligent search keywords.

---

## 🏗️ Complete Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  1. COMPANY CONNECTS SHOPIFY (OAuth)                          │
│     ✅ Already implemented                                     │
│     → Redirect: /dashboard/products                           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  2. PRODUCT SYNC (Background Task)                            │
│     • Fetch all products from Shopify API                     │
│     • Store in database with embeddings                       │
│     • Generate AI-powered search keywords per product         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  3. INTELLIGENT CREATOR DISCOVERY (Background Worker 24/7)    │
│     • Analyzes ALL products in database                       │
│     • Generates smart YouTube search keywords using Gemini    │
│     • Searches for relevant shorts                            │
│     • Analyzes videos (aesthetic, tone, categories)           │
│     • Creates embeddings and stores in Pinecone               │
│     • Links creators to relevant products                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  4. COMPANY VIEWS MATCHES                                     │
│     • Product Dashboard: See all synced products              │
│     • Reels Page: Browse creator matches for selected product │
│     • Creator profiles with metrics & sample content          │
│     • "Invite" action to reach out                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Plan

### **Phase 1: Post-OAuth Product Sync**

#### 1.1 Update OAuth Callback
**File:** `backend/API.py`

After successful OAuth, trigger product sync:

```python
@get("/shopify/callback")
async def shopify_callback(request: Request):
    # ... existing OAuth code ...

    # After storing token and shop info:

    # Trigger background product sync
    import asyncio
    asyncio.create_task(sync_company_products(company_id, shop, access_token))

    # Redirect to product dashboard
    success_url = f"{APP_URL}/dashboard/products?shopify=connected&shop={shop}"
    return redirect(success_url)
```

#### 1.2 Create Product Sync Function
**File:** `backend/utils/shopify_sync.py` (NEW)

```python
from utils.shopify_api import ShopifyAPIClient
from utils.vectordb import create_embedding
from utils.supabase import SupabaseClient
import asyncio

async def sync_company_products(company_id: str, shop: str, access_token: str):
    """
    Sync all products from Shopify and prepare for creator matching

    Steps:
    1. Fetch products from Shopify
    2. Create embeddings for each product
    3. Generate AI-powered search keywords
    4. Store in database + Pinecone
    """

    supabase = SupabaseClient()
    shopify_client = ShopifyAPIClient(shop, access_token)

    # 1. Fetch all products (paginated)
    products = await shopify_client.get_products(limit=250)

    for product in products:
        # 2. Create product embedding
        product_text = f"{product['title']} {product.get('description', '')} {product.get('product_type', '')}"
        embedding = create_embedding(product_text)

        # 3. Generate search keywords using AI
        search_keywords = await generate_search_keywords(product)

        # 4. Store in database
        await supabase.client.table("company_products").upsert({
            "company_id": company_id,
            "shopify_product_id": product["id"],
            "title": product["title"],
            "description": product.get("description"),
            "product_type": product.get("product_type"),
            "images": [img["src"] for img in product.get("images", [])],
            "price": product["variants"][0]["price"] if product.get("variants") else None,
            "search_keywords": search_keywords,  # AI-generated keywords
            "embedding_id": f"product_{company_id}_{product['id']}",
            "synced_at": "now()"
        }, on_conflict="shopify_product_id").execute()

        # 5. Store embedding in Pinecone
        store_in_pinecone(
            id=f"product_{company_id}_{product['id']}",
            embedding=embedding,
            metadata={
                "type": "product",
                "company_id": company_id,
                "product_id": product["id"],
                "title": product["title"]
            }
        )

    # Mark sync complete
    await supabase.client.table("shopify_oauth_tokens").update({
        "products_synced": True,
        "last_product_sync": "now()"
    }).eq("company_id", company_id).execute()
```

#### 1.3 AI-Powered Keyword Generation
**File:** `backend/utils/keyword_generation.py` (NEW)

```python
from google import genai
import os
import json

client = genai.Client(api_key=os.getenv("GEMINI_KEY"))

async def generate_search_keywords(product: dict) -> list[str]:
    """
    Use Gemini to generate intelligent YouTube search keywords
    based on product details

    Example:
    Product: "Wireless Bluetooth Headphones"
    Keywords: ["headphone unboxing", "wireless earbuds review",
               "bluetooth headphones test", "audio gear showcase"]
    """

    prompt = f"""Generate 5-10 YouTube search keywords for finding creator content
    relevant to this product. Focus on what creators would actually search or title
    their videos about this type of product.

    Product Title: {product['title']}
    Description: {product.get('description', 'N/A')}
    Category: {product.get('product_type', 'N/A')}

    Return ONLY a JSON array of keywords, like: ["keyword1", "keyword2", ...]

    Make keywords specific enough to find relevant creators, but broad enough to get results.
    Include variations like "review", "unboxing", "haul", "try-on", "test", etc.
    """

    response = client.models.generate_content(
        model='models/gemini-2.0-flash',
        contents=prompt
    )

    try:
        keywords_text = response.candidates[0].content.parts[0].text
        # Extract JSON array from response
        keywords = json.loads(keywords_text.strip())
        return keywords[:10]  # Max 10 keywords per product
    except:
        # Fallback: basic keyword generation
        return [
            f"{product['title']} review",
            f"{product.get('product_type', 'product')} haul",
            f"{product['title']} unboxing"
        ]
```

---

### **Phase 2: Background Creator Discovery Worker**

#### 2.1 Intelligent Background Worker
**File:** `backend/background_worker.py` (NEW)

```python
import asyncio
from utils.yt_search import fetch_top_shorts
from utils.video import parse_video
from utils.vectordb import create_embedding, store_in_pinecone
from utils.supabase import SupabaseClient
import os

async def creator_discovery_worker():
    """
    Continuously discovers creators relevant to products in database

    Flow:
    1. Get all unique search keywords from products
    2. Search YouTube for shorts using those keywords
    3. Analyze videos with Gemini
    4. Create embeddings and store
    5. Link creators to relevant products
    6. Sleep and repeat
    """

    supabase = SupabaseClient()

    while True:
        try:
            print("🔍 Starting creator discovery cycle...")

            # 1. Get search keywords from all products
            products_result = await supabase.client.table("company_products")\
                .select("id, search_keywords, title")\
                .execute()

            # Collect all unique keywords
            all_keywords = set()
            product_keywords_map = {}  # keyword -> [product_ids]

            for product in products_result.data:
                for keyword in product.get("search_keywords", []):
                    all_keywords.add(keyword)
                    if keyword not in product_keywords_map:
                        product_keywords_map[keyword] = []
                    product_keywords_map[keyword].append(product["id"])

            print(f"📊 Found {len(all_keywords)} unique search keywords from {len(products_result.data)} products")

            # 2. Search YouTube for each keyword
            for keyword in list(all_keywords)[:50]:  # Limit to 50 keywords per cycle
                try:
                    print(f"🔎 Searching YouTube for: {keyword}")

                    videos = await fetch_top_shorts(
                        keyword=keyword,
                        max_results=10,
                        published_after_days=30  # Only recent content
                    )

                    # 3. Process each video
                    for video in videos:
                        await process_creator_video(
                            video=video,
                            source_keyword=keyword,
                            related_product_ids=product_keywords_map[keyword],
                            supabase=supabase
                        )

                    # Rate limiting: wait between searches
                    await asyncio.sleep(2)

                except Exception as e:
                    print(f"❌ Error processing keyword '{keyword}': {e}")
                    continue

            print("✅ Creator discovery cycle complete")

            # 4. Sleep for 6 hours (4x per day)
            print("😴 Sleeping for 6 hours...")
            await asyncio.sleep(6 * 60 * 60)

        except Exception as e:
            print(f"❌ Worker error: {e}")
            import traceback
            traceback.print_exc()
            # Sleep shorter on error, then retry
            await asyncio.sleep(30 * 60)  # 30 minutes

async def process_creator_video(video: dict, source_keyword: str, related_product_ids: list, supabase):
    """
    Process a single creator video: analyze, embed, store
    """

    video_id = video["id"]

    # Check if already processed
    existing = await supabase.client.table("creator_videos")\
        .select("id")\
        .eq("video_id", video_id)\
        .execute()

    if existing.data:
        print(f"⏭️  Video {video_id} already indexed, skipping")
        return

    try:
        # 1. Analyze video with Gemini
        print(f"🎥 Analyzing video: {video['title']}")
        analysis_result = await parse_video(video["url"])

        if isinstance(analysis_result, tuple):
            analysis, status = analysis_result
            if status != 200:
                print(f"❌ Video analysis failed: {analysis}")
                return
        else:
            analysis = analysis_result

        # Parse analysis JSON
        import json
        analysis_data = json.loads(analysis.get("output", "{}"))

        # 2. Create embedding
        embedding_text = f"{video['title']} {video['description']} {analysis_data.get('aesthetic', '')} {analysis_data.get('tone_vibe', '')} {' '.join(analysis_data.get('potential_categories', []))}"
        embedding = create_embedding(embedding_text)

        # 3. Store in database
        await supabase.client.table("creator_videos").insert({
            "video_id": video_id,
            "url": video["url"],
            "title": video["title"],
            "description": video["description"],
            "thumbnail": video["thumbnail"],
            "channel_title": video["channelTitle"],
            "channel_id": video["channel_id"],
            "email": video.get("email"),
            "published_at": video["publishedAt"],
            "source_keyword": source_keyword,
            "analysis": analysis_data,
            "embedding_id": f"video_{video_id}",
            "indexed_at": "now()"
        }).execute()

        # 4. Store embedding in Pinecone
        store_in_pinecone(
            id=f"video_{video_id}",
            embedding=embedding,
            metadata={
                "type": "creator_video",
                "video_id": video_id,
                "channel_id": video["channel_id"],
                "channel_title": video["channelTitle"],
                "categories": analysis_data.get("potential_categories", []),
                "aesthetic": analysis_data.get("aesthetic", ""),
                "published_at": video["publishedAt"]
            }
        )

        # 5. Link video to relevant products
        for product_id in related_product_ids[:5]:  # Max 5 products per video
            await supabase.client.table("product_creator_matches").insert({
                "product_id": product_id,
                "video_id": video_id,
                "match_source": "keyword_discovery",
                "source_keyword": source_keyword,
                "created_at": "now()"
            }).execute()

        print(f"✅ Indexed video: {video['title']}")

    except Exception as e:
        print(f"❌ Error processing video {video_id}: {e}")
        import traceback
        traceback.print_exc()

# Run the worker
if __name__ == "__main__":
    print("🚀 Starting Creator Discovery Worker")
    asyncio.run(creator_discovery_worker())
```

#### 2.2 Run Worker as Service
**File:** `backend/start_worker.sh` (NEW)

```bash
#!/bin/bash
# Start the background creator discovery worker

cd "$(dirname "$0")"
source .venv/bin/activate

echo "Starting Creator Discovery Worker..."
python3 background_worker.py
```

**Deployment:** Run on server using:
- **systemd** (Linux)
- **pm2** (Node.js process manager)
- **Docker** container
- **Screen/tmux** session (quick testing)

---

### **Phase 3: Database Schema Updates**

#### 3.1 New Tables Needed
**File:** `backend/data/creator_matching_schema.sql` (NEW)

```sql
-- Products synced from Shopify
CREATE TABLE IF NOT EXISTS company_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    shopify_product_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    product_type TEXT,
    images JSONB,  -- Array of image URLs
    price DECIMAL,
    search_keywords JSONB,  -- AI-generated keywords for creator search
    embedding_id TEXT,  -- Reference to Pinecone
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_company_products_company_id ON company_products(company_id);
CREATE INDEX idx_company_products_keywords ON company_products USING GIN(search_keywords);

-- Creator videos discovered by background worker
CREATE TABLE IF NOT EXISTS creator_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    channel_title TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    email TEXT,
    published_at TIMESTAMPTZ,
    source_keyword TEXT,  -- Which search keyword found this video
    analysis JSONB,  -- Gemini analysis results
    embedding_id TEXT,  -- Reference to Pinecone
    indexed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_creator_videos_channel_id ON creator_videos(channel_id);
CREATE INDEX idx_creator_videos_source_keyword ON creator_videos(source_keyword);
CREATE INDEX idx_creator_videos_published_at ON creator_videos(published_at DESC);

-- Links between products and matching creator videos
CREATE TABLE IF NOT EXISTS product_creator_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES company_products(id),
    video_id TEXT NOT NULL REFERENCES creator_videos(video_id),
    match_source TEXT,  -- 'keyword_discovery', 'manual_search', 'ai_recommendation'
    source_keyword TEXT,
    similarity_score DECIMAL,  -- From Pinecone vector similarity
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_creator_matches_product ON product_creator_matches(product_id);
CREATE INDEX idx_product_creator_matches_video ON product_creator_matches(video_id);

-- Track product sync status
ALTER TABLE shopify_oauth_tokens ADD COLUMN IF NOT EXISTS products_synced BOOLEAN DEFAULT FALSE;
ALTER TABLE shopify_oauth_tokens ADD COLUMN IF NOT EXISTS last_product_sync TIMESTAMPTZ;
```

---

### **Phase 4: API Endpoints**

#### 4.1 Product Endpoints
**File:** `backend/API.py`

```python
@get("/products")
async def get_company_products(request: Request):
    """
    Get all synced products for a company
    """
    company_id = request.query.get("company_id")
    if isinstance(company_id, list):
        company_id = company_id[0]

    result = await supabase_client.client.table("company_products")\
        .select("*")\
        .eq("company_id", company_id)\
        .order("synced_at", desc=True)\
        .execute()

    return json({"products": result.data})

@get("/products/{product_id}/creators")
async def get_product_creators(product_id: str):
    """
    Get matched creators for a specific product
    Integrates with existing reels page
    """

    # Get pre-matched creators from background worker
    matches = await supabase_client.client.table("product_creator_matches")\
        .select("*, creator_videos(*)")\
        .eq("product_id", product_id)\
        .order("created_at", desc=True)\
        .limit(50)\
        .execute()

    # Also do real-time vector search for fresh matches
    product = await supabase_client.client.table("company_products")\
        .select("embedding_id")\
        .eq("id", product_id)\
        .single()\
        .execute()

    if product.data and product.data.get("embedding_id"):
        # Query Pinecone for similar creator videos
        from utils.vectordb import query_pinecone
        vector_matches = query_pinecone(
            embedding_id=product.data["embedding_id"],
            top_k=20,
            filter={"type": "creator_video"}
        )

        # Merge results
        # ...

    return json({"matches": matches.data})

@post("/products/sync")
async def manual_product_sync(request: Request):
    """
    Manually trigger product sync (for testing or refresh)
    """
    body = await request.json()
    company_id = body.get("company_id")

    # Get shop and token
    token_result = await supabase_client.client.table("shopify_oauth_tokens")\
        .select("shop_domain, access_token")\
        .eq("company_id", company_id)\
        .single()\
        .execute()

    if not token_result.data:
        return json({"error": "No Shopify connection found"}, status=404)

    # Trigger sync
    import asyncio
    asyncio.create_task(sync_company_products(
        company_id,
        token_result.data["shop_domain"],
        token_result.data["access_token"]
    ))

    return json({"message": "Product sync started"})
```

---

### **Phase 5: Frontend Integration**

#### 5.1 Products Dashboard Page
**File:** `frontend/src/app/dashboard/products/page.tsx` (NEW)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getApiUrl } from '@/lib/auth';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await fetch(
      getApiUrl(`/products?company_id=${user.companyId}`)
    );
    const data = await response.json();
    setProducts(data.products);
    setLoading(false);
  };

  const viewCreators = (productId: string) => {
    // Navigate to reels page filtered for this product
    window.location.href = `/dashboard/reels?product_id=${productId}`;
  };

  if (loading) {
    return <div>Loading your products...</div>;
  }

  return (
    <div className="products-dashboard">
      <h1>Your Products</h1>
      <p>{products.length} products synced from Shopify</p>

      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.images?.[0]} alt={product.title} />
            <h3>{product.title}</h3>
            <p>{product.description?.substring(0, 100)}...</p>
            <button onClick={() => viewCreators(product.id)}>
              View Matching Creators
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 5.2 Update Reels Page
**File:** `frontend/src/app/dashboard/reels/page.tsx` (MODIFY EXISTING)

Add product filter to existing reels page:

```tsx
// Add product filter to existing reels page
const searchParams = useSearchParams();
const productId = searchParams.get('product_id');

useEffect(() => {
  if (productId) {
    // Fetch creators matched to this specific product
    fetchCreatorsForProduct(productId);
  } else {
    // Show all creators
    fetchAllCreators();
  }
}, [productId]);
```

---

## 🚀 Deployment Checklist

### Backend
- [ ] Run database migration: `creator_matching_schema.sql`
- [ ] Deploy background worker on server (24/7)
- [ ] Update `.env` with all API keys
- [ ] Test product sync endpoint
- [ ] Monitor worker logs

### Frontend
- [ ] Create `/dashboard/products` page
- [ ] Update `/dashboard/reels` for product filtering
- [ ] Test OAuth → Product Sync → View Creators flow

### Testing
- [ ] Connect test Shopify store
- [ ] Verify products sync automatically
- [ ] Check background worker finds relevant creators
- [ ] Test product-to-creator matching
- [ ] Verify reels page shows matches

---

## 📊 Success Metrics

- **Products synced:** All company products indexed within 5 minutes of OAuth
- **Creator discovery:** 50-100 new creators indexed daily
- **Match quality:** 80%+ relevant creators per product
- **Response time:** Product-to-creator search < 2 seconds
- **Worker uptime:** 99%+ background worker availability

---

## 🔧 Technical Stack

| Component | Technology |
|-----------|-----------|
| **Background Worker** | Python + asyncio |
| **Video Analysis** | Google Gemini 2.0 |
| **Embeddings** | Cohere/OpenAI |
| **Vector Database** | Pinecone |
| **Database** | Supabase (PostgreSQL) |
| **Queue (future)** | Redis/Bull (for scaling) |
| **Monitoring** | Logs + error tracking |

---

## 🎯 Next Steps

1. **Immediate:** Run database migration
2. **Phase 1:** Implement product sync (1-2 hours)
3. **Phase 2:** Deploy background worker (2-3 hours)
4. **Phase 3:** Build product dashboard (2-3 hours)
5. **Phase 4:** Test end-to-end flow
6. **Phase 5:** Monitor and optimize

Ready to start implementing! Which phase should we tackle first? 🚀
