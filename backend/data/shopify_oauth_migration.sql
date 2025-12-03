-- Shopify OAuth Migration Script
-- Run this in Supabase SQL Editor

-- First, ensure companies table exists (create if needed)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    store_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shopify OAuth tokens table
CREATE TABLE IF NOT EXISTS shopify_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    shop_domain TEXT NOT NULL,
    access_token TEXT NOT NULL,
    scope TEXT NOT NULL,
    token_type TEXT DEFAULT 'offline',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Add unique constraint separately (in case table already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'shopify_oauth_tokens_shop_domain_key'
    ) THEN
        ALTER TABLE shopify_oauth_tokens ADD CONSTRAINT shopify_oauth_tokens_shop_domain_key UNIQUE (shop_domain);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'shopify_oauth_tokens_company_id_shop_domain_key'
    ) THEN
        ALTER TABLE shopify_oauth_tokens ADD CONSTRAINT shopify_oauth_tokens_company_id_shop_domain_key UNIQUE (company_id, shop_domain);
    END IF;
END $$;

-- Shopify shop information table
CREATE TABLE IF NOT EXISTS shopify_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    shop_domain TEXT NOT NULL,
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
    last_synced_at TIMESTAMPTZ
);

-- Add unique constraints for shopify_shops
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'shopify_shops_shop_domain_key'
    ) THEN
        ALTER TABLE shopify_shops ADD CONSTRAINT shopify_shops_shop_domain_key UNIQUE (shop_domain);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'shopify_shops_company_id_shop_domain_key'
    ) THEN
        ALTER TABLE shopify_shops ADD CONSTRAINT shopify_shops_company_id_shop_domain_key UNIQUE (company_id, shop_domain);
    END IF;
END $$;

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

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_company_id ON shopify_oauth_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_shop_domain ON shopify_oauth_tokens(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_is_active ON shopify_oauth_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_shopify_shops_company_id ON shopify_shops(company_id);
CREATE INDEX IF NOT EXISTS idx_shopify_shops_shop_domain ON shopify_shops(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_state ON shopify_oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_expires_at ON shopify_oauth_states(expires_at);

-- Function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM shopify_oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a test company for testing (optional - comment out if you already have companies)
INSERT INTO companies (company_name, store_url)
VALUES ('Test Company', 'test-store.myshopify.com')
ON CONFLICT DO NOTHING;

-- Display success message and test company ID
DO $$
DECLARE
    test_company_id UUID;
BEGIN
    SELECT id INTO test_company_id FROM companies LIMIT 1;
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Test company ID: %', test_company_id;
    RAISE NOTICE 'Use this company_id in your OAuth test URL';
END $$;
