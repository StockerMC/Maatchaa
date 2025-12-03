#!/usr/bin/env python3
"""
Backfill search keywords for existing products in database.
Generates smart YouTube search keywords for all products that don't have them yet.
"""

import asyncio
from utils.supabase import SupabaseClient
from utils.keyword_generator import generate_keywords_for_product


async def backfill_keywords(use_ai: bool = True):
    """
    Generate keywords for all existing products

    Args:
        use_ai: Whether to use AI for keyword generation (default: True)
    """
    supabase = SupabaseClient()
    await supabase.initialize()

    try:
        print("=" * 60)
        print("🔑 KEYWORD GENERATION FOR EXISTING PRODUCTS")
        print("=" * 60)
        print(f"AI Mode: {'Enabled ✅' if use_ai else 'Disabled (Simple extraction)'}\n")

        # Fetch all products
        print("📊 Fetching products from database...")
        result = await supabase.client.table("company_products")\
            .select("id, title, description, search_keywords")\
            .execute()

        products = result.data or []
        print(f"   Found {len(products)} products\n")

        if not products:
            print("✅ No products to process")
            return

        # Filter products that need keywords
        needs_keywords = []
        has_keywords = 0

        for product in products:
            keywords = product.get('search_keywords', [])
            if not keywords or len(keywords) == 0:
                needs_keywords.append(product)
            else:
                has_keywords += 1

        print(f"📋 Status:")
        print(f"   • Already have keywords: {has_keywords}")
        print(f"   • Need keywords: {len(needs_keywords)}\n")

        if not needs_keywords:
            print("✅ All products already have keywords!")
            return

        print(f"🚀 Generating keywords for {len(needs_keywords)} products...\n")

        # Process each product
        for i, product in enumerate(needs_keywords, 1):
            print(f"[{i}/{len(needs_keywords)}] {product['title'][:50]}...")

            try:
                # Generate keywords
                keywords = await generate_keywords_for_product(
                    title=product['title'],
                    description=product.get('description', ''),
                    product_type='',  # Not available in schema
                    use_ai=use_ai
                )

                if keywords:
                    # Update database
                    await supabase.client.table("company_products")\
                        .update({"search_keywords": keywords})\
                        .eq("id", product['id'])\
                        .execute()

                    print(f"   ✅ Saved {len(keywords)} keywords\n")
                else:
                    print(f"   ⚠️  No keywords generated\n")

                # Rate limiting for AI
                if use_ai:
                    await asyncio.sleep(2)  # 2 seconds between AI calls

            except Exception as e:
                print(f"   ❌ Error: {e}\n")
                continue

        print("=" * 60)
        print("✅ Keyword generation complete!")
        print(f"   Processed: {len(needs_keywords)} products")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error during backfill: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await supabase.close()


async def regenerate_all_keywords(use_ai: bool = True):
    """
    Regenerate keywords for ALL products (even those that have them).
    Useful if you want to improve existing keywords.

    Args:
        use_ai: Whether to use AI for keyword generation (default: True)
    """
    supabase = SupabaseClient()
    await supabase.initialize()

    try:
        print("=" * 60)
        print("🔄 REGENERATING ALL KEYWORDS")
        print("⚠️  This will replace existing keywords!")
        print("=" * 60)
        print(f"AI Mode: {'Enabled ✅' if use_ai else 'Disabled (Simple extraction)'}\n")

        response = input("Type 'yes' to continue: ")
        if response.lower() != 'yes':
            print("❌ Cancelled")
            return

        # Fetch all products
        print("\n📊 Fetching products from database...")
        result = await supabase.client.table("company_products")\
            .select("id, title, description")\
            .execute()

        products = result.data or []
        print(f"   Found {len(products)} products\n")

        print(f"🚀 Regenerating keywords for all {len(products)} products...\n")

        # Process each product
        for i, product in enumerate(products, 1):
            print(f"[{i}/{len(products)}] {product['title'][:50]}...")

            try:
                # Generate keywords
                keywords = await generate_keywords_for_product(
                    title=product['title'],
                    description=product.get('description', ''),
                    product_type='',  # Not available in schema
                    use_ai=use_ai
                )

                if keywords:
                    # Update database
                    await supabase.client.table("company_products")\
                        .update({"search_keywords": keywords})\
                        .eq("id", product['id'])\
                        .execute()

                    print(f"   ✅ Saved {len(keywords)} keywords\n")
                else:
                    print(f"   ⚠️  No keywords generated\n")

                # Rate limiting for AI
                if use_ai:
                    await asyncio.sleep(2)

            except Exception as e:
                print(f"   ❌ Error: {e}\n")
                continue

        print("=" * 60)
        print("✅ Regeneration complete!")
        print(f"   Processed: {len(products)} products")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Error during regeneration: {e}")
        import traceback
        traceback.print_exc()

    finally:
        await supabase.close()


if __name__ == "__main__":
    import sys

    print("\n🔑 Keyword Generator for Products\n")
    print("Options:")
    print("  1. Backfill missing keywords (AI)")
    print("  2. Backfill missing keywords (Simple)")
    print("  3. Regenerate ALL keywords (AI)")
    print("  4. Regenerate ALL keywords (Simple)")

    choice = input("\nSelect option (1-4): ").strip()

    if choice == "1":
        asyncio.run(backfill_keywords(use_ai=True))
    elif choice == "2":
        asyncio.run(backfill_keywords(use_ai=False))
    elif choice == "3":
        asyncio.run(regenerate_all_keywords(use_ai=True))
    elif choice == "4":
        asyncio.run(regenerate_all_keywords(use_ai=False))
    else:
        print("❌ Invalid choice")
