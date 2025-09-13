CREATE TABLE youtube_shorts (
    id UUID PRIMARY KEY,
    youtube_id TEXT NOT NULL,
    title TEXT,
    showcase_images TEXT,
    products JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    main_image_url TEXT
);
