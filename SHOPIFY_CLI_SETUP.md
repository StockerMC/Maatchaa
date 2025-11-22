# Shopify CLI Setup Guide for Maatchaa

Complete guide to set up Shopify app using CLI while keeping Python backend for AI features.

---

## Architecture Overview

```
┌─────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│   Shopify   │ ←──→ │  Shopify CLI App     │ ←──→ │  Python Backend     │
│             │      │  (Remix/Next.js)     │      │  (BlackSheep)       │
└─────────────┘      └──────────────────────┘      └─────────────────────┘
                              ↓                              ↓
                     - OAuth (automatic)              - AI matching
                     - Embedded UI                    - Vector search
                     - App extensions                 - YouTube analysis
                     - Shopify API calls              - Product showcase
```

---

## Step 1: Install Shopify CLI

```bash
# Install globally
npm install -g @shopify/cli @shopify/app

# Verify installation
shopify version
# Should show: 3.x.x or higher
```

---

## Step 2: Authenticate with Shopify Partners

```bash
shopify auth login
```

This will open your browser and log you into your Shopify Partners account.

---

## Step 3: Create New Shopify App

```bash
cd ~/Desktop/crackthenorth2025

# Create new Shopify app
shopify app init
```

**You'll be prompted to choose:**

1. **App name:** `maatchaa-shopify`
2. **Template:** Choose **Remix** (recommended) or **Next.js**
   - Remix = Better for server-side, embedded apps
   - Next.js = Better if you want to use existing Next.js frontend
3. **Language:** TypeScript (recommended)
4. **Install dependencies:** Yes

This creates a new folder: `maatchaa-shopify/`

---

## Step 4: Project Structure

After creation, you'll have:

```
crackthenorth2025/
├── backend/                    # Your Python backend (keep this!)
│   ├── API.py
│   ├── utils/
│   │   ├── shopify_oauth.py   # Move to backup/
│   │   ├── shopify_api.py     # Keep for reference
│   │   └── ...
│   └── ...
├── maatchaa-shopify/          # NEW: Shopify CLI app
│   ├── app/                   # Remix routes
│   ├── extensions/            # App extensions
│   ├── shopify.app.toml       # App configuration
│   ├── package.json
│   └── ...
└── frontend/                  # Your existing Next.js app (if you have one)
```

---

## Step 5: Configure the App

Edit `maatchaa-shopify/shopify.app.toml`:

```toml
# App name
name = "maatchaa"

# Your app's URL when deployed
application_url = "https://maatchaa-shopify.vercel.app"

# Scopes your app needs
[access_scopes]
scopes = "read_products,read_orders,read_discounts,write_discounts,read_inventory,read_analytics,read_reports"

[auth]
redirect_urls = [
  "https://maatchaa-shopify.vercel.app/auth/callback",
  "https://maatchaa-shopify.vercel.app/auth/shopify/callback",
]

[webhooks]
api_version = "2024-01"

[[webhooks.subscriptions]]
topics = ["app/uninstalled"]
uri = "/webhooks/app/uninstalled"
```

---

## Step 6: Connect to Python Backend

### 6.1 Create Environment Variables

In `maatchaa-shopify/.env`:

```bash
# Python backend URL
PYTHON_BACKEND_URL=http://localhost:8000
# Or production: https://api.maatchaa.com

# Shopify credentials (auto-managed by CLI)
SHOPIFY_API_KEY=auto-generated-by-cli
SHOPIFY_API_SECRET=auto-generated-by-cli
```

### 6.2 Create API Client for Python Backend

Create `maatchaa-shopify/app/lib/pythonBackend.ts`:

```typescript
/**
 * Client for communicating with Python backend
 */

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export class PythonBackendClient {
  private baseUrl: string;

  constructor(baseUrl: string = PYTHON_BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search for products using vector search
   */
  async searchProducts(query: string, topK: number = 10) {
    const response = await fetch(`${this.baseUrl}/search/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK }),
    });
    return response.json();
  }

  /**
   * Analyze a YouTube video
   */
  async analyzeVideo(videoUrl: string) {
    const response = await fetch(`${this.baseUrl}/create-showcase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl }),
    });
    return response.json();
  }

  /**
   * Get creator matches
   */
  async getCreatorMatches(productId: string) {
    const response = await fetch(
      `${this.baseUrl}/shopify/products/${productId}/matches`
    );
    return response.json();
  }

  /**
   * Sync Shopify products to vector database
   */
  async syncProducts(storeUrl: string, products: any[]) {
    const response = await fetch(`${this.baseUrl}/shopify/products/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_url: storeUrl, products }),
    });
    return response.json();
  }
}

export const pythonBackend = new PythonBackendClient();
```

---

## Step 7: Create App Routes

### 7.1 Main Dashboard Route

Create `maatchaa-shopify/app/routes/app._index.tsx`:

```typescript
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { pythonBackend } from "../lib/pythonBackend";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  // Get products from Shopify
  const response = await admin.graphql(`
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            description
          }
        }
      }
    }
  `);

  const { data } = await response.json();

  return json({ products: data.products.edges });
};

