# How to Fix YouTube API Quota

Your YouTube API quota is exceeded. Here's how to fix it:

## Immediate Fix: Request Quota Increase

1. Go to Google Cloud Console:
   https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas?project=tidal-fusion-472020-j8

2. Click on "Quotas" tab

3. Find "Queries per day" 

4. Click "Edit Quotas" or "Request quota increase"

5. Fill out the form:
   - Explain you're building a creator discovery platform
   - Request: 100,000 units/day (or higher)
   - Approval usually takes 1-2 business days

## Current Status
- Default quota: 10,000 units/day
- Your usage: EXCEEDED
- Reset time: Midnight Pacific Time (daily)

## Temporary Workaround
Wait until midnight PT tonight for quota to reset, then you'll have 10,000 units again.

## For Production
You'll need increased quota for:
- Multiple searches per product
- Continuous background discovery
- Scaling to multiple companies
