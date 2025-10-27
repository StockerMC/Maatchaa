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
