# Creator Discovery Worker - Complete Guide

## 🚀 What Changed

I've upgraded the background worker from simple polling to an **event-driven + configurable** architecture:

### Before:
- ❌ Fixed 6-hour intervals (slow for testing)
- ❌ Only runs on schedule
- ❌ New companies wait hours for discovery

### After:
- ✅ **Configurable intervals** (5 minutes for testing, adjustable via .env)
- ✅ **Immediate discovery** triggered after OAuth
- ✅ **On-demand API endpoint** to trigger discovery manually
- ✅ **Scheduled + Event-driven** hybrid approach

---

## ⚙️ Configuration

All settings are in `.env` file:

```env
# Background Worker Configuration
WORKER_CYCLE_INTERVAL_MINUTES=5       # Testing: 5 min | Production: 360 (6 hours)
WORKER_PRODUCTS_PER_CYCLE=10          # Max products per cycle
WORKER_KEYWORDS_PER_PRODUCT=2         # Keywords to search per product
WORKER_VIDEOS_PER_KEYWORD=5           # Videos to analyze per keyword
```

### Testing Configuration (Current):
- **5 minutes** between cycles
- Fast iteration for debugging

### Production Configuration:
```env
WORKER_CYCLE_INTERVAL_MINUTES=360     # 6 hours
WORKER_PRODUCTS_PER_CYCLE=50          # More products
WORKER_KEYWORDS_PER_PRODUCT=3         # More keywords
WORKER_VIDEOS_PER_KEYWORD=10          # More videos
```

---

## 🔄 How It Works Now

### 1. **Immediate Discovery (Event-Driven)**

When a company connects Shopify:

```
User connects Shopify
     ↓
OAuth callback syncs products
     ↓
🚀 Immediately triggers discovery (no wait!)
     ↓
Discovers creators in background
     ↓
Results appear in ~2-5 minutes
```

**Code flow:**
```python
# API.py - OAuth callback (line 765-772)
# After syncing products:
from background_worker import trigger_immediate_discovery
asyncio.create_task(trigger_immediate_discovery(company_id, shop))
```

### 2. **Scheduled Discovery (Periodic)**

Background worker runs continuously:

```
Every 5 minutes (configurable):
     ↓
Fetch all products from database
     ↓
Process 10 products (configurable)
     ↓
Search YouTube → Analyze → Store
     ↓
Sleep 5 minutes
     ↓
Repeat (finds NEW creators for existing products)
```

### 3. **Manual Trigger (API Endpoint)**

You can also trigger discovery via API:

```bash
curl -X POST http://localhost:5001/products/trigger-discovery \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "your-company-uuid",
    "shop_domain": "yourstore.myshopify.com"
  }'
```

**Response:**
```json
{
  "message": "Discovery triggered successfully",
  "company_id": "...",
  "status": "processing"
}
```

---

## 🧪 Testing

### Step 1: Set Fast Interval (Already Done!)

Your `.env` is configured for testing:
```env
WORKER_CYCLE_INTERVAL_MINUTES=5
```

### Step 2: Start the Worker

```bash
cd backend
./start_worker.sh
```

**Expected output:**
```
============================================================
  MAATCHAA CREATOR DISCOVERY WORKER
  Intelligent Product-to-Creator Matching
============================================================

============================================================
🚀 CREATOR DISCOVERY WORKER STARTED
============================================================
⚙️  Configuration:
   • Cycle Interval: 5 minutes
   • Products per Cycle: 10
   • Keywords per Product: 2
   • Videos per Keyword: 5
============================================================

============================================================
🔄 CYCLE #1 - 251070.890765916
============================================================

⚠️  No products found in database
💡 Waiting for companies to connect Shopify stores...
```

### Step 3: Connect Shopify Store

1. Go to `http://localhost:3000/dashboard/settings`
2. Click "Connect Shopify Store"
3. Complete OAuth flow

**What happens:**
1. OAuth syncs products ✅
2. **Immediate discovery starts** (background) ✅
3. Redirects to `/dashboard/products` ✅
4. Within 2-5 minutes, see creator matches appear ✅

