-- Add logo_url to shopify_shops table
ALTER TABLE shopify_shops
ADD COLUMN IF NOT EXISTS logo_url TEXT;
