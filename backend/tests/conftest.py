import os
from unittest.mock import MagicMock, patch

import pytest

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-key")
os.environ.setdefault("SHOPIFY_API_KEY", "test-shopify-key")
os.environ.setdefault("SHOPIFY_API_SECRET", "test-shopify-secret")
os.environ.setdefault("SHOPIFY_REDIRECT_URI", "https://api.test.com/shopify/callback")
os.environ.setdefault("APP_URL", "https://test.maatchaa.vercel.app")

# Dummy values so a stray import of utils.vectordb during a test run cannot pick
# up real keys from .env (load_dotenv does not override what is already set).
os.environ.setdefault("COHERE_KEY", "test-cohere-key")
os.environ.setdefault("PINECONE_KEY", "test-pinecone-key")
os.environ.setdefault("INDEX_NAME", "test-index")

# utils.vectordb builds its clients at import time, and pc.Index(name) resolves
# the index host through a live call to api.pinecone.io. Job tasks import the
# module from inside their bodies, so the import can happen at any point in a
# run. Stub both constructors for the whole session; started and never stopped
# on purpose.
patch("cohere.ClientV2", MagicMock()).start()
patch("pinecone.Pinecone", MagicMock()).start()
