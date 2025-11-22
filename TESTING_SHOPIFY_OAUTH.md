# Testing Shopify OAuth Flow - Quick Start Guide

## Prerequisites

Before testing, you need:
- [ ] Shopify Partner account
- [ ] A test Shopify store (development store)
- [ ] Backend running locally or deployed
- [ ] Database migrations applied

---

## Step 1: Create Shopify Partner Account & App

### 1.1 Sign Up for Shopify Partners

1. Go to https://partners.shopify.com
2. Click **Sign Up** (it's free)
3. Fill in your details and verify email

### 1.2 Create a Development Store (Free Test Store)

1. In Partner Dashboard, go to **Stores** in left sidebar
2. Click **Add store** → **Development store**
3. Fill in:
   - **Store name**: `maatchaa-test` (or anything)
   - **Store purpose**: Testing an app
   - **Store type**: Developer Preview
4. Click **Create development store**
5. Note the store URL: `maatchaa-test.myshopify.com`

### 1.3 Create Your App

1. In Partner Dashboard, go to **Apps**
2. Click **Create app**
3. Choose **Create app manually**
4. Fill in:
   - **App name**: `Maatchaa Dev`
   - **App URL**: `https://maatchaa.vercel.app` (your frontend)
5. Click **Create**

---

## Step 2: Configure App Settings

### 2.1 Get Your Credentials

1. In your app settings, go to **App setup** → **Settings**
2. **Client ID**: Copy this (e.g., `abc123def456`)
3. **Client Secret**: Click "Show" and copy (e.g., `shpss_1234567890abcdef`)

**SAVE THESE SOMEWHERE SAFE!**

### 2.2 Set Up OAuth (This is the critical part!)

#### If Testing Locally with ngrok:

1. **Install ngrok**:
```bash
# On Mac
brew install ngrok

# On Windows/Linux
# Download from https://ngrok.com/download
```

2. **Run your backend**:
```bash
cd backend
uvicorn API:app --reload --port 8000
```

3. **In another terminal, start ngrok**:
```bash
ngrok http 8000
```

4. **Copy the ngrok URL** (looks like `https://abc123.ngrok.io`)

5. **In Shopify Partner Dashboard**:
   - Go to your app → **Configuration**
   - **App URL**: `https://maatchaa.vercel.app`
   - **Allowed redirection URL(s)**: Add your ngrok URL:
     ```
     https://abc123.ngrok.io/shopify/callback
     ```
   - Click **Save**

6. **Configure Scopes** (scroll down to "Access scopes"):
   - In the **Optional scopes** textarea, paste:
     ```
     read_products,read_orders,read_discounts,write_discounts,read_inventory
     ```
   - Click **Save**

#### If Testing on Deployed Backend:

1. **In Shopify Partner Dashboard**:
   - Go to your app → **Configuration**
   - **App URL**: `https://maatchaa.vercel.app`
   - **Allowed redirection URL(s)**:
     ```
     https://api.maatchaa.com/shopify/callback
     ```
   - **Optional scopes**:
     ```
     read_products,read_orders,read_discounts,write_discounts,read_inventory
     ```
   - Click **Save**

---

## Step 3: Configure Backend Environment

### 3.1 Update .env File

Create or update `backend/.env`:

#### For Local Testing (with ngrok):

```bash
# Shopify OAuth
SHOPIFY_API_KEY=your_client_id_from_step_2.1
SHOPIFY_API_SECRET=your_client_secret_from_step_2.1
SHOPIFY_SCOPES=read_products,read_orders,read_discounts,write_discounts,read_inventory
SHOPIFY_REDIRECT_URI=https://abc123.ngrok.io/shopify/callback  # YOUR ngrok URL

# URLs
APP_URL=http://localhost:3000  # Or your local frontend
API_URL=https://abc123.ngrok.io  # YOUR ngrok URL

# Database (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

#### For Production Testing:

```bash
# Shopify OAuth
SHOPIFY_API_KEY=your_client_id
SHOPIFY_API_SECRET=your_client_secret
SHOPIFY_SCOPES=read_products,read_orders,read_discounts,write_discounts,read_inventory
SHOPIFY_REDIRECT_URI=https://api.maatchaa.com/shopify/callback

# URLs
APP_URL=https://maatchaa.vercel.app
API_URL=https://api.maatchaa.com

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
```

### 3.2 Restart Backend

If running locally:
```bash
# Stop the server (Ctrl+C) and restart
uvicorn API:app --reload --port 8000
```

If deployed:
```bash
# Redeploy with new env vars
```

---

## Step 4: Set Up Database

### 4.1 Apply Database Migrations

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the contents from `backend/data/schema.sql` (the OAuth tables section)
3. Or just run these commands:

```sql
-- Shopify OAuth tokens table
CREATE TABLE IF NOT EXISTS shopify_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    shop_domain TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    scope TEXT NOT NULL,
    token_type TEXT DEFAULT 'offline',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(company_id, shop_domain)
);

