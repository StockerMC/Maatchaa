-- Creator Matching Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Company products synced from Shopify
CREATE TABLE IF NOT EXISTS company_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    shop_domain TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    price DECIMAL,
    pinecone_id TEXT,  -- ID in Pinecone vector DB
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_products_company_id ON company_products(company_id);
CREATE INDEX IF NOT EXISTS idx_company_products_shop ON company_products(shop_domain);

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
    analysis JSONB,  -- Gemini analysis (aesthetic, tone, categories)
    pinecone_id TEXT,  -- ID in Pinecone vector DB
    indexed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_videos_channel_id ON creator_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_creator_videos_video_id ON creator_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_creator_videos_indexed_at ON creator_videos(indexed_at DESC);

-- Product-to-creator matches (discovered by worker or manual search)
CREATE TABLE IF NOT EXISTS product_creator_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES company_products(id) ON DELETE CASCADE,
    video_id TEXT REFERENCES creator_videos(video_id) ON DELETE CASCADE,
    source_keyword TEXT,  -- Which keyword found this match
    similarity_score DECIMAL,  -- Vector similarity score (0-1)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_product ON product_creator_matches(product_id);
CREATE INDEX IF NOT EXISTS idx_matches_video ON product_creator_matches(video_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON product_creator_matches(similarity_score DESC);

-- Track product sync status in OAuth tokens table
ALTER TABLE shopify_oauth_tokens ADD COLUMN IF NOT EXISTS products_synced BOOLEAN DEFAULT FALSE;
ALTER TABLE shopify_oauth_tokens ADD COLUMN IF NOT EXISTS last_product_sync TIMESTAMPTZ;
ALTER TABLE shopify_oauth_tokens ADD COLUMN IF NOT EXISTS product_count INTEGER DEFAULT 0;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Creator matching tables created successfully!';
    RAISE NOTICE 'Tables: company_products, creator_videos, product_creator_matches';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Update OAuth callback to sync products';
END $$;
