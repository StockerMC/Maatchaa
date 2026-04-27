-- ============================================================================
-- Notifications Table & Supabase Realtime Setup
-- ============================================================================
-- This migration creates the notifications table and enables real-time
-- subscriptions for live updates in the dashboard.
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('creator_match', 'partnership_update', 'product_sync')),
    title TEXT NOT NULL,
    message TEXT,
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(company_id, read);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their company's notifications
CREATE POLICY "Users can view own company notifications" ON notifications
    FOR SELECT
    USING (company_id IN (
        SELECT id FROM companies WHERE id = company_id
    ));

-- RLS Policy: Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (company_id IN (
        SELECT id FROM companies WHERE id = company_id
    ));

-- ============================================================================
-- Enable Supabase Realtime
-- ============================================================================

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable realtime for partnerships table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE partnerships;

-- ============================================================================
-- Trigger: Auto-create notifications on partnership events
-- ============================================================================

-- Function to create notification on partnership changes
CREATE OR REPLACE FUNCTION notify_partnership_change()
RETURNS TRIGGER AS $$
DECLARE
    notification_type TEXT;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Determine notification type and content based on event
    IF TG_OP = 'INSERT' THEN
        notification_type := 'creator_match';
        notification_title := 'New Creator Match';
        notification_message := NEW.creator_name || ' matched with your products';
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only notify on significant status changes
        IF NEW.status != OLD.status THEN
            notification_type := 'partnership_update';

            CASE NEW.status
                WHEN 'contacted' THEN
                    notification_title := 'Partnership Contacted';
                    notification_message := 'You contacted ' || NEW.creator_name;
                WHEN 'in_discussion' THEN
                    notification_title := 'Partnership In Discussion';
                    notification_message := NEW.creator_name || ' is now in discussion';
                WHEN 'active' THEN
                    notification_title := 'Partnership Activated';
                    notification_message := 'Partnership with ' || NEW.creator_name || ' is now active!';
                WHEN 'closed' THEN
                    notification_title := 'Partnership Closed';
                    notification_message := 'Partnership with ' || NEW.creator_name || ' was closed';
                ELSE
                    -- Don't create notification for other status changes
                    RETURN NEW;
            END CASE;
        ELSE
            -- No status change, don't create notification
            RETURN NEW;
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    -- Insert the notification
    INSERT INTO notifications (
        company_id,
        type,
        title,
        message,
        metadata
    ) VALUES (
        NEW.company_id,
        notification_type,
        notification_title,
        notification_message,
        jsonb_build_object(
            'partnership_id', NEW.id,
            'creator_name', NEW.creator_name,
            'status', NEW.status,
            'video_url', NEW.video_url
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists to allow re-running)
DROP TRIGGER IF EXISTS partnership_notification_trigger ON partnerships;

CREATE TRIGGER partnership_notification_trigger
AFTER INSERT OR UPDATE ON partnerships
FOR EACH ROW EXECUTE FUNCTION notify_partnership_change();

-- ============================================================================
-- Trigger: Auto-create notifications on product sync
-- ============================================================================

-- Function to create notification when products are synced
CREATE OR REPLACE FUNCTION notify_product_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify when products_synced changes to true
    IF NEW.products_synced = TRUE AND (OLD.products_synced IS NULL OR OLD.products_synced = FALSE) THEN
        INSERT INTO notifications (
            company_id,
            type,
            title,
            message,
            metadata
        ) VALUES (
            NEW.company_id,
            'product_sync',
            'Products Synced',
            NEW.product_count || ' products synced from Shopify',
            jsonb_build_object(
                'shop_domain', NEW.shop_domain,
                'product_count', NEW.product_count,
                'synced_at', NEW.last_product_sync
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product sync notifications
DROP TRIGGER IF EXISTS product_sync_notification_trigger ON shopify_oauth_tokens;

CREATE TRIGGER product_sync_notification_trigger
AFTER UPDATE ON shopify_oauth_tokens
FOR EACH ROW EXECUTE FUNCTION notify_product_sync();

-- ============================================================================
-- Cleanup old notifications (optional cron job)
-- ============================================================================

-- Function to clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND read = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Note: To schedule this, use pg_cron extension or an external scheduler
-- Example with pg_cron (if enabled):
-- SELECT cron.schedule('cleanup-notifications', '0 3 * * *', 'SELECT cleanup_old_notifications()');

-- ============================================================================
-- Sample notification for testing
-- ============================================================================

-- Uncomment to test (replace with real company_id):
-- INSERT INTO notifications (company_id, type, title, message)
-- VALUES ('your-company-uuid', 'creator_match', 'Test Notification', 'This is a test notification');
