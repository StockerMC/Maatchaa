import requests
from typing import List, Dict, Any, Optional, TypedDict

class Product(TypedDict):
    name: str
    price: float
    image: str
    body_html: str
    vendor: str

def get_products(shop_url: str, access_token: Optional[str] = None) -> List[Product]:
    """
    Fetch products from Shopify store.

    Args:
        shop_url: The shop domain (e.g., 'mystore.myshopify.com')
        access_token: Optional OAuth access token for Admin API (recommended for password-protected stores)

    Returns:
        List of simplified product dictionaries
    """

    # Use Admin API if access token provided (works with password-protected stores)
    if access_token:
        url = f"https://{shop_url}/admin/api/2024-01/products.json"
        headers = {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json"
        }
        print(f"📡 Fetching products from Admin API: {url}")
        res = requests.get(url, headers=headers)
    else:
        # Fall back to public storefront API (only works for non-password-protected stores)
        url = "https://" + shop_url + "/products.json"
        print(f"📡 Fetching products from public API: {url}")
        res = requests.get(url)

    # Debug response
    print(f"📊 Response Status: {res.status_code}")
    print(f"📊 Response Content-Type: {res.headers.get('Content-Type', 'unknown')}")
    print(f"📊 Response Length: {len(res.text)} characters")

    if res.status_code == 401:
        raise Exception("Store requires password. Remove password protection in Shopify settings.")

    if res.status_code == 404:
        raise Exception("Store not found. Check shop domain.")

    if res.status_code != 200:
        raise Exception(f"Failed to fetch products. Status: {res.status_code}, Response: {res.text[:200]}")

    # Check if response is empty
    if not res.text or res.text.strip() == "":
        raise Exception("Empty response from Shopify. Store may be password-protected or have no products.")

    # Try to parse JSON
    try:
        data = res.json()
    except Exception as e:
        print(f"❌ Failed to parse JSON. Response preview: {res.text[:500]}")
        raise Exception(f"Invalid JSON response from Shopify: {str(e)}")

    simplified_products: List[Product] = []
    for product in data.get("products", []):
        product_name = product.get("title")
        body_html = product.get("body_html")
        price = 20.0
        if product.get("variants") is None or len(product.get("variants")) == 0:
            price = product.get("variants")[0].get("price")
        image_src = ""
        if product.get("images"):
            image_src = product.get("images")[0].get("src", "")
        simplified_products.append({
            "name": product_name,
            "price": price,
            "image": image_src,
            "body_html": body_html,
            "vendor": shop_url
        })

    print(f"✅ Successfully parsed {len(simplified_products)} products from Shopify")
    return simplified_products
