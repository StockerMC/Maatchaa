#!/usr/bin/env python3
"""
Creator Discovery Background Worker

Continuously discovers creators relevant to products in database.
Runs 24/7, discovering new creator content and linking to products.
"""

import asyncio
import json
import os
from dotenv import load_dotenv
from utils.yt_search import fetch_top_shorts
from utils.video import parse_video
from utils.vectordb import text_to_embedding, upsert_embeddings
from utils.supabase import SupabaseClient

# Load environment variables
load_dotenv()

# Worker configuration from environment
CYCLE_INTERVAL_MINUTES = int(os.getenv("WORKER_CYCLE_INTERVAL_MINUTES", "5"))
PRODUCTS_PER_CYCLE = int(os.getenv("WORKER_PRODUCTS_PER_CYCLE", "10"))
KEYWORDS_PER_PRODUCT = int(os.getenv("WORKER_KEYWORDS_PER_PRODUCT", "2"))
VIDEOS_PER_KEYWORD = int(os.getenv("WORKER_VIDEOS_PER_KEYWORD", "5"))


async def creator_discovery_worker():
    """
    Main worker loop - discovers creators based on products in database

    Flow:
    1. Get all products that need creator matching
    2. Generate search keywords for each product
    3. Search YouTube for relevant shorts
    4. Analyze videos with Gemini
    5. Create embeddings and store
    6. Link creators to products
    7. Sleep and repeat
    """

    supabase = SupabaseClient()
    await supabase.initialize()
    cycle_count = 0

    print("=" * 60)
    print("🚀 CREATOR DISCOVERY WORKER STARTED")
    print("=" * 60)
    print(f"⚙️  Configuration:")
    print(f"   • Cycle Interval: {CYCLE_INTERVAL_MINUTES} minutes")
    print(f"   • Products per Cycle: {PRODUCTS_PER_CYCLE}")
    print(f"   • Keywords per Product: {KEYWORDS_PER_PRODUCT}")
    print(f"   • Videos per Keyword: {VIDEOS_PER_KEYWORD}")
    print("=" * 60)

    while True:
        cycle_count += 1
        print(f"\n{'='*60}")
        print(f"🔄 CYCLE #{cycle_count} - {asyncio.get_event_loop().time()}")
        print(f"{'='*60}\n")

        try:
            # 1. Get all products that need creator matching
            products_result = await supabase.client.table("company_products")\
                .select("id, title, description, shop_domain")\
                .execute()

            if not products_result.data:
                print("⚠️  No products found in database")
                print("💡 Waiting for companies to connect Shopify stores...")
                await asyncio.sleep(30 * 60)  # 30 minutes
                continue

            print(f"📊 Found {len(products_result.data)} products to process\n")

            # Process limited products per cycle to avoid overwhelming APIs
            products_to_process = products_result.data[:PRODUCTS_PER_CYCLE]

            for product in products_to_process:
                print(f"🎯 Processing: {product['title']}")

                # 2. Generate search keywords (simple version - can enhance with AI)
                keywords = generate_keywords_for_product(product)
                print(f"   🔑 Keywords: {', '.join(keywords[:3])}...")

                # 3. Search YouTube for each keyword
                for keyword in keywords[:KEYWORDS_PER_PRODUCT]:
                    try:
                        print(f"   🔎 Searching YouTube: '{keyword}'")

                        videos = await fetch_top_shorts(
                            keyword=keyword,
                            max_results=VIDEOS_PER_KEYWORD,
                            published_after_days=30  # Only recent content
                        )

                        if not videos:
                            print(f"      ❌ No videos found")
                            continue

                        print(f"      ✅ Found {len(videos)} videos")

                        # 4. Process each video
                        for video in videos:
                            await process_creator_video(
                                video=video,
                                product=product,
                                source_keyword=keyword,
                                supabase=supabase
                            )
                            # Rate limit: 4s per video = 15 videos/min (Gemini free tier limit)
                            await asyncio.sleep(4)

                        # Rate limiting between keywords
                        await asyncio.sleep(2)

                    except Exception as keyword_error:
                        print(f"      ❌ Error processing keyword '{keyword}': {keyword_error}")
                        continue

                # Small delay between products
                await asyncio.sleep(1)

            print(f"\n✅ Cycle #{cycle_count} complete")
            print(f"💤 Sleeping for {CYCLE_INTERVAL_MINUTES} minutes...")

            # Sleep for configured interval
            await asyncio.sleep(CYCLE_INTERVAL_MINUTES * 60)

        except Exception as e:
            print(f"\n❌ WORKER ERROR: {e}")
            import traceback
            traceback.print_exc()
            print(f"⏳ Sleeping 30 minutes before retry...")
            await asyncio.sleep(30 * 60)


