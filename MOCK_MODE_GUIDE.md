# Mock Mode Guide

## What is Mock Mode?

Mock mode allows you to test the entire creator discovery system without hitting external API quotas (YouTube Data API & Google Gemini). This is essential for development and testing when you've exceeded your API quotas.

## How It Works

When `USE_MOCK_YOUTUBE=true` is set in your `.env` file:

1. **YouTube Searches** return fake but realistic video data (6 mock creators with varied names)
2. **Video Analysis** returns mock Gemini analysis without calling the actual API
3. **Everything else** works normally (database writes, embeddings, matching, etc.)

## Configuration

### Enable Mock Mode

```env
# In backend/.env
USE_MOCK_YOUTUBE=true
```

### Disable Mock Mode (Production)

```env
# In backend/.env
USE_MOCK_YOUTUBE=false
```

## Testing the System

### Run Immediate Discovery

```bash
cd backend
python3 test_discovery.py
```

This will:
- Trigger immediate creator discovery for your first company
- Process up to 10 products
- Generate 2 keywords per product
- Find 5 videos per keyword (mock data)
- Analyze and store creator videos
- Create product-creator matches

### Check Database State

```bash
python3 check_db.py
```

Shows current counts of:
- Products synced from Shopify
- Creator videos discovered
- Product-creator matches

### Test YouTube Search Only

```bash
python3 test_youtube.py
```

Tests just the YouTube search functionality with mock data.

## Mock Data Structure

### Mock YouTube Videos

Each search returns 6 fake creators:
- TechReviews
- ProductSpotlight
- UnboxingPro
- DailyDeals
- TheBestProducts
- ReviewMaster

Video URLs: `https://www.youtube.com/watch?v=mock{random}`

### Mock Video Analysis

```json
{
  "title_summary": "Product review and unboxing video",
  "objects_actions": ["product showcase", "unboxing", "hands-on review"],
  "aesthetic": "bright, clean, professional, modern",
  "tone_vibe": "enthusiastic, informative, friendly",
  "potential_categories": ["tech", "lifestyle", "reviews", "unboxing"]
}
```

## Current Blocker (Real APIs)

### YouTube API Quota Exceeded

**Error:** `403 quota exceeded`

**Cause:** Free tier has 10,000 units/day limit

**Solutions:**
1. ✅ Use mock mode (already enabled)
2. Wait for quota reset (midnight Pacific Time)
3. Request quota increase from Google Cloud Console
4. Upgrade to paid tier

### Pinecone Storage Limit

**Error:** `429 max storage reached (2 GB)`

**Solution:**
```bash
python3 clear_pinecone.py
```

This will delete all vectors to free up storage.

## Production Deployment

Before deploying to production:

1. **Disable mock mode:**
   ```env
   USE_MOCK_YOUTUBE=false
   ```

2. **Increase worker interval:**
   ```env
   WORKER_CYCLE_INTERVAL_MINUTES=360  # 6 hours
   ```

3. **Get YouTube API quota increased:**
   - Go to Google Cloud Console
   - Navigate to YouTube Data API v3
   - Request quota increase to 100k+ units/day

4. **Upgrade Pinecone:**
   - Consider upgrading from free tier
   - Or implement data retention policies

## Viewing Discovered Creators

1. Go to your frontend: `http://localhost:3000/dashboard/reels`
2. You should see all discovered creator videos
3. Click "Find Creators" from products page to filter by product

## System Architecture

```
Shopify OAuth
     ↓
Product Sync (background)
     ↓
Immediate Discovery Trigger
     ↓
Background Worker
     ├─ Generate Keywords (AI)
     ├─ Search YouTube (mock/real)
     ├─ Analyze Videos (mock/real Gemini)
     ├─ Create Embeddings (Cohere)
     ├─ Store in Pinecone + Supabase
     └─ Match Products ↔ Creators
         ↓
Display in /dashboard/reels
```

## Monitoring

Watch backend logs for:
- `🎭 Mock mode:` - Confirms mock mode is active
- `✅ Indexed:` - Videos successfully stored
- `❌ Analysis failed:` - Issues with video processing
- `🚀 IMMEDIATE DISCOVERY TRIGGERED` - OAuth callback working