-- Shopify shop information table
CREATE TABLE IF NOT EXISTS shopify_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    shop_domain TEXT NOT NULL UNIQUE,
    shop_id BIGINT,
    shop_name TEXT,
    shop_owner TEXT,
    email TEXT,
    domain TEXT,
    country TEXT,
    currency TEXT,
    timezone TEXT,
    iana_timezone TEXT,
    plan_name TEXT,
    plan_display_name TEXT,
    shop_created_at TIMESTAMPTZ,
    province TEXT,
    city TEXT,
    address1 TEXT,
    zip TEXT,
    phone TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    primary_locale TEXT,
    money_format TEXT,
    money_with_currency_format TEXT,
    weight_unit TEXT,
    myshopify_domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    UNIQUE(company_id, shop_domain)
);

-- OAuth state management (for CSRF protection)
CREATE TABLE IF NOT EXISTS shopify_oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state TEXT NOT NULL UNIQUE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    shop_domain TEXT NOT NULL,
    redirect_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes',
    used BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_company_id ON shopify_oauth_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_shop_domain ON shopify_oauth_tokens(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_is_active ON shopify_oauth_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_shopify_shops_company_id ON shopify_shops(company_id);
CREATE INDEX IF NOT EXISTS idx_shopify_shops_shop_domain ON shopify_shops(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_state ON shopify_oauth_states(state);
```

4. Click **Run** (bottom right)

### 4.2 Get a Test Company ID

You need a `company_id` from your database to test with:

```sql
-- Get a company ID (or create one)
SELECT id FROM companies LIMIT 1;

-- If no companies exist, create one:
INSERT INTO companies (company_name, store_url)
VALUES ('Test Company', 'test-store.myshopify.com')
RETURNING id;
```

**Copy the company UUID** (e.g., `550e8400-e29b-41d4-a716-446655440000`)

---

## Step 5: Test the OAuth Flow! 🚀

### 5.1 Build the Install URL

Replace these values:
- `YOUR_API_URL`: Your ngrok URL or production API URL
- `YOUR_STORE`: Your development store name (from Step 1.2)
- `YOUR_COMPANY_ID`: The UUID from Step 4.2

**Install URL format:**
```
{YOUR_API_URL}/shopify/install?shop={YOUR_STORE}&company_id={YOUR_COMPANY_ID}
```

**Example with ngrok:**
```
https://abc123.ngrok.io/shopify/install?shop=maatchaa-test.myshopify.com&company_id=550e8400-e29b-41d4-a716-446655440000
```

**Example with production:**
```
https://api.maatchaa.com/shopify/install?shop=maatchaa-test.myshopify.com&company_id=550e8400-e29b-41d4-a716-446655440000
```

### 5.2 Open the URL in Your Browser

1. **Copy the install URL** from above
2. **Paste it in your browser**
3. You should be redirected to Shopify
4. **Review the permissions** - it should show:
   - Read products
   - Read orders
   - Read and write discounts
   - Read inventory
5. Click **Install app**

### 5.3 What Should Happen

1. ✅ Redirects to Shopify authorization page
2. ✅ Shows permission scopes
3. ✅ After clicking "Install", redirects back to your callback
4. ✅ Exchanges code for access token
5. ✅ Saves token and shop info to database
6. ✅ Redirects to your frontend with success message

**Success URL (where you'll end up):**
```
https://maatchaa.vercel.app/dashboard/settings?shopify=connected&shop=maatchaa-test.myshopify.com
```

---

## Step 6: Verify It Worked

### 6.1 Check the Database

In Supabase SQL Editor:

```sql
-- Check OAuth token was saved
SELECT
    shop_domain,
    scope,
    is_active,
    created_at
FROM shopify_oauth_tokens
WHERE shop_domain = 'maatchaa-test.myshopify.com';

-- Check shop info was saved
SELECT
    shop_name,
    shop_owner,
    email,
    currency,
    country
FROM shopify_shops
WHERE shop_domain = 'maatchaa-test.myshopify.com';
```

You should see data in both tables!

### 6.2 Test the Status Endpoint

**Using curl:**
```bash
curl "https://abc123.ngrok.io/shopify/status?company_id=550e8400-e29b-41d4-a716-446655440000"
```

**Expected response:**
```json
{
  "connected": true,
  "shop": {
    "domain": "maatchaa-test.myshopify.com",
    "name": "Maatchaa Test Store",
    "email": "you@example.com",
    "currency": "USD"
  },
  "scopes": "read_products,read_orders,read_discounts,write_discounts,read_inventory",
  "connected_at": "2025-11-18T12:34:56.789Z"
}
```

### 6.3 Test Fetching Products

Create a test script `backend/test_shopify.py`:

```python
import asyncio
from utils.shopify_api import ShopifyAPIClient
from dotenv import load_dotenv
load_dotenv()

async def test_fetch_products():
    # Get token from database
    from utils.supabase import SupabaseClient
    client = SupabaseClient()
    await client.initialize()

    result = await client.client.table("shopify_oauth_tokens")\
        .select("*")\
        .eq("shop_domain", "maatchaa-test.myshopify.com")\
        .eq("is_active", True)\
        .execute()

    if not result.data:
        print("❌ No token found")
        return

    token_data = result.data[0]
    shop = token_data["shop_domain"]
    access_token = token_data["access_token"]

    # Create API client and fetch products
    shopify_client = ShopifyAPIClient(shop, access_token)

    print(f"✅ Connected to {shop}")

    # Get shop info
    shop_info = shopify_client.get_shop_info()
    print(f"📊 Shop: {shop_info.get('name')}")

    # Get product count
    count = shopify_client.get_product_count()
    print(f"📦 Total products: {count}")

    # Get products
    products = shopify_client.get_products(limit=5)
    print(f"\n🛍️ First 5 products:")
    for p in products.get("products", []):
        print(f"  - {p['title']} (${p['variants'][0]['price']})")

asyncio.run(test_fetch_products())
```

**Run it:**
```bash
cd backend
python test_shopify.py
```

**Expected output:**
```
✅ Connected to maatchaa-test.myshopify.com
📊 Shop: Maatchaa Test Store
📦 Total products: 3
🛍️ First 5 products:
  - Ceremonial Matcha Powder ($29.99)
  - Bamboo Whisk ($12.99)
  - Matcha Bowl Set ($45.00)
```

---

## Troubleshooting

### Error: "Invalid redirect URI"

**Problem:** Shopify doesn't recognize your callback URL

**Fix:**
1. Check `.env` - does `SHOPIFY_REDIRECT_URI` match what's in Shopify Partner Dashboard?
2. In Partner Dashboard → Configuration → Allowed redirection URLs, make sure it's EXACTLY:
   - `https://abc123.ngrok.io/shopify/callback` (for ngrok)
   - OR `https://api.maatchaa.com/shopify/callback` (for production)
3. No typos, no trailing slashes!

### Error: "Invalid HMAC signature"

**Problem:** HMAC verification failed

**Fix:**
1. Double-check `SHOPIFY_API_SECRET` in `.env`
2. Make sure you copied the full secret from Partner Dashboard
3. Restart your backend after changing `.env`

### Error: "Missing company_id parameter"

**Problem:** No `company_id` in the URL

**Fix:**
Make sure your install URL includes `&company_id=YOUR_UUID`:
```
https://abc123.ngrok.io/shopify/install?shop=test.myshopify.com&company_id=550e8400-e29b-41d4-a716-446655440000
```

### Ngrok URL keeps changing

**Problem:** Every time you restart ngrok, the URL changes

**Fix:**
1. Sign up for free ngrok account
2. Get your auth token
3. Run: `ngrok config add-authtoken YOUR_TOKEN`
4. Use a static domain (paid feature) OR update Shopify each time

**Alternative:** Deploy to production instead of using ngrok

### OAuth loop (keeps redirecting)

**Problem:** Callback fails silently

**Fix:**
1. Check backend logs for errors
2. Make sure database tables exist
3. Verify `APP_URL` is correct in `.env`
4. Check CORS settings

---

## Quick Test Checklist

- [ ] Created Shopify Partner account
- [ ] Created development store
- [ ] Created app in Partner Dashboard
- [ ] Copied Client ID and Secret
- [ ] Added redirect URL in Partner Dashboard
- [ ] Added scopes in Partner Dashboard
- [ ] Updated `.env` with credentials
- [ ] Applied database migrations
- [ ] Got a company UUID
- [ ] Built install URL
- [ ] Opened install URL in browser
- [ ] Clicked "Install app"
- [ ] Redirected to frontend with success message
- [ ] Verified token in database
- [ ] Tested `/shopify/status` endpoint
- [ ] Fetched products using API client

---

## Next Steps After Testing Works

1. ✅ Add "Connect Shopify" button in frontend
2. ✅ Sync products automatically
3. ✅ Create discount codes for creators
4. ✅ Track orders with creator attribution
5. ✅ Build product matching flow

---

**Need help?** Check backend logs or inspect database tables for clues!
