-- Comprehensive Partnerships Schema Migration
-- This updates the partnerships table to support full workflow from discovery to tracking

-- Drop existing table if needed for clean migration
-- DROP TABLE IF EXISTS partnerships CASCADE;

-- Recreate partnerships table with all necessary fields
CREATE TABLE IF NOT EXISTS partnerships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relations (no foreign key constraints to avoid dependency issues)
    company_id UUID NOT NULL,
    video_id TEXT,  -- YouTube video ID, not FK to creator_videos

    -- Creator Information
    creator_name TEXT,
    creator_handle TEXT,
    creator_email TEXT,
    creator_avatar TEXT,
    creator_channel_url TEXT,

    -- Video Details
    video_title TEXT,
    video_url TEXT,
    video_thumbnail TEXT,
    matched_products JSONB DEFAULT '[]'::jsonb, -- Array of product objects {id, name, price, image}

    -- Engagement Metrics (from YouTube)
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,

    -- Partnership Status & Timeline
    status TEXT DEFAULT 'to_contact', -- to_contact, contacted, in_discussion, active, closed
    contacted_at TIMESTAMPTZ,
    discussion_started_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,

    -- Communication
    email_sent BOOLEAN DEFAULT FALSE,
    email_draft TEXT,
    last_contact_date TIMESTAMPTZ,
    notes TEXT,

    -- Contract Management
    contract_drafted BOOLEAN DEFAULT FALSE,
    contract_sent BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    contract_url TEXT,
    contract_data JSONB, -- Store LaTeX or PDF info

    -- Affiliate & Compensation
    affiliate_link TEXT,
    affiliate_link_generated BOOLEAN DEFAULT FALSE,
    discount_code TEXT,
    commission_rate DECIMAL(5,2), -- e.g., 15.00 for 15%
    payment_terms TEXT,

    -- Performance Tracking
    clicks INTEGER DEFAULT 0,
    sales INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0.00,
    performance_data JSONB DEFAULT '{}'::jsonb, -- Detailed analytics

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_partnerships_company_id ON partnerships(company_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_status ON partnerships(status);
CREATE INDEX IF NOT EXISTS idx_partnerships_creator_email ON partnerships(creator_email) WHERE creator_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partnerships_created_at ON partnerships(created_at DESC);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partnerships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partnerships_updated_at_trigger ON partnerships;
CREATE TRIGGER partnerships_updated_at_trigger
    BEFORE UPDATE ON partnerships
    FOR EACH ROW
    EXECUTE FUNCTION update_partnerships_updated_at();

-- Grant permissions (RLS disabled for now to avoid auth issues)
GRANT ALL ON partnerships TO authenticated;
GRANT ALL ON partnerships TO service_role;
GRANT ALL ON partnerships TO anon;

-- Add helpful comments
COMMENT ON TABLE partnerships IS 'Tracks creator partnerships from discovery through active collaboration';
COMMENT ON COLUMN partnerships.status IS 'Workflow status: to_contact, contacted, in_discussion, active, closed';
COMMENT ON COLUMN partnerships.matched_products IS 'JSON array of product objects the creator was matched with';
COMMENT ON COLUMN partnerships.performance_data IS 'JSON object with detailed analytics (daily clicks, conversion rates, etc)';
