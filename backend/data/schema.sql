CREATE TABLE youtube_shorts (
    id UUID PRIMARY KEY,
    youtube_id TEXT NOT NULL,
    title TEXT,
    showcase_images TEXT,
    products JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    main_image_url TEXT
);

-- FIXME: ACTUALLY UPDATE OUR DB TO CONTAIN THIS FOR SHOPIFY PRODUCTS (WILL DO LATER)
CREATE TABLE shopify_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopify_id BIGINT UNIQUE NOT NULL,
    store_url TEXT NOT NULL,
    title TEXT NOT NULL,
    handle TEXT NOT NULL,
    body_html TEXT,
    vendor TEXT,
    product_type TEXT,
    tags TEXT[],
    variants JSONB NOT NULL,
    images JSONB NOT NULL,
    options JSONB,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    match_count INTEGER DEFAULT 0,
    last_matched_at TIMESTAMPTZ,
    UNIQUE(shopify_id, store_url)
);

-- Product matches table to track which videos matched which products
CREATE TABLE product_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES shopify_products(id) ON DELETE CASCADE,
    short_id UUID REFERENCES youtube_shorts(id) ON DELETE CASCADE,
    match_score FLOAT,
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, short_id)
);

-- Index for faster queries
CREATE INDEX idx_shopify_products_store_url ON shopify_products(store_url);
CREATE INDEX idx_shopify_products_vendor ON shopify_products(vendor);
CREATE INDEX idx_shopify_products_product_type ON shopify_products(product_type);
CREATE INDEX idx_product_matches_product_id ON product_matches(product_id);
CREATE INDEX idx_product_matches_short_id ON product_matches(short_id);

-- END OF NEW STUFF

-- Shopify OAuth tokens table
CREATE TABLE shopify_oauth_tokens (
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
CREATE TABLE shopify_shops (
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
CREATE TABLE shopify_oauth_states (
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
CREATE INDEX idx_shopify_oauth_tokens_company_id ON shopify_oauth_tokens(company_id);
CREATE INDEX idx_shopify_oauth_tokens_shop_domain ON shopify_oauth_tokens(shop_domain);
CREATE INDEX idx_shopify_oauth_tokens_is_active ON shopify_oauth_tokens(is_active);
CREATE INDEX idx_shopify_shops_company_id ON shopify_shops(company_id);
CREATE INDEX idx_shopify_shops_shop_domain ON shopify_shops(shop_domain);
CREATE INDEX idx_shopify_oauth_states_state ON shopify_oauth_states(state);
CREATE INDEX idx_shopify_oauth_states_expires_at ON shopify_oauth_states(expires_at);

-- Function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM shopify_oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Link shopify_products to shopify_shops
ALTER TABLE shopify_products ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES shopify_shops(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_shopify_products_shop_id ON shopify_products(shop_id);

CREATE TABLE partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES auth.users(id),
    company_id UUID REFERENCES companies(id),
    short_id UUID REFERENCES youtube_shorts(id),
    status TEXT DEFAULT 'pending', -- e.g., pending, confirmed, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(creator_id, company_id, short_id)
);
