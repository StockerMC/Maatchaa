-- Add video statistics and relevance scoring columns

-- Add video stats to creator_videos table
ALTER TABLE creator_videos
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Add relevance scoring to product_creator_matches table
ALTER TABLE product_creator_matches
ADD COLUMN IF NOT EXISTS relevance_score DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS relevance_reasoning TEXT;

-- Create index for filtering by relevance
CREATE INDEX IF NOT EXISTS idx_matches_relevance
ON product_creator_matches(relevance_score DESC);

-- Create index for filtering by views
CREATE INDEX IF NOT EXISTS idx_videos_views
ON creator_videos(views DESC);
