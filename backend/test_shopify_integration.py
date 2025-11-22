"""
Test script for Shopify OAuth and API integration
Run this after completing OAuth flow to verify everything works
"""

import asyncio
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from utils.supabase import SupabaseClient
from utils.shopify_api import ShopifyAPIClient

async def test_shopify_integration():
    """Test the complete Shopify integration"""

    print("🧪 Testing Shopify Integration...\n")

    # Step 1: Connect to database
    print("1️⃣ Connecting to Supabase...")
    supabase = SupabaseClient()
    await supabase.initialize()
    print("   ✅ Connected to Supabase\n")

    # Step 2: Check for OAuth tokens
    print("2️⃣ Checking for Shopify OAuth tokens...")
    result = await supabase.client.table("shopify_oauth_tokens")\
        .select("*, shopify_shops(*)")\
        .eq("is_active", True)\
        .execute()

    if not result.data or len(result.data) == 0:
        print("   ❌ No active Shopify connections found!")
        print("   👉 Complete OAuth flow first:")
        print("      Visit: https://YOUR_API/shopify/install?shop=YOUR_STORE&company_id=YOUR_UUID")
        return

    print(f"   ✅ Found {len(result.data)} active Shopify connection(s)\n")

    # Step 3: Test each connected store
    for token_data in result.data:
        shop_domain = token_data["shop_domain"]
        access_token = token_data["access_token"]
        scope = token_data["scope"]

        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"🏪 Testing Store: {shop_domain}")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

        # Get shop info
        shop_info = token_data.get("shopify_shops")
        if shop_info:
            print("📊 Shop Information:")
            print(f"   Name: {shop_info.get('shop_name')}")
            print(f"   Owner: {shop_info.get('shop_owner')}")
            print(f"   Email: {shop_info.get('email')}")
            print(f"   Currency: {shop_info.get('currency')}")
            print(f"   Country: {shop_info.get('country')}")

        print(f"\n🔑 OAuth Scopes: {scope}\n")

        # Step 4: Initialize API client
        print("3️⃣ Initializing Shopify API client...")
        client = ShopifyAPIClient(shop_domain, access_token)
        print("   ✅ API client initialized\n")

        # Step 5: Test shop info endpoint
        print("4️⃣ Testing: Get Shop Info")
        try:
            shop_data = client.get_shop_info()
            print(f"   ✅ Shop Name: {shop_data.get('name')}")
            print(f"   ✅ Primary Domain: {shop_data.get('domain')}")
            print(f"   ✅ Plan: {shop_data.get('plan_display_name')}\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")

        # Step 6: Test product count
        print("5️⃣ Testing: Get Product Count")
        try:
            count = client.get_product_count()
            print(f"   ✅ Total Products: {count}\n")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")

        # Step 7: Test fetching products
        print("6️⃣ Testing: Fetch Products")
        try:
            products_response = client.get_products(limit=5)
            products = products_response.get("products", [])

            if products:
                print(f"   ✅ Retrieved {len(products)} products:")
                for i, product in enumerate(products, 1):
                    title = product.get("title", "Untitled")
                    variants = product.get("variants", [])
                    price = variants[0].get("price") if variants else "N/A"
                    inventory = variants[0].get("inventory_quantity", 0) if variants else 0
                    print(f"      {i}. {title}")
                    print(f"         Price: ${price}")
                    print(f"         Inventory: {inventory}")
                    print(f"         Product ID: {product.get('id')}")
            else:
                print("   ⚠️  No products found in store")
            print()
        except Exception as e:
            print(f"   ❌ Error: {str(e)}\n")

        # Step 8: Test fetching orders (if read_orders scope exists)
        if "read_orders" in scope:
            print("7️⃣ Testing: Fetch Recent Orders")
            try:
                orders_response = client.get_orders(limit=5, status="any")
                orders = orders_response.get("orders", [])

                if orders:
                    print(f"   ✅ Retrieved {len(orders)} recent orders:")
                    for i, order in enumerate(orders, 1):
                        order_number = order.get("order_number", "N/A")
                        total_price = order.get("total_price", "0.00")
                        created_at = order.get("created_at", "")[:10]
                        print(f"      {i}. Order #{order_number}")
                        print(f"         Total: ${total_price}")
                        print(f"         Date: {created_at}")
                else:
                    print("   ℹ️  No orders found")
                print()
            except Exception as e:
                print(f"   ❌ Error: {str(e)}\n")

        # Step 9: Test discount codes (if read_discounts scope exists)
        if "read_discounts" in scope:
            print("8️⃣ Testing: Fetch Discount Codes")
            try:
                discount_codes = client.get_discount_codes()

                if discount_codes:
                    print(f"   ✅ Found {len(discount_codes)} discount codes:")
                    for i, code in enumerate(discount_codes[:3], 1):  # Show first 3
                        code_text = code.get("code", "N/A")
                        print(f"      {i}. {code_text}")
                else:
                    print("   ℹ️  No discount codes found")
                print()
            except Exception as e:
                print(f"   ❌ Error: {str(e)}\n")

        # Step 10: Test creating a discount code (if write_discounts scope exists)
        if "write_discounts" in scope:
            print("9️⃣ Testing: Create Discount Code")
            try:
                # Create a test discount code
                test_code = f"TEST{asyncio.get_event_loop().time():.0f}"  # Unique code
                result = client.create_discount_code(
                    code=test_code,
                    value=10,  # 10% off
                    value_type="percentage",
                    usage_limit=1
                )
                print(f"   ✅ Created discount code: {test_code}")
                print(f"   ✅ Discount: 10% off")
                print()
            except Exception as e:
                print(f"   ❌ Error: {str(e)}\n")

    # Final summary
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ Shopify Integration Test Complete!")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    await supabase.close()

if __name__ == "__main__":
    asyncio.run(test_shopify_integration())
