"""
Shopify OAuth 2.0 Authorization Code Grant Flow
Handles the complete OAuth flow for multi-tenant Shopify app installation
"""

import os
import hmac
import hashlib
import secrets
from typing import Optional, Dict, Any
from urllib.parse import urlencode, parse_qs, urlparse
import requests
from dotenv import load_dotenv

load_dotenv()

# Shopify App Credentials (from Partner Dashboard)
SHOPIFY_API_KEY = os.getenv("SHOPIFY_API_KEY")
SHOPIFY_API_SECRET = os.getenv("SHOPIFY_API_SECRET")
SHOPIFY_SCOPES = os.getenv("SHOPIFY_SCOPES", "read_products,read_orders,read_discounts,write_discounts")
SHOPIFY_REDIRECT_URI = os.getenv("SHOPIFY_REDIRECT_URI")  # e.g., https://api.maatchaa.com/shopify/callback
APP_URL = os.getenv("APP_URL", "https://maatchaa.vercel.app")  # Frontend URL

class ShopifyOAuthError(Exception):
    """Custom exception for Shopify OAuth errors"""
    pass

def generate_nonce() -> str:
    """Generate a cryptographically secure random nonce for state parameter"""
    return secrets.token_urlsafe(32)

def verify_hmac(query_params: Dict[str, str], hmac_to_verify: str) -> bool:
    """
    Verify the HMAC signature from Shopify to ensure request authenticity

    Args:
        query_params: Dictionary of query parameters (excluding 'hmac')
        hmac_to_verify: The HMAC value from Shopify

    Returns:
        bool: True if HMAC is valid, False otherwise
    """
    if not SHOPIFY_API_SECRET:
        raise ShopifyOAuthError("SHOPIFY_API_SECRET not configured")

    # Create encoded parameter string (sorted by key)
    # Handle list values from BlackSheep query params
    encoded_params = "&".join(
        f"{key}={value[0] if isinstance(value, list) else value}"
        for key, value in sorted(query_params.items())
        if key != "hmac"
    )

    # Compute HMAC
    computed_hmac = hmac.new(
        SHOPIFY_API_SECRET.encode('utf-8'),
        encoded_params.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(computed_hmac, hmac_to_verify)

def verify_shopify_request(query_params: Dict[str, str]) -> bool:
    """
    Verify that a request came from Shopify by validating the HMAC

    Args:
        query_params: Dictionary of all query parameters

    Returns:
        bool: True if request is verified, False otherwise
    """
    hmac_param = query_params.get("hmac")

    # Handle if hmac is returned as a list by BlackSheep
    if isinstance(hmac_param, list):
        hmac_param = hmac_param[0] if hmac_param else None

    if not hmac_param:
        return False

    return verify_hmac(query_params, hmac_param)

def build_install_url(shop: str, state: str) -> str:
    """
    Build the OAuth authorization URL to redirect the merchant to Shopify

    Args:
        shop: The shop domain (e.g., 'my-store.myshopify.com')
        state: Random nonce for CSRF protection

    Returns:
        str: Complete authorization URL
    """
    if not all([SHOPIFY_API_KEY, SHOPIFY_REDIRECT_URI]):
        raise ShopifyOAuthError("Missing required Shopify OAuth configuration")

    # Clean shop domain (remove https:// if present)
    shop = shop.replace("https://", "").replace("http://", "")
    if not shop.endswith(".myshopify.com"):
        shop = f"{shop}.myshopify.com"

    params = {
        "client_id": SHOPIFY_API_KEY,
        "scope": SHOPIFY_SCOPES,
        "redirect_uri": SHOPIFY_REDIRECT_URI,
        "state": state,
        "grant_options[]": "per-user"  # Optional: for online access mode
    }

    print(f"🔗 Built redirect_uri: {SHOPIFY_REDIRECT_URI}")

    base_url = f"https://{shop}/admin/oauth/authorize"
    return f"{base_url}?{urlencode(params)}"

def exchange_code_for_token(shop: str, code: str) -> Dict[str, Any]:
    """
    Exchange the authorization code for an access token

    Args:
        shop: The shop domain
        code: Authorization code from Shopify callback

    Returns:
        dict: Token response containing access_token, scope, etc.

    Raises:
        ShopifyOAuthError: If token exchange fails
    """
    if not all([SHOPIFY_API_KEY, SHOPIFY_API_SECRET]):
        raise ShopifyOAuthError("Missing Shopify API credentials")

    # Clean shop domain
    shop = shop.replace("https://", "").replace("http://", "")
    if not shop.endswith(".myshopify.com"):
        shop = f"{shop}.myshopify.com"

    token_url = f"https://{shop}/admin/oauth/access_token"

    payload = {
        "client_id": SHOPIFY_API_KEY,
        "client_secret": SHOPIFY_API_SECRET,
        "code": code
    }

    try:
        response = requests.post(token_url, json=payload, timeout=10)
        response.raise_for_status()

        token_data = response.json()

        # Validate response has required fields
        if "access_token" not in token_data:
            raise ShopifyOAuthError("Invalid token response from Shopify")

        return token_data

    except requests.exceptions.RequestException as e:
        raise ShopifyOAuthError(f"Failed to exchange code for token: {str(e)}")

def validate_shop_domain(shop: str) -> bool:
    """
    Validate that the shop domain is a legitimate Shopify domain

    Args:
        shop: Shop domain to validate

    Returns:
        bool: True if valid, False otherwise
    """
    # Clean the domain
    shop = shop.replace("https://", "").replace("http://", "")

    # Must end with .myshopify.com
    if not shop.endswith(".myshopify.com"):
        return False

    # Extract subdomain
    subdomain = shop.replace(".myshopify.com", "")

    # Subdomain must be alphanumeric with hyphens
    # Must start and end with alphanumeric
    if not subdomain:
        return False

    if subdomain[0] == '-' or subdomain[-1] == '-':
        return False

    for char in subdomain:
        if not (char.isalnum() or char == '-'):
            return False

    return True

def get_shop_info(shop: str, access_token: str) -> Dict[str, Any]:
    """
    Fetch shop information using the access token

    Args:
        shop: Shop domain
        access_token: OAuth access token

    Returns:
        dict: Shop information

    Raises:
        ShopifyOAuthError: If API request fails
    """
    shop = shop.replace("https://", "").replace("http://", "")
    if not shop.endswith(".myshopify.com"):
        shop = f"{shop}.myshopify.com"

    url = f"https://{shop}/admin/api/2024-01/shop.json"

    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json().get("shop", {})

    except requests.exceptions.RequestException as e:
        raise ShopifyOAuthError(f"Failed to fetch shop info: {str(e)}")

def uninstall_webhook_url() -> str:
    """Get the webhook URL for app uninstall events"""
    base_url = os.getenv("API_URL", "https://maatchaa.vercel.app/api")
    return f"{base_url}/shopify/webhooks/uninstall"

def create_uninstall_webhook(shop: str, access_token: str) -> Dict[str, Any]:
    """
    Create a webhook to listen for app uninstall events

    Args:
        shop: Shop domain
        access_token: OAuth access token

    Returns:
        dict: Webhook creation response
    """
    shop = shop.replace("https://", "").replace("http://", "")
    if not shop.endswith(".myshopify.com"):
        shop = f"{shop}.myshopify.com"

    url = f"https://{shop}/admin/api/2024-01/webhooks.json"

    headers = {
        "X-Shopify-Access-Token": access_token,
        "Content-Type": "application/json"
    }

    payload = {
        "webhook": {
            "topic": "app/uninstalled",
            "address": uninstall_webhook_url(),
            "format": "json"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        raise ShopifyOAuthError(f"Failed to create uninstall webhook: {str(e)}")
