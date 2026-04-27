import pytest
import os

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-key")
os.environ.setdefault("SHOPIFY_API_KEY", "test-shopify-key")
os.environ.setdefault("SHOPIFY_API_SECRET", "test-shopify-secret")
os.environ.setdefault("SHOPIFY_REDIRECT_URI", "https://api.test.com/shopify/callback")
os.environ.setdefault("APP_URL", "https://test.maatchaa.vercel.app")
