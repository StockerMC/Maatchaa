# Partnerships System - Setup Guide

## ✅ Implementation Complete!

All partnerships functionality has been implemented. Follow these steps to get it running:

---

## Step 1: Run Database Migration

**IMPORTANT:** You need to run the partnerships schema migration in your Supabase SQL Editor.

1. Go to your Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the contents of `/backend/data/partnerships_migration.sql`
4. Click "Run" to execute the migration

This will create the `partnerships` table with all necessary columns and indexes.

---

## Step 2: Test the API Endpoints

Start your backend server:

```bash
cd backend
python API.py
```

The following endpoints are now available:

### Partnerships CRUD
- `GET /partnerships?company_id={id}` - List all partnerships
- `GET /partnerships/{id}` - Get single partnership
- `POST /partnerships` - Create new partnership
- `PATCH /partnerships/{id}` - Update partnership

### Contact & Email
- `GET /partnerships/{id}/contact-info` - Get creator contact info (email + social links)
- `POST /partnerships/{id}/send-email` - Send outreach email

### Affiliate Links
- `POST /partnerships/{id}/generate-affiliate` - Generate tracking link + optional Shopify discount code

---

## Step 3: Start the Frontend

```bash
cd frontend
npm run dev
```

---

## How It Works

### 1. Discovery → Partnership Flow

1. **Reels Page** (`/dashboard/reels`)
   - Swipe right on a creator video to start a partnership
   - Calls `POST /partnerships` with all video and creator data
   - Automatically extracts contact info (email + social links)
   - Partnership is created with status: `to_contact`

2. **Partnerships Page** (`/dashboard/partnerships`)
   - View all partnerships in Kanban board by status
   - Drag-and-drop to update status
   - Click "Draft Email" to send outreach

### 2. Email Sending with Fallback

When you try to send an email:

1. **Primary**: Tries to use email from YouTube channel description
2. **Secondary**: If no email found, extracts social media links (Instagram, TikTok, Twitter)
3. **Tertiary**: Shows social links + allows manual email entry

The system will show a toast notification with available contact options if email isn't found.

### 3. Affiliate Link Generation

- Click "Generate Affiliate Link" on any partnership
- Creates tracking URL: `https://{shop_domain}/ref/{creator_handle}?pid={partnership_id}`
- Optionally creates Shopify discount code (configurable)
- Stores in database for future reference

---

## Email Configuration

Make sure these are set in your `.env`:

```env
EMAIL_SENDER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
```

**Note**: You need a Gmail App Password (not your regular password). Generate one at:
https://myaccount.google.com/apppasswords

---

## Features Implemented

### Backend
✅ Comprehensive partnerships database schema
✅ Full CRUD API endpoints
✅ Email sending with fallback logic
✅ Social media link extraction
✅ Affiliate link generation
✅ Optional Shopify discount code creation
✅ Contact info scraping from YouTube descriptions

### Frontend
✅ "Start Partnership" button on reels (swipe right)
✅ Partnerships kanban board
✅ Drag-and-drop status updates
✅ Email composition dialog
✅ Affiliate link generation dialog
✅ Real-time API integration
✅ Loading states and error handling
✅ Toast notifications for all actions

---

## Testing the Flow

1. **Go to Reels** (`/dashboard/reels`)
   - Find a creator video you like
   - Swipe right (or click the check button)
   - Partnership is created!

2. **Go to Partnerships** (`/dashboard/partnerships`)
   - You'll see the new partnership in "To Contact" column
   - Click on it to see details
   - Click "Draft Outreach Email"
   - Review/edit the email template
   - Click "Send Email"
   - If email found: Sends immediately
   - If no email: Shows social links for manual outreach

3. **Move to Next Stage**
   - Drag the card to "Contacted" column
   - Then to "In Discussion"
   - Generate affiliate link
   - Mark contract as signed
   - Drag to "Active"

4. **Track Performance**
   - Once active, performance metrics show (clicks, sales, revenue)
   - These can be updated via the API as tracking data comes in

---

## Customization Options

### Email Templates
Edit the default template in `/backend/utils/email.py`:
```python
def create_partnership_email_template(...)
```

### Affiliate Link Format
Modify in `/backend/partnerships_api.py`:
```python
affiliate_link = f"https://{shop_domain}/ref/{creator_handle}?pid={partnership_id}"
```

### Commission Rates
Default is 10%, but can be customized per partnership:
```json
{
  "commission_rate": 15
}
```

---

## Troubleshooting

### "Failed to load partnerships"
- Check that backend API is running
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env`
- Check browser console for errors

### "Failed to send email"
- Verify `EMAIL_SENDER` and `EMAIL_APP_PASSWORD` in backend `.env`
- Make sure you're using a Gmail App Password, not your regular password
- Check backend logs for SMTP errors

### "No email found"
- This is expected! Many creators don't list emails publicly
- Use the social links provided (Instagram, TikTok, Twitter)
- Or manually enter the email if you have it

### Migration errors
- Make sure you're running the SQL in Supabase SQL Editor, not in your terminal
- Check that all referenced tables exist (`companies`, `creator_videos`)
- If table exists, you can drop and recreate: `DROP TABLE partnerships CASCADE;`

---

## Next Steps

### Optional Enhancements

1. **Manual Email Entry**: Add an email input field in the email dialog for manual entry when scraped email isn't found

2. **Shopify Discount Codes**: Enable automatic discount code creation:
   ```json
   {
     "create_discount": true,
     "discount_amount": 10,
     "discount_type": "percentage"
   }
   ```

3. **Performance Tracking**: Build a webhook to track affiliate link clicks and update partnership stats

4. **Contract Generation**: Add PDF generation for the LaTeX contracts

---

## API Reference

See `/backend/partnerships_api.py` for full API documentation including:
- Request/response formats
- Required fields
- Error codes
- Example payloads

---

**Questions?** Check the implementation files:
- Backend: `/backend/API.py` (lines 1165+)
- Email Utils: `/backend/utils/email.py`
- Frontend Reels: `/frontend/src/components/YoutubeReels.tsx`
- Frontend Partnerships: `/frontend/src/app/dashboard/partnerships/page.tsx`