export default function Index() {
  const { products } = useLoaderData();

  return (
    <div>
      <h1>Maatchaa - Creator Matching Dashboard</h1>
      <p>Products: {products.length}</p>
      {/* Your UI here */}
    </div>
  );
}
```

### 7.2 Product Sync Route

Create `maatchaa-shopify/app/routes/app.sync.tsx`:

```typescript
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { pythonBackend } from "../lib/pythonBackend";

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  // Fetch all products from Shopify
  const response = await admin.graphql(`
    query {
      products(first: 250) {
        edges {
          node {
            id
            title
            description
            featuredImage {
              url
            }
            variants(first: 10) {
              edges {
                node {
                  price
                  availableForSale
                }
              }
            }
          }
        }
      }
    }
  `);

  const { data } = await response.json();

  // Send to Python backend for vector embedding
  const result = await pythonBackend.syncProducts(
    session.shop,
    data.products.edges.map(edge => edge.node)
  );

  return json({ success: true, result });
};
```

---

## Step 8: Backup Python OAuth Code

```bash
# Create backup folder
mkdir -p ~/Desktop/crackthenorth2025/backend/oauth_backup

# Move Python OAuth files to backup
cd ~/Desktop/crackthenorth2025/backend
mv utils/shopify_oauth.py oauth_backup/
mv utils/shopify_api.py oauth_backup/

# Keep them for reference, but Shopify CLI will handle OAuth now
```

---

## Step 9: Start Development

```bash
cd maatchaa-shopify

# Start Shopify CLI dev server
shopify app dev
```

**This will:**
1. ✅ Start a development tunnel (no need for ngrok!)
2. ✅ Create/update your app in Partner Dashboard automatically
3. ✅ Install app in your dev store
4. ✅ Handle OAuth flow automatically
5. ✅ Hot reload on code changes

**You'll see:**
```
🎉 Your app is running!

Preview URL: https://admin.shopify.com/store/YOUR-STORE/apps/maatchaa-dev
GraphQL endpoint: https://your-app.trycloudflare.com/api/graphql
```

---

## Step 10: Install in Dev Store

1. Visit the Preview URL shown in terminal
2. Click "Install app"
3. Grant permissions
4. Done! OAuth handled automatically ✅

---

## Step 11: Connect Python Backend

Make sure your Python backend is running:

```bash
# Terminal 2
cd ~/Desktop/crackthenorth2025/backend
uvicorn API:app --reload --port 8000
```

Now the Shopify CLI app can call Python endpoints:
- Product matching: `http://localhost:8000/search/text`
- Video analysis: `http://localhost:8000/create-showcase`
- Creator matches: `http://localhost:8000/shopify/products/{id}/matches`

---

## Step 12: Deploy to Production

### Deploy Shopify App:

```bash
cd maatchaa-shopify
shopify app deploy
```

This deploys to Shopify's infrastructure (or you can deploy to Vercel/Railway).

### Deploy Python Backend:

Keep your Python backend deployed separately (Google Cloud Run, Railway, etc.)

Update `.env` in Shopify app:
```bash
PYTHON_BACKEND_URL=https://api.maatchaa.com
```

---

## Architecture Summary

**Shopify CLI App (maatchaa-shopify/) handles:**
- ✅ OAuth flow (automatic)
- ✅ Embedded Shopify UI
- ✅ Fetching Shopify products/orders
- ✅ Creating discount codes
- ✅ App extensions
- ✅ Webhooks

**Python Backend (backend/) handles:**
- ✅ AI video analysis (Gemini Vision)
- ✅ Vector search (Pinecone + Cohere)
- ✅ YouTube API integration
- ✅ Product showcases (image generation)
- ✅ Creator matching algorithm

**Communication:**
```typescript
// In Shopify app
const matches = await pythonBackend.searchProducts(productDescription);
```

---

## Benefits of This Approach

1. ✅ **Automatic OAuth** - Shopify CLI handles everything
2. ✅ **Embedded UI** - App runs inside Shopify admin
3. ✅ **Keep Python AI** - Best tool for the job
4. ✅ **Easy deployment** - `shopify app deploy`
5. ✅ **TypeScript safety** - For Shopify integration
6. ✅ **Modular architecture** - Easy to maintain

---

## Folder Structure After Setup

```
crackthenorth2025/
├── backend/                          # Python backend
│   ├── API.py                        # Main API
│   ├── product_showcase.py           # AI showcase generation
│   ├── utils/
│   │   ├── video.py                  # Video analysis
│   │   ├── vectordb.py               # Pinecone client
│   │   ├── yt_search.py              # YouTube API
│   │   └── supabase.py               # Database
│   └── oauth_backup/                 # BACKUP: Manual OAuth
│       ├── shopify_oauth.py
│       └── shopify_api.py
│
├── maatchaa-shopify/                 # NEW: Shopify CLI app
│   ├── app/
│   │   ├── routes/
│   │   │   ├── app._index.tsx        # Dashboard
│   │   │   ├── app.sync.tsx          # Product sync
│   │   │   └── app.creators.tsx      # Creator matches
│   │   └── lib/
│   │       └── pythonBackend.ts      # Python API client
│   ├── extensions/                   # App extensions (optional)
│   ├── shopify.app.toml              # App config
│   └── package.json
│
└── frontend/                         # Existing Next.js (if separate)
```

---

## Quick Start Commands

```bash
# Start Python backend
cd backend && uvicorn API:app --reload

# Start Shopify app (in another terminal)
cd maatchaa-shopify && shopify app dev

# Deploy Shopify app
cd maatchaa-shopify && shopify app deploy
```

---

## Next Steps

1. ✅ Create Shopify app with CLI
2. ✅ Build embedded UI for creator matching
3. ✅ Connect to Python backend for AI features
4. ✅ Add app extensions (optional)
5. ✅ Deploy to production

---

**Resources:**
- [Shopify CLI Docs](https://shopify.dev/docs/apps/tools/cli)
- [Remix Docs](https://remix.run/docs)
- [App Extensions](https://shopify.dev/docs/apps/build/app-extensions)
