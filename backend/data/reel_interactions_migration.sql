-- Reel Interactions Table Migration
-- Tracks user interactions with creator reels (dismissals, etc.)

CREATE TABLE IF NOT EXISTS reel_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relations
    company_id UUID NOT NULL,
    video_id TEXT NOT NULL,  -- YouTube video ID from creator_videos

    -- Interaction type
    interaction_type TEXT NOT NULL, -- 'dismissed', 'partnered'

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one interaction per company per video
    UNIQUE(company_id, video_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_reel_interactions_company_id ON reel_interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_reel_interactions_video_id ON reel_interactions(video_id);
CREATE INDEX IF NOT EXISTS idx_reel_interactions_type ON reel_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_reel_interactions_created_at ON reel_interactions(created_at DESC);

-- Grant permissions
GRANT ALL ON reel_interactions TO authenticated;
GRANT ALL ON reel_interactions TO service_role;
GRANT ALL ON reel_interactions TO anon;

-- Add helpful comments
COMMENT ON TABLE reel_interactions IS 'Tracks company interactions with creator reels (dismissals, partnerships)';
COMMENT ON COLUMN reel_interactions.interaction_type IS 'Type of interaction: dismissed, partnered';
COMMENT ON COLUMN reel_interactions.video_id IS 'YouTube video ID from creator_videos table';