async def trigger_immediate_discovery(company_id: str, shop_domain: str | None = None):
    """
    Trigger immediate creator discovery for a specific company.
    Called right after OAuth to start discovery without waiting for scheduled cycle.

    Args:
        company_id: UUID of the company
        shop_domain: Optional shop domain to filter products
    """
    print(f"\n🚀 IMMEDIATE DISCOVERY TRIGGERED for company: {company_id}")

    supabase = SupabaseClient()
    await supabase.initialize()

    try:
        # Get products for this company
        query = supabase.client.table("company_products")\
            .select("id, title, description, shop_domain")\
            .eq("company_id", company_id)

        if shop_domain:
            query = query.eq("shop_domain", shop_domain)

        products_result = await query.execute()

        if not products_result.data:
            print(f"⚠️  No products found for company {company_id}")
            return

        print(f"📊 Found {len(products_result.data)} products for immediate discovery\n")

        # Process all products (or limit to avoid timeout)
        products_to_process = products_result.data[:PRODUCTS_PER_CYCLE]

        for product in products_to_process:
            print(f"🎯 Processing: {product['title']}")

            keywords = generate_keywords_for_product(product)
            print(f"   🔑 Keywords: {', '.join(keywords[:3])}...")

            for keyword in keywords[:KEYWORDS_PER_PRODUCT]:
                try:
                    print(f"   🔎 Searching YouTube: '{keyword}'")

                    videos = await fetch_top_shorts(
                        keyword=keyword,
                        max_results=VIDEOS_PER_KEYWORD,
                        published_after_days=30
                    )

                    if not videos:
                        print(f"      ❌ No videos found")
                        continue

                    print(f"      ✅ Found {len(videos)} videos")

                    for video in videos:
                        await process_creator_video(
                            video=video,
                            product=product,
                            source_keyword=keyword,
                            supabase=supabase
                        )

                    await asyncio.sleep(2)  # Rate limiting

                except Exception as keyword_error:
                    print(f"      ❌ Error: {keyword_error}")
                    continue

            await asyncio.sleep(1)

        print(f"\n✅ Immediate discovery complete for {len(products_to_process)} products")

    except Exception as e:
        print(f"\n❌ Immediate discovery error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await supabase.close()


def generate_keywords_for_product(product: dict) -> list[str]:
    """
    Generate YouTube search keywords for a product

    Simple version: Uses product title + common search terms
    TODO: Enhance with AI (Gemini) for smarter keyword generation
    """
    title = product["title"]

    # Common search patterns for creator content
    patterns = [
        f"{title} review",
        f"{title} unboxing",
        f"{title} haul",
        f"{title} try on",
        f"{title} test",
        f"{title} first impressions"
    ]

    return patterns


async def process_creator_video(video: dict, product: dict, source_keyword: str, supabase):
    """
    Process a single creator video: analyze, embed, store, link to product
    """

    video_id = video["id"]

    try:
        # Check if already indexed
        existing = await supabase.client.table("creator_videos")\
            .select("id")\
            .eq("video_id", video_id)\
            .execute()

        if existing.data:
            # Video already indexed, recalculate relevance and link if not already linked
            link_exists = await supabase.client.table("product_creator_matches")\
                .select("id")\
                .eq("product_id", product["id"])\
                .eq("video_id", video_id)\
                .execute()

            if not link_exists.data:
                # Calculate relevance for existing video
                from utils.relevance import calculate_relevance_score
                existing_video = existing.data[0]
                analysis_data = existing_video.get("analysis", {})

                score, reasoning = calculate_relevance_score(
                    product=product,
                    video=video,
                    analysis=analysis_data,
                    source_keyword=source_keyword
                )

                # Only link if relevance is high enough
                if score >= 5.0:
                    await supabase.client.table("product_creator_matches").insert({
                        "product_id": product["id"],
                        "video_id": video_id,
                        "source_keyword": source_keyword,
                        "relevance_score": score,
                        "relevance_reasoning": reasoning,
                        "created_at": "now()"
                    }).execute()
                    print(f"         🔗 Linked existing video (score: {score:.1f})")
                else:
                    print(f"         ⏭️  Skipped (low relevance: {score:.1f})")

            return

        # 1. Analyze video with Gemini
        print(f"         🎥 Analyzing: {video['title'][:50]}...")

        analysis_result = await parse_video(video["url"])

        if isinstance(analysis_result, tuple):
            analysis, status = analysis_result
            if status == 429:
                # Rate limited - skip this video for now
                print(f"         ⏸️  Rate limited, skipping for now")
                return
            elif status != 200:
                print(f"         ❌ Analysis failed: {analysis}")
                return
        else:
            analysis = analysis_result

        # Parse analysis JSON
        try:
            output = analysis.get("output") if isinstance(analysis, dict) else "{}"
            analysis_data = json.loads(output if output else "{}")
        except (json.JSONDecodeError, TypeError):
            print(f"         ⚠️  Could not parse analysis JSON")
            analysis_data = {}

        # 1.5 Calculate relevance score
        from utils.relevance import calculate_relevance_score, is_video_relevant

        score, reasoning = calculate_relevance_score(
            product=product,
            video=video,
            analysis=analysis_data,
            source_keyword=source_keyword
        )

        is_relevant, relevance_reason = is_video_relevant(
            score=score,
            views=video.get("views", 0),
            min_score=5.0,  # Only keep videos with relevance >= 5/10
            min_views=5000   # Only keep videos with >= 5k views
        )

        if not is_relevant:
            print(f"         ⏭️  Skipped: {relevance_reason}")
            return

        print(f"         ✨ Relevant! {relevance_reason}")

        # 2. Create embedding
        embedding_text = f"{video['title']} {video['description']} {analysis_data.get('aesthetic', '')} {analysis_data.get('tone_vibe', '')}"
        embedding_response = text_to_embedding(embedding_text)
        embedding_vector = embedding_response.embeddings.float_[0]

        # 3. Store in Pinecone
        video_pinecone_id = f"video_{video_id}"

        # Prepare metadata - ensure all values are JSON-serializable
        categories = analysis_data.get("potential_categories", [])
        if isinstance(categories, list):
            categories_str = ", ".join(str(c) for c in categories[:5])  # Limit to 5
        else:
            categories_str = str(categories) if categories else ""

        upsert_embeddings([{
            "id": video_pinecone_id,
            "values": embedding_vector,
            "metadata": {
                "video_id": video_id,
                "title": video["title"][:200],  # Truncate for metadata limits
                "channel": video["channelTitle"][:100],
                "channel_id": video["channel_id"],
                "categories": categories_str[:200]
            }
        }])

        # 4. Store in Supabase with stats
        await supabase.client.table("creator_videos").insert({
            "video_id": video_id,
            "url": video["url"],
            "title": video["title"],
            "description": video["description"],
            "thumbnail": video["thumbnail"],
            "channel_title": video["channelTitle"],
            "channel_id": video["channel_id"],
            "email": video.get("email"),
            "published_at": video.get("publishedAt"),
            "views": video.get("views", 0),
            "likes": video.get("likes", 0),
            "analysis": analysis_data,
            "pinecone_id": video_pinecone_id,
            "indexed_at": "now()"
        }).execute()

        # 5. Link to product with relevance score
        await supabase.client.table("product_creator_matches").insert({
            "product_id": product["id"],
            "video_id": video_id,
            "source_keyword": source_keyword,
            "relevance_score": score,
            "relevance_reasoning": reasoning,
            "created_at": "now()"
        }).execute()

        print(f"         ✅ Indexed: {video['title'][:40]}... (score: {score:.1f}, views: {video.get('views', 0):,})")

    except Exception as e:
        print(f"         ❌ Error processing video {video_id}: {str(e)[:100]}")
        import traceback
        traceback.print_exc()


async def main():
    """Main entry point with proper cleanup"""
    try:
        await creator_discovery_worker()
    except KeyboardInterrupt:
        print("\n\n⏹️  Worker stopped by user")
    except Exception as e:
        print(f"\n\n💥 Fatal error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("  MAATCHAA CREATOR DISCOVERY WORKER")
    print("  Intelligent Product-to-Creator Matching")
    print("="*60 + "\n")

    asyncio.run(main())
