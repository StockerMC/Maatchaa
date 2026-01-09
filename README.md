# Maatchaa

AI-powered sponsorship matching for YouTube Shorts. Connects Shopify businesses with creators automatically.

🏆 **Hack the North 2025 Finalist**

## What it does

- Matches products to videos using AI embeddings
- Businesses swipe through creator content (Tinder-style)
- Auto-generates product sets based on video aesthetics
- Updates video descriptions with sponsor links automatically

## Stack

**Backend:** Python, Shopify API, YouTube API, Pinecone, Supabase  
**Frontend:** Next.js  
**AI:** Cohere embeddings, Gemini video analysis, Nano Banana

## How it works

1. Analyze YouTube Shorts (transcription + visuals)
2. Query vector DB for matching products
3. Business accepts/rejects matches
4. Creator confirms → links added to video

## Running locally

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py
```
```bash
# Frontend
cd frontend
npm install
npm run dev
```

Add your API keys to `.env` (Shopify, YouTube, Pinecone, Cohere, Gemini).

---

Built at Hack the North 2025
