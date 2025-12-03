-- Simplified Shopify OAuth Migration
-- Creates tables WITHOUT foreign key constraints to companies table
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if you want to start fresh (CAREFUL - this deletes data!)
-- Uncomment these if you need to reset:
-- DROP TABLE IF EXISTS shopify_oauth_states CASCADE;
-- DROP TABLE IF EXISTS shopify_oauth_tokens CASCADE;
-- DROP TABLE IF EXISTS shopify_shops CASCADE;

-- Shopify OAuth tokens table (NO foreign key to companies)
CREATE TABLE IF NOT EXISTS shopify_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,  -- Just a UUID field, no foreign key constraint
    shop_domain TEXT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    scope TEXT NOT NULL,
    token_type TEXT DEFAULT 'offline',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create index on company_id for performance
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_company_id ON shopify_oauth_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_shop_domain ON shopify_oauth_tokens(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_tokens_is_active ON shopify_oauth_tokens(is_active);

-- Shopify shop information table (NO foreign key to companies)
CREATE TABLE IF NOT EXISTS shopify_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID,  -- Just a UUID field, no foreign key constraint
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
    last_synced_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shopify_shops_company_id ON shopify_shops(company_id);
CREATE INDEX IF NOT EXISTS idx_shopify_shops_shop_domain ON shopify_shops(shop_domain);

-- OAuth state management (NO foreign key to companies)
CREATE TABLE IF NOT EXISTS shopify_oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state TEXT NOT NULL UNIQUE,
    company_id UUID,  -- Just a UUID field, no foreign key constraint
    shop_domain TEXT NOT NULL,
    redirect_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes',
    used BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_state ON shopify_oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_expires_at ON shopify_oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_company_id ON shopify_oauth_states(company_id);

-- Function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM shopify_oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Shopify OAuth tables created successfully!';
    RAISE NOTICE 'Tables created: shopify_oauth_tokens, shopify_shops, shopify_oauth_states';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Generate a test company_id:';
    RAISE NOTICE 'Run: SELECT uuid_generate_v4();';
    RAISE NOTICE 'Or use any UUID for testing';
END $$;
