# Database Setup for Creator Matching

## Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `data/creator_tables.sql`
6. Click **Run** or press `Cmd/Ctrl + Enter`

You should see success messages confirming:
- ✅ `company_products` table created
- ✅ `creator_videos` table created
- ✅ `product_creator_matches` table created
- ✅ Indexes created
- ✅ `shopify_oauth_tokens` columns added

## Step 2: Verify Tables

Run this query to verify the tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('company_products', 'creator_videos', 'product_creator_matches')
ORDER BY table_name;
```

You should see all 3 tables listed.

## Step 3: Start the Background Worker

Once the database is set up, you can start the worker:

```bash
cd backend
./start_worker.sh
```

The worker will:
- ✅ Connect to Supabase
- ✅ Fetch all products from `company_products` table
- ✅ Generate search keywords for each product
- ✅ Search YouTube for creator videos
- ✅ Analyze videos with Gemini
- ✅ Store matches in the database
- ✅ Run every 6 hours continuously

## Troubleshooting

If you get "No products found":
- This is normal if you haven't connected a Shopify store yet
- The worker will sleep for 30 minutes and retry
- Products are automatically synced when you connect Shopify via OAuth

If you get database errors:
- Verify the SQL migration ran successfully
- Check your `.env` file has correct `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
