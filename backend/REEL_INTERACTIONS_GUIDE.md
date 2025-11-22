# Reel Interactions System

This guide explains the reel interactions system that tracks user actions on creator reels (dismissals and partnerships).

## Overview

The system prevents users from seeing the same reel multiple times after they've dismissed it or created a partnership with it. All interactions are tracked at the **company level** (not per-user).

## Database Schema

### reel_interactions Table

```sql
CREATE TABLE reel_interactions (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    video_id TEXT NOT NULL,  -- YouTube video ID
    interaction_type TEXT NOT NULL,  -- 'dismissed' or 'partnered'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, video_id)  -- One interaction per company per video
);
```

**Indexes:**
- `idx_reel_interactions_company_id` - Fast lookups by company
- `idx_reel_interactions_video_id` - Fast lookups by video
- `idx_reel_interactions_type` - Fast filtering by interaction type
- `idx_reel_interactions_created_at` - Ordered by date

## API Endpoints

### POST /reels/interactions

Record a new reel interaction (dismiss or partner).

**Request Body:**
```json
{
  "company_id": "uuid",
  "video_id": "youtube_video_id",
  "interaction_type": "dismissed" | "partnered"
}
```

**Response:**
```json
{
  "message": "Interaction recorded successfully",
  "interaction": {
    "id": "uuid",
    "company_id": "uuid",
    "video_id": "youtube_video_id",
    "interaction_type": "dismissed",
    "created_at": "2025-11-21T..."
  }
}
```

### GET /reels/interactions

Get all interactions for a company.

**Query Parameters:**
- `company_id` (required) - The company UUID
- `interaction_type` (optional) - Filter by type: 'dismissed' or 'partnered'

**Response:**
```json
{
  "interactions": [...],
  "count": 42
}
```

## Frontend Implementation

### Main Reels Page (`/dashboard/reels/page.tsx`)

The reels page now:
1. Fetches all interactions for the company on load
2. Filters out videos that have been interacted with (dismissed or partnered)
3. Only shows fresh, unseen reels

**Key changes:**
```typescript
// Fetch interactions
const interactionsUrl = getApiUrl(`/reels/interactions?company_id=${user.companyId}`);
const interactionsData = await fetch(interactionsUrl).then(r => r.json());
const interactedVideoIds = new Set(
    interactionsData.interactions.map((i: any) => i.video_id)
);

// Filter out interacted videos
const filteredVideos = videos.filter((video: any) =>
    !interactedVideoIds.has(video.video_id)
);
```

### YouTubeReels Component

Updated to record interactions instead of deleting from database:

**Dismiss Handler:**
```typescript
const handleDelete = async (index: number, reelId: string) => {
    // Record dismissal interaction
    await fetch(`${apiUrl}/reels/interactions`, {
        method: "POST",
        body: JSON.stringify({
            company_id: currentReel.company_id,
            video_id: currentReel.short_id,
            interaction_type: "dismissed"
        })
    });

    // Remove from local list
    const newReelsList = reelsList.filter((_, i) => i !== index);
    setReelsList(newReelsList);
};
```

**Partnership Handler:**
```typescript
const handleInitiatePartnership = async (reel: ReelData, index: number) => {
    // Create partnership...

    // Record partnered interaction
    await fetch(`${apiUrl}/reels/interactions`, {
        method: "POST",
        body: JSON.stringify({
            company_id: reel.company_id,
            video_id: videoData.video_id,
            interaction_type: "partnered"
        })
    });

    // Remove from local list
    const newReelsList = reelsList.filter((_, i) => i !== index);
    setReelsList(newReelsList);
};
```

### Archive Page (`/dashboard/reels/archive/page.tsx`)

New page to view all archived (dismissed or partnered) reels:

**Features:**
- View all dismissed and partnered reels
- See interaction type (dismissed vs partnered)
- Unarchive dismissed reels to see them again in the feed
- View reels on YouTube directly
- Shows video thumbnails, titles, channel names, and view counts

**Unarchive functionality:**
```typescript
const handleUnarchive = async (videoId: string) => {
    await supabase
        .from("reel_interactions")
        .delete()
        .eq("company_id", user.companyId)
        .eq("video_id", videoId);

    // Reel will appear in feed again
};
```

**Access:** Click the "Archive" button in the top-left corner of the reels page.

## How It Works

1. **User sees reels** - Fresh reels that haven't been interacted with
2. **User dismisses reel (X button)** - Interaction recorded as "dismissed", reel removed from feed
3. **User partners with creator (✓ button)** - Partnership created + interaction recorded as "partnered", reel removed from feed
4. **Filtered on load** - Next time the page loads, these reels won't appear
5. **Archive** - View all past interactions and optionally unarchive dismissed reels

## Migration

To set up the database table, run:

```bash
# Apply migration
psql $DATABASE_URL < backend/data/reel_interactions_migration.sql
```

Or run the SQL directly in your Supabase SQL editor.

### Backfilling Historical Data

The reel_interactions table only tracks **new** interactions going forward. However, you can backfill existing partnerships:

```bash
# Backfill partnerships into reel_interactions
cd backend
python backfill_interactions.py
```

This script will:
- ✅ Fetch all existing partnerships
- ✅ Create corresponding "partnered" interactions
- ✅ Preserve original timestamps
- ✅ Skip duplicates (safe to run multiple times)
- ✅ Populate the archive with historical data

**Note:** Dismissed reels from before this system cannot be backfilled (they weren't tracked).

## Benefits

✅ **No duplicate reels** - Users won't see the same reel twice
✅ **Company-level tracking** - All users in a company share the same interaction history
✅ **Archive system** - Review past decisions and unarchive if needed
✅ **Clean data model** - Simple, efficient table with proper indexes
✅ **Automatic filtering** - Reels page automatically filters out interacted videos

## Future Enhancements

Potential improvements:
- Bulk archive/unarchive operations
- Export archive data
- Analytics on dismissed vs partnered ratios
- Time-based re-showing of dismissed reels (e.g., show again after 30 days)
- Search/filter in archive page
