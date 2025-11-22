# Shopify OAuth Setup Guide for Maatchaa

Complete guide to setting up Shopify OAuth integration using the Authorization Code Grant flow.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Shopify Partner Dashboard Setup](#shopify-partner-dashboard-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Testing the OAuth Flow](#testing-the-oauth-flow)
7. [Frontend Integration](#frontend-integration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The OAuth flow enables external Shopify merchants to install Maatchaa and grant access to their store data. The flow works as follows:

```
1. Merchant clicks "Connect Shopify" in your app
2. Redirect to /shopify/install?shop=STORE_NAME&company_id=COMPANY_ID
3. Backend redirects merchant to Shopify authorization page
4. Merchant approves permissions
5. Shopify redirects back to /shopify/callback with authorization code
6. Backend exchanges code for access token
7. Token stored in database
8. Merchant redirected back to your app (connected state)
```

---

## Prerequisites

Before starting, ensure you have:

- [ ] Shopify Partner account (https://partners.shopify.com)
- [ ] A deployed backend API (or ngrok for local development)
- [ ] Supabase database with proper schema
- [ ] Environment variables configured

---

## Shopify Partner Dashboard Setup

### Step 1: Create a Shopify Partner Account

1. Go to https://partners.shopify.com
2. Click "Sign Up" and create an account
3. Complete the onboarding process

### Step 2: Create a New App

1. Log in to Shopify Partner Dashboard
2. Navigate to **Apps** in the left sidebar
3. Click **Create App**
4. Choose **Custom app** or **Public app** depending on your needs:
   - **Custom app**: For specific merchants (limited distribution)
   - **Public app**: For listing in Shopify App Store (recommended for Maatchaa)

5. Fill in basic information:
   - **App name**: `Maatchaa` (or `Maatchaa Dev` for testing)
   - **App URL**: Your frontend URL (e.g., `https://maatchaa.vercel.app`)
   - **Allowed redirection URL(s)**: Your OAuth callback URL

### Step 3: Configure OAuth Settings

#### Redirect URLs

In the **App setup** section, add your callback URL(s):

**Production:**
```
https://api.maatchaa.com/shopify/callback
```

**Development/Testing (if using ngrok):**
```
https://YOUR_NGROK_URL/shopify/callback
```

**Multiple environments (comma-separated):**
```
https://api.maatchaa.com/shopify/callback,
https://api-staging.maatchaa.com/shopify/callback
```

#### Access Scopes

In the **Configuration** tab, find the **Optional scopes** section and enter the following scopes (comma-separated):

```
read_products,read_orders,read_discounts,write_discounts,read_inventory,read_analytics,read_reports
```

**Detailed breakdown:**

| Scope | Purpose |
|-------|---------|
| `read_products` | Fetch product catalog for matching with videos |
| `read_orders` | Track conversions and revenue attribution |
| `read_discounts` | Check existing discount codes |
| `write_discounts` | Create unique discount codes for creators |
| `read_inventory` | Display product availability status |
| `read_analytics` | Get detailed performance metrics |
| `read_reports` | Generate custom reports on creator sales |

**Optional (add later if needed):**
- `write_products` - To tag products with creator match data
- `write_orders` - To add notes/tags to orders
- `read_marketing_events` - Track marketing campaigns
- `write_marketing_events` - Create marketing events for partnerships

### Step 4: Configure App Proxy (Optional)

If you want to embed content in the merchant's storefront:

1. Go to **Extensions** → **App proxy**
2. **Subpath prefix**: `apps`
3. **Subpath**: `maatchaa` (URL will be: `https://store.com/apps/maatchaa`)
4. **Proxy URL**: Your API URL + endpoint (e.g., `https://api.maatchaa.com/proxy`)

### Step 5: Get Your Credentials

1. Go to **App setup** → **Settings**
2. Note down:
   - **Client ID** (also called API Key)
   - **Client Secret** (click "Show" to reveal)

**IMPORTANT:** Keep the Client Secret secure! Never commit it to git.

### Step 6: Configure App URL and Redirection

1. **App URL**: `https://maatchaa.vercel.app`
2. **Allowed redirection URL(s)**:
   ```
   https://api.maatchaa.com/shopify/callback
   ```

### Step 7: App Distribution (Optional - for Public Apps)

If you want to list on Shopify App Store:

1. Complete app listing details
2. Add screenshots and description
3. Submit for review

For now, you can use **Development stores** or **Custom installation link**

---

## Environment Configuration

### Backend Environment Variables

Add these to your `.env` file:

```bash
# Shopify OAuth Configuration
SHOPIFY_API_KEY=your_client_id_here
SHOPIFY_API_SECRET=your_client_secret_here
SHOPIFY_SCOPES=read_products,read_orders,read_discounts,write_discounts,read_inventory,read_analytics,read_reports
SHOPIFY_REDIRECT_URI=https://api.maatchaa.com/shopify/callback

# App URLs
APP_URL=https://maatchaa.vercel.app
API_URL=https://api.maatchaa.com
```

### Development (Using ngrok)

If testing locally:

1. Install ngrok: `brew install ngrok` or download from https://ngrok.com
2. Run your backend: `uvicorn API:app --reload`
3. In another terminal: `ngrok http 8000`
4. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Update environment variables:

```bash
SHOPIFY_REDIRECT_URI=https://abc123.ngrok.io/shopify/callback
API_URL=https://abc123.ngrok.io
```

6. Add ngrok URL to Shopify Partner Dashboard → Redirect URLs

---

## Database Setup

### Run Database Migrations

The OAuth tables are defined in `backend/data/schema.sql`. Run these SQL commands in your Supabase SQL Editor:

```sql
-- Copy the contents of backend/data/schema.sql
-- Specifically the OAuth-related tables:
-- - shopify_oauth_tokens
-- - shopify_shops
-- - shopify_oauth_states
```

Or if using a migration tool:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard → SQL Editor
```

### Verify Tables Created

Check that these tables exist:

- [x] `shopify_oauth_tokens` - Stores access tokens
- [x] `shopify_shops` - Stores shop information
- [x] `shopify_oauth_states` - CSRF protection (temporary)
- [x] `companies` - Your existing companies table (referenced by foreign keys)

---

## Testing the OAuth Flow

### Step 1: Create a Development Store (Optional)

1. In Shopify Partner Dashboard, go to **Stores**
2. Click **Add store** → **Development store**
3. Fill in details and create
4. This gives you a free test store to install your app

### Step 2: Generate Install URL

The install URL format is:

```
https://api.maatchaa.com/shopify/install?shop=YOUR_STORE&company_id=COMPANY_UUID
```

**Example:**

```
https://api.maatchaa.com/shopify/install?shop=maatchaa-dev.myshopify.com&company_id=550e8400-e29b-41d4-a716-446655440000
```

**Parameters:**
- `shop`: Shopify store domain (can be `store-name` or `store-name.myshopify.com`)
- `company_id`: UUID of the company from your `companies` table

### Step 3: Test the Flow

1. Open the install URL in your browser
2. You should be redirected to Shopify
3. Review the permissions requested
4. Click **Install app**
5. You'll be redirected back to your app with `?shopify=connected&shop=...`

### Step 4: Verify in Database

Check that data was saved:

```sql
-- Check OAuth token was stored
SELECT * FROM shopify_oauth_tokens WHERE shop_domain = 'your-store.myshopify.com';

-- Check shop info was stored
SELECT * FROM shopify_shops WHERE shop_domain = 'your-store.myshopify.com';
```

### Step 5: Test API Endpoints

**Check connection status:**

```bash
curl "https://api.maatchaa.com/shopify/status?company_id=YOUR_COMPANY_ID"
```

**Expected response:**

```json
{
  "connected": true,
  "shop": {
    "domain": "your-store.myshopify.com",
    "name": "Your Store Name",
    "email": "owner@example.com",
    "currency": "USD"
  },
  "scopes": "read_products,read_orders,...",
  "connected_at": "2025-11-18T12:34:56Z"
}
```

---

## Frontend Integration

### Step 1: Add Connect Button in Settings Page

In your Next.js frontend (`/dashboard/settings`):

```tsx
// app/dashboard/settings/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@radix-ui/themes'

export default function SettingsPage() {
  const [shopifyConnected, setShopifyConnected] = useState(false)
  const [shopInfo, setShopInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  const companyId = "YOUR_COMPANY_ID" // Get from session/context

  useEffect(() => {
    checkShopifyStatus()
  }, [])

  const checkShopifyStatus = async () => {
    try {
      const res = await fetch(`https://api.maatchaa.com/shopify/status?company_id=${companyId}`)
      const data = await res.json()
      setShopifyConnected(data.connected)
      setShopInfo(data.shop)
    } catch (error) {
      console.error('Failed to check Shopify status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectShopify = () => {
    const shop = prompt('Enter your Shopify store name (e.g., my-store or my-store.myshopify.com)')
    if (!shop) return

    const installUrl = `https://api.maatchaa.com/shopify/install?shop=${shop}&company_id=${companyId}`
    window.location.href = installUrl
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Shopify store?')) return

    try {
      await fetch('https://api.maatchaa.com/shopify/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId })
      })
      setShopifyConnected(false)
      setShopInfo(null)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Shopify Integration</h1>

      {!shopifyConnected ? (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Connect Your Shopify Store</h2>
          <p className="text-gray-600 mb-4">
            Connect your Shopify store to automatically sync products and track creator sales.
          </p>
          <Button onClick={handleConnectShopify}>
            Connect Shopify
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Connected Store</h2>
          <div className="mb-4">
            <p><strong>Store:</strong> {shopInfo?.name}</p>
            <p><strong>Domain:</strong> {shopInfo?.domain}</p>
            <p><strong>Email:</strong> {shopInfo?.email}</p>
            <p><strong>Currency:</strong> {shopInfo?.currency}</p>
          </div>
          <Button color="red" onClick={handleDisconnect}>
            Disconnect Shopify
          </Button>
        </div>
      )}
    </div>
  )
}
```

### Step 2: Handle OAuth Callback Success/Error

Add URL parameter handling to show success/error messages:

```tsx
// In the same component

useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const shopify = params.get('shopify')
  const shop = params.get('shop')
  const message = params.get('message')

  if (shopify === 'connected' && shop) {
    alert(`Successfully connected to ${shop}!`)
    window.history.replaceState({}, '', window.location.pathname)
    checkShopifyStatus()
  } else if (shopify === 'error') {
    alert(`Failed to connect: ${message || 'Unknown error'}`)
    window.history.replaceState({}, '', window.location.pathname)
  }
}, [])
```

---

## Using the Shopify API Client

Once a store is connected, you can make authenticated API calls:

```python
# Example: Fetch products for a company

from utils.shopify_api import ShopifyAPIClient

async def sync_shopify_products(company_id: str):
    # Get access token from database
    token_result = await supabase_client.client.table("shopify_oauth_tokens")\
        .select("*")\
        .eq("company_id", company_id)\
        .eq("is_active", True)\
        .execute()

    if not token_result.data:
        raise Exception("No active Shopify connection")

    token_data = token_result.data[0]
    shop_domain = token_data["shop_domain"]
    access_token = token_data["access_token"]

    # Create API client
    client = ShopifyAPIClient(shop_domain, access_token)

    # Fetch products
    products_response = client.get_products(limit=250)
    products = products_response.get("products", [])

    # Process and store products
    for product in products:
        # Save to database, create embeddings, etc.
        pass
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid redirect URI"

**Problem:** Shopify rejects the callback URL

**Solution:**
- Ensure the redirect URI in `.env` EXACTLY matches what's in Shopify Partner Dashboard
- Include protocol (`https://`)
- No trailing slashes
- Check for typos

#### 2. "Invalid HMAC signature"

**Problem:** HMAC verification fails in callback

**Solution:**
- Verify `SHOPIFY_API_SECRET` is correct
- Check that query parameters aren't being modified
- Ensure no URL decoding issues

#### 3. "Invalid or expired state parameter"

**Problem:** State verification fails

**Solution:**
- Check database connection
- Verify `shopify_oauth_states` table exists
- State expires after 10 minutes - retry installation
- Clear old states: `DELETE FROM shopify_oauth_states WHERE expires_at < NOW()`

#### 4. OAuth loop (keeps redirecting)

**Problem:** Callback doesn't complete properly

**Solution:**
- Check backend logs for errors
- Verify database inserts are working
- Ensure `APP_URL` is correct for redirects
- Check CORS settings if frontend is on different domain

#### 5. "Missing required scopes"

**Problem:** App doesn't have necessary permissions

**Solution:**
- Update scopes in Shopify Partner Dashboard
- Ask merchant to reinstall app (scopes only updated on install)
- Check `scope` field in database matches what's needed

### Debugging Tips

**Enable verbose logging:**

```python
# In shopify_oauth.py, add print statements
def exchange_code_for_token(shop: str, code: str):
    print(f"Exchanging code for shop: {shop}")
    # ... rest of function
```

**Check OAuth states:**

```sql
-- View all OAuth attempts
SELECT * FROM shopify_oauth_states ORDER BY created_at DESC LIMIT 10;

-- Clean up old/expired states
DELETE FROM shopify_oauth_states WHERE expires_at < NOW() OR used = TRUE;
```

**Inspect access tokens:**

```sql
-- View active tokens
SELECT
    sot.shop_domain,
    sot.scope,
    sot.created_at,
    ss.shop_name,
    c.company_name
FROM shopify_oauth_tokens sot
LEFT JOIN shopify_shops ss ON sot.shop_domain = ss.shop_domain
LEFT JOIN companies c ON sot.company_id = c.id
WHERE sot.is_active = TRUE;
```

---

## Security Best Practices

1. **Never expose Client Secret:**
   - Don't commit to Git
   - Use environment variables
   - Rotate immediately if compromised

2. **Verify HMAC on all Shopify requests:**
   - Prevents request tampering
   - Already implemented in `verify_shopify_request()`

3. **Use HTTPS only:**
   - No HTTP in production
   - Shopify requires HTTPS for OAuth

4. **Implement webhook HMAC verification:**
   - Verify webhooks are from Shopify
   - TODO: Add HMAC check in `/shopify/webhooks/uninstall`

5. **Rate limit OAuth endpoints:**
   - Prevent abuse
   - Use middleware or CloudFlare

6. **Clean up expired states:**
   - Run cleanup function periodically
   - Prevents database bloat

---

## Next Steps

- [ ] Test OAuth flow end-to-end
- [ ] Sync products from connected stores
- [ ] Create discount codes for creators
- [ ] Track orders with creator attribution
- [ ] Implement webhook HMAC verification
- [ ] Add error monitoring (Sentry)
- [ ] Set up automated token refresh (if using online access mode)

---

## Resources

- [Shopify OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify Admin API Reference](https://shopify.dev/docs/api/admin-rest)
- [Shopify App Store Requirements](https://shopify.dev/docs/apps/store/requirements)
- [Partner Dashboard](https://partners.shopify.com)

---

**Questions or issues?** Check the troubleshooting section or review backend logs.

**Built with:** Python, BlackSheep, Supabase, and Shopify OAuth 2.0
