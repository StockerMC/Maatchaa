-- Create waitlist table
-- This stores email addresses of users who want to join the platform

CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT waitlist_email_unique UNIQUE (email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Add comments
COMMENT ON TABLE waitlist IS 'Stores email addresses of users interested in joining the platform';
COMMENT ON COLUMN waitlist.email IS 'Email address of the waitlist user';
COMMENT ON COLUMN waitlist.name IS 'Optional name of the waitlist user';
COMMENT ON COLUMN waitlist.created_at IS 'Timestamp when the user joined the waitlist';