### Step 4: Watch Worker Logs

After OAuth, you should see:

```
🚀 IMMEDIATE DISCOVERY TRIGGERED for company: abc-123-def
📊 Found 15 products for immediate discovery

🎯 Processing: Matcha Green Tea Powder
   🔑 Keywords: Matcha Green Tea Powder review, Matcha Green Tea Powder unboxing, ...
   🔎 Searching YouTube: 'Matcha Green Tea Powder review'
      ✅ Found 5 videos
         🎥 Analyzing: I Tried Every Matcha Brand...
         ✅ Indexed: I Tried Every Matcha Brand...
   🔎 Searching YouTube: 'Matcha Green Tea Powder unboxing'
      ✅ Found 5 videos
         ...

✅ Immediate discovery complete for 10 products
```

### Step 5: Check Results

```bash
# In products dashboard (http://localhost:3000/dashboard/products)
# You should see:
# - Products listed ✅
# - Match counts > 0 ✅
# - "Find Creators" button works ✅
```

---

## 🎛️ Adjusting for Production

When ready for production, update `.env`:

```env
# Production settings (slower, more thorough)
WORKER_CYCLE_INTERVAL_MINUTES=360     # Every 6 hours
WORKER_PRODUCTS_PER_CYCLE=50          # More products
WORKER_KEYWORDS_PER_PRODUCT=3         # More keywords
WORKER_VIDEOS_PER_KEYWORD=10          # More videos
```

**Then restart worker:**
```bash
pkill -f background_worker.py
./start_worker.sh
```

---

## 🐛 Troubleshooting

### "No products found" (Expected on first run)
- Normal if no Shopify stores connected
- Worker sleeps 30 min, then retries
- Connect store via OAuth to see action

### "SupabaseClient has no attribute 'client'"
- ✅ **FIXED** - Worker now calls `await supabase.initialize()`

### "Discovery not triggering after OAuth"
- Check API.py logs for import errors
- Make sure background_worker.py is in Python path
- Verify immediate discovery task doesn't fail silently

### Want even faster testing?
```env
WORKER_CYCLE_INTERVAL_MINUTES=1  # Every 1 minute!
```

---

## 📊 Monitoring

### Check Worker Status
```bash
ps aux | grep background_worker
```

### View Logs
Worker prints detailed progress:
- Which products being processed
- Which keywords searching
- How many videos found
- Analysis results
- Errors (if any)

### Database Queries

**Count products:**
```sql
SELECT COUNT(*) FROM company_products;
```

**Count discovered creators:**
```sql
SELECT COUNT(*) FROM creator_videos;
```

**Count matches:**
```sql
SELECT COUNT(*) FROM product_creator_matches;
```

**See recent matches:**
```sql
SELECT
    p.title AS product,
    v.title AS video,
    v.channel_title AS creator,
    m.similarity_score
FROM product_creator_matches m
JOIN company_products p ON m.product_id = p.id
JOIN creator_videos v ON m.video_id = v.video_id
ORDER BY m.created_at DESC
LIMIT 10;
```

---

## 🚦 API Endpoints

### GET `/products`
Fetch company products with match counts

### GET `/products/{product_id}/creators`
Get matched creators for a product

### POST `/products/resync`
Manually resync products from Shopify

### POST `/products/trigger-discovery`  🆕
Trigger immediate discovery for a company

**Example:**
```bash
curl -X POST http://localhost:5001/products/trigger-discovery \
  -H "Content-Type: application/json" \
  -d '{"company_id": "uuid-here"}'
```

---

## 🎯 Summary

**For Testing (Now):**
- ✅ 5-minute cycles
- ✅ Immediate discovery on OAuth
- ✅ Fast feedback loop

**For Production (Later):**
- Change to 6-hour cycles
- Keeps discovering new creators over time
- Immediate discovery still works for new companies

**Best of Both Worlds:**
- New companies: instant discovery ⚡
- Existing products: periodic re-discovery 🔄
- Manual control: API trigger 🎛️
