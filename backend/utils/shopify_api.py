"""
Shopify Admin API Client
Handles authenticated requests to Shopify Admin API for managing products, orders, etc.
"""

import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

class ShopifyAPIError(Exception):
    """Custom exception for Shopify API errors"""
    pass

class ShopifyAPIClient:
    """
    Client for making authenticated requests to Shopify Admin API

    Usage:
        client = ShopifyAPIClient(shop_domain="my-store.myshopify.com", access_token="shpat_...")
        products = client.get_products()
    """

    API_VERSION = "2024-01"

    def __init__(self, shop_domain: str, access_token: str):
        """
        Initialize Shopify API client

        Args:
            shop_domain: Shop domain (e.g., 'my-store.myshopify.com')
            access_token: OAuth access token
        """
        # Clean shop domain
        self.shop = shop_domain.replace("https://", "").replace("http://", "")
        if not self.shop.endswith(".myshopify.com"):
            self.shop = f"{self.shop}.myshopify.com"

        self.access_token = access_token
        self.base_url = f"https://{self.shop}/admin/api/{self.API_VERSION}"

        self.headers = {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json"
        }

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make an authenticated request to Shopify API

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (e.g., '/products.json')
            **kwargs: Additional arguments passed to requests

        Returns:
            dict: JSON response from Shopify

        Raises:
            ShopifyAPIError: If request fails
        """
        url = f"{self.base_url}{endpoint}"

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                timeout=30,
                **kwargs
            )
            response.raise_for_status()

            # Handle rate limiting
            if response.status_code == 429:
                retry_after = int(response.headers.get("Retry-After", 2))
                raise ShopifyAPIError(f"Rate limited. Retry after {retry_after} seconds")

            return response.json()

        except requests.exceptions.HTTPError as e:
            error_msg = f"Shopify API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data}"
            except:
                pass
            raise ShopifyAPIError(error_msg)

        except requests.exceptions.RequestException as e:
            raise ShopifyAPIError(f"Request failed: {str(e)}")

    # ==================== PRODUCTS ====================

    def get_products(self, limit: int = 50, page_info: Optional[str] = None) -> Dict[str, Any]:
        """
        Get products from Shopify store

        Args:
            limit: Number of products to retrieve (max 250)
            page_info: Cursor for pagination

        Returns:
            dict: Products data with pagination info
        """
        params = {"limit": min(limit, 250)}
        if page_info:
            params["page_info"] = page_info

        return self._request("GET", "/products.json", params=params)

    def get_product(self, product_id: int) -> Dict[str, Any]:
        """Get a specific product by ID"""
        return self._request("GET", f"/products/{product_id}.json")

    def get_product_count(self) -> int:
        """Get total count of products in store"""
        response = self._request("GET", "/products/count.json")
        return response.get("count", 0)

    # ==================== ORDERS ====================

    def get_orders(
        self,
        limit: int = 50,
        status: str = "any",
        created_at_min: Optional[str] = None,
        created_at_max: Optional[str] = None,
        attribution_app_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get orders from Shopify store

        Args:
            limit: Number of orders to retrieve (max 250)
            status: Order status filter (open, closed, cancelled, any)
            created_at_min: Filter orders created after this date
            created_at_max: Filter orders created before this date
            attribution_app_id: Filter by attribution app ID (for creator tracking)

        Returns:
            dict: Orders data
        """
        params = {
            "limit": min(limit, 250),
            "status": status
        }

        if created_at_min:
            params["created_at_min"] = created_at_min
        if created_at_max:
            params["created_at_max"] = created_at_max
        if attribution_app_id:
            params["attribution_app_id"] = attribution_app_id

        return self._request("GET", "/orders.json", params=params)

    def get_order(self, order_id: int) -> Dict[str, Any]:
        """Get a specific order by ID"""
        return self._request("GET", f"/orders/{order_id}.json")

    def get_orders_for_referrer(self, referrer: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get orders that came from a specific referrer (for creator attribution)

        Args:
            referrer: Referrer string (e.g., creator affiliate code)
            days: Number of days to look back

        Returns:
            list: Orders from that referrer
        """
        created_at_min = (datetime.now() - timedelta(days=days)).isoformat()

        response = self.get_orders(
            limit=250,
            created_at_min=created_at_min
        )

        orders = response.get("orders", [])

        # Filter by referrer in landing_site or referring_site
        matching_orders = []
        for order in orders:
            landing_site = order.get("landing_site", "")
            referring_site = order.get("referring_site", "")

            if referrer in landing_site or referrer in referring_site:
                matching_orders.append(order)

        return matching_orders

    # ==================== DISCOUNTS ====================

    def create_discount_code(
        self,
        code: str,
        value: float,
        value_type: str = "percentage",
        usage_limit: Optional[int] = None,
        starts_at: Optional[str] = None,
        ends_at: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a discount code for a creator

        Args:
            code: Discount code (e.g., 'CREATOR10')
            value: Discount value (10 for 10% or 10.00 for $10)
            value_type: 'percentage' or 'fixed_amount'
            usage_limit: Max number of uses
            starts_at: When discount becomes active (ISO 8601)
            ends_at: When discount expires (ISO 8601)

        Returns:
            dict: Created discount code
        """
        payload = {
            "price_rule": {
                "title": f"Creator Discount: {code}",
                "target_type": "line_item",
                "target_selection": "all",
                "allocation_method": "across",
                "value_type": value_type,
                "value": f"-{value}",
                "customer_selection": "all",
                "starts_at": starts_at or datetime.now().isoformat()
            }
        }

        if usage_limit:
            payload["price_rule"]["usage_limit"] = usage_limit
        if ends_at:
            payload["price_rule"]["ends_at"] = ends_at

        # Create price rule first
        price_rule_response = self._request("POST", "/price_rules.json", json=payload)
        price_rule_id = price_rule_response["price_rule"]["id"]

        # Create discount code for the price rule
        discount_payload = {
            "discount_code": {
                "code": code
            }
        }

        discount_response = self._request(
            "POST",
            f"/price_rules/{price_rule_id}/discount_codes.json",
            json=discount_payload
        )

        return discount_response

    def get_discount_codes(self) -> List[Dict[str, Any]]:
        """Get all discount codes"""
        # First get all price rules
        price_rules = self._request("GET", "/price_rules.json")

        all_discount_codes = []
        for rule in price_rules.get("price_rules", []):
            rule_id = rule["id"]
            discount_codes = self._request(
                "GET",
                f"/price_rules/{rule_id}/discount_codes.json"
            )
            all_discount_codes.extend(discount_codes.get("discount_codes", []))

        return all_discount_codes

    # ==================== INVENTORY ====================

    def get_inventory_levels(self, location_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Get inventory levels

        Args:
            location_id: Filter by location ID

        Returns:
            dict: Inventory levels
        """
        params = {}
        if location_id:
            params["location_ids"] = location_id

        return self._request("GET", "/inventory_levels.json", params=params)

    # ==================== SHOP INFO ====================

    def get_shop_info(self) -> Dict[str, Any]:
        """Get shop information"""
        response = self._request("GET", "/shop.json")
        return response.get("shop", {})

    # ==================== WEBHOOKS ====================

    def create_webhook(self, topic: str, address: str) -> Dict[str, Any]:
        """
        Create a webhook subscription

        Args:
            topic: Webhook topic (e.g., 'orders/create')
            address: Webhook URL

        Returns:
            dict: Created webhook
        """
        payload = {
            "webhook": {
                "topic": topic,
                "address": address,
                "format": "json"
            }
        }

        return self._request("POST", "/webhooks.json", json=payload)

    def get_webhooks(self) -> List[Dict[str, Any]]:
        """Get all webhooks"""
        response = self._request("GET", "/webhooks.json")
        return response.get("webhooks", [])

    def delete_webhook(self, webhook_id: int) -> None:
        """Delete a webhook"""
        self._request("DELETE", f"/webhooks/{webhook_id}.json")

def get_all_products_paginated(client: ShopifyAPIClient) -> List[Dict[str, Any]]:
    """
    Helper function to get all products using pagination

    Args:
        client: Initialized ShopifyAPIClient

    Returns:
        list: All products from the store
    """
    all_products = []
    page_info = None

    while True:
        response = client.get_products(limit=250, page_info=page_info)
        products = response.get("products", [])
        all_products.extend(products)

        # Check for next page
        link_header = response.get("link")  # Shopify uses Link header for pagination
        if not link_header or "next" not in link_header:
            break

        # Extract page_info from Link header (simplified)
        # In production, parse the Link header properly
        page_info = None  # TODO: Parse Link header
        break  # For now, just get first page

    return all_products
