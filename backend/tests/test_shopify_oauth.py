"""Tests for Shopify OAuth validation logic."""
import pytest
import hmac
import hashlib
from unittest.mock import patch

from utils.shopify_oauth import (
    verify_hmac,
    verify_shopify_request,
    build_install_url,
    validate_shop_domain,
    generate_nonce,
    ShopifyOAuthError,
)


class TestGenerateNonce:
    def test_returns_string(self):
        nonce = generate_nonce()
        assert isinstance(nonce, str)
        assert len(nonce) > 20

    def test_unique_each_call(self):
        nonces = {generate_nonce() for _ in range(50)}
        assert len(nonces) == 50


class TestVerifyHmac:
    def test_valid_hmac_passes(self):
        params = {"shop": "test-store.myshopify.com", "timestamp": "1234567890"}
        encoded = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
        expected_hmac = hmac.new(
            b"test-shopify-secret",
            encoded.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        with patch("utils.shopify_oauth.SHOPIFY_API_SECRET", "test-shopify-secret"):
            assert verify_hmac(params, expected_hmac) is True

    def test_invalid_hmac_fails(self):
        params = {"shop": "test-store.myshopify.com", "timestamp": "1234567890"}
        with patch("utils.shopify_oauth.SHOPIFY_API_SECRET", "test-shopify-secret"):
            assert verify_hmac(params, "deadbeef") is False

    def test_excludes_hmac_param_from_digest(self):
        params = {
            "hmac": "should-be-excluded",
            "shop": "store.myshopify.com",
            "code": "abc",
        }
        encoded = "&".join(
            f"{k}={v}" for k, v in sorted(params.items()) if k != "hmac"
        )
        expected = hmac.new(
            b"secret", encoded.encode(), hashlib.sha256
        ).hexdigest()

        with patch("utils.shopify_oauth.SHOPIFY_API_SECRET", "secret"):
            assert verify_hmac(params, expected) is True

    def test_raises_when_secret_not_configured(self):
        with patch("utils.shopify_oauth.SHOPIFY_API_SECRET", None):
            with pytest.raises(ShopifyOAuthError, match="SHOPIFY_API_SECRET"):
                verify_hmac({"shop": "x"}, "abc")


class TestVerifyShopifyRequest:
    def test_returns_false_without_hmac_param(self):
        assert verify_shopify_request({"shop": "x", "timestamp": "1"}) is False

    def test_handles_list_hmac_from_blacksheep(self):
        params = {"shop": "store.myshopify.com", "timestamp": "123"}
        encoded = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
        valid_hmac = hmac.new(
            b"test-secret", encoded.encode(), hashlib.sha256
        ).hexdigest()

        params["hmac"] = [valid_hmac]
        with patch("utils.shopify_oauth.SHOPIFY_API_SECRET", "test-secret"):
            assert verify_shopify_request(params) is True

    def test_rejects_tampered_params(self):
        params = {"shop": "legit-store.myshopify.com", "timestamp": "123"}
        encoded = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
        valid_hmac = hmac.new(
            b"secret", encoded.encode(), hashlib.sha256
        ).hexdigest()

        params["shop"] = "evil-store.myshopify.com"
        params["hmac"] = valid_hmac
        with patch("utils.shopify_oauth.SHOPIFY_API_SECRET", "secret"):
            assert verify_shopify_request(params) is False


class TestBuildInstallUrl:
    def test_builds_valid_url(self):
        with patch("utils.shopify_oauth.SHOPIFY_API_KEY", "client-id"), \
             patch("utils.shopify_oauth.SHOPIFY_REDIRECT_URI", "https://api.test.com/cb"), \
             patch("utils.shopify_oauth.SHOPIFY_SCOPES", "read_products"):
            url = build_install_url("my-store.myshopify.com", "nonce123")
            assert "my-store.myshopify.com/admin/oauth/authorize" in url
            assert "client_id=client-id" in url
            assert "state=nonce123" in url
            assert "redirect_uri=" in url

    def test_appends_myshopify_domain(self):
        with patch("utils.shopify_oauth.SHOPIFY_API_KEY", "key"), \
             patch("utils.shopify_oauth.SHOPIFY_REDIRECT_URI", "https://api.test.com/cb"):
            url = build_install_url("my-store", "nonce")
            assert "my-store.myshopify.com" in url

    def test_strips_protocol(self):
        with patch("utils.shopify_oauth.SHOPIFY_API_KEY", "key"), \
             patch("utils.shopify_oauth.SHOPIFY_REDIRECT_URI", "https://api.test.com/cb"):
            url = build_install_url("https://my-store.myshopify.com", "nonce")
            assert "https://https://" not in url
            assert "my-store.myshopify.com/admin/oauth/authorize" in url

    def test_raises_without_config(self):
        with patch("utils.shopify_oauth.SHOPIFY_API_KEY", None):
            with pytest.raises(ShopifyOAuthError):
                build_install_url("store", "nonce")


class TestValidateShopDomain:
    def test_valid_domains(self):
        assert validate_shop_domain("my-store.myshopify.com") is True
        assert validate_shop_domain("test-123.myshopify.com") is True
        assert validate_shop_domain("store.myshopify.com") is True

    def test_rejects_invalid_domains(self):
        assert validate_shop_domain("") is False
        assert validate_shop_domain("evil.com") is False
        assert validate_shop_domain("not-shopify.example.com") is False
        assert validate_shop_domain("../traversal.myshopify.com") is False

    def test_rejects_xss_attempts(self):
        assert validate_shop_domain("<script>alert(1)</script>.myshopify.com") is False
        assert validate_shop_domain("store.myshopify.com/admin") is False
