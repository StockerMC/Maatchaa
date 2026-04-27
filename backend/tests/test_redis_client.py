"""Tests for the Redis client, caching decorator, rate limiter, and distributed lock."""
import pytest
import json
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock

from utils.redis_client import (
    RedisClient,
    RateLimiter,
    DistributedLock,
    SessionStore,
    cache_response,
)


class TestRedisClient:
    def test_not_configured_without_credentials(self):
        client = RedisClient()
        client.url = None
        client.token = None
        assert client.is_configured is False

    def test_configured_with_credentials(self):
        client = RedisClient()
        client.url = "https://redis.upstash.io"
        client.token = "test-token"
        assert client.is_configured is True

    @pytest.mark.asyncio
    async def test_execute_returns_none_when_not_configured(self):
        client = RedisClient()
        client.url = None
        client.token = None
        result = await client._execute("GET", "some-key")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_delegates_to_execute(self):
        client = RedisClient()
        client._execute = AsyncMock(return_value="test-value")
        result = await client.get("my-key")
        client._execute.assert_called_once_with("GET", "my-key")
        assert result == "test-value"

    @pytest.mark.asyncio
    async def test_set_with_expiry(self):
        client = RedisClient()
        client._execute = AsyncMock(return_value="OK")
        result = await client.set("key", "val", ex=300)
        client._execute.assert_called_once_with("SET", "key", "val", "EX", 300)
        assert result is True

    @pytest.mark.asyncio
    async def test_set_without_expiry(self):
        client = RedisClient()
        client._execute = AsyncMock(return_value="OK")
        result = await client.set("key", "val")
        client._execute.assert_called_once_with("SET", "key", "val")
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_returns_count(self):
        client = RedisClient()
        client._execute = AsyncMock(return_value=1)
        result = await client.delete("key")
        assert result == 1

    @pytest.mark.asyncio
    async def test_delete_returns_zero_on_miss(self):
        client = RedisClient()
        client._execute = AsyncMock(return_value=None)
        result = await client.delete("key")
        assert result == 0

    @pytest.mark.asyncio
    async def test_exists_true(self):
        client = RedisClient()
        client._execute = AsyncMock(return_value=1)
        assert await client.exists("key") is True

    @pytest.mark.asyncio
    async def test_exists_false(self):
        client = RedisClient()
        client._execute = AsyncMock(return_value=0)
        assert await client.exists("key") is False

    @pytest.mark.asyncio
    async def test_setnx_returns_bool(self):
        client = RedisClient()
        client._execute = AsyncMock(return_value=1)
        assert await client.setnx("lock-key", "1") is True

        client._execute = AsyncMock(return_value=0)
        assert await client.setnx("lock-key", "1") is False

    @pytest.mark.asyncio
    async def test_close_cleans_up_client(self):
        client = RedisClient()
        mock_http = AsyncMock()
        client._client = mock_http
        await client.close()
        mock_http.aclose.assert_called_once()
        assert client._client is None


class TestRateLimiter:
    @pytest.mark.asyncio
    async def test_allows_when_redis_not_configured(self):
        limiter = RateLimiter("test", max_requests=10, window_seconds=60)
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = False
            assert await limiter.is_allowed() is True

    @pytest.mark.asyncio
    async def test_allows_first_request(self):
        limiter = RateLimiter("test", max_requests=10, window_seconds=60)
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(return_value=None)
            mock_redis.set = AsyncMock(return_value=True)
            assert await limiter.is_allowed(cost=1) is True
            mock_redis.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_denies_when_quota_exceeded(self):
        limiter = RateLimiter("test", max_requests=10, window_seconds=60)
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(return_value="10")
            assert await limiter.is_allowed(cost=1) is False

    @pytest.mark.asyncio
    async def test_respects_cost_parameter(self):
        limiter = RateLimiter("test", max_requests=100, window_seconds=60)
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(return_value="95")
            assert await limiter.is_allowed(cost=5) is True
            assert await limiter.is_allowed(cost=6) is False

    @pytest.mark.asyncio
    async def test_get_remaining_returns_correct_value(self):
        limiter = RateLimiter("test", max_requests=100, window_seconds=60)
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(return_value="37")
            assert await limiter.get_remaining() == 63

    @pytest.mark.asyncio
    async def test_get_remaining_full_when_not_configured(self):
        limiter = RateLimiter("test", max_requests=100, window_seconds=60)
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = False
            assert await limiter.get_remaining() == 100

    @pytest.mark.asyncio
    async def test_get_usage_returns_complete_stats(self):
        limiter = RateLimiter("test_api", max_requests=1000, window_seconds=3600)
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(return_value="250")
            mock_redis.ttl = AsyncMock(return_value=1800)
            usage = await limiter.get_usage()
            assert usage["name"] == "test_api"
            assert usage["used"] == 250
            assert usage["remaining"] == 750
            assert usage["max"] == 1000
            assert usage["resets_in_seconds"] == 1800


class TestDistributedLock:
    @pytest.mark.asyncio
    async def test_acquires_when_redis_not_configured(self):
        lock = DistributedLock("test-resource")
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = False
            assert await lock.acquire() is True

    @pytest.mark.asyncio
    async def test_acquires_when_key_not_set(self):
        lock = DistributedLock("test-resource", timeout_seconds=120)
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.setnx = AsyncMock(return_value=True)
            mock_redis.expire = AsyncMock(return_value=True)
            assert await lock.acquire() is True
            mock_redis.expire.assert_called_once_with("lock:test-resource", 120)

    @pytest.mark.asyncio
    async def test_fails_when_already_locked(self):
        lock = DistributedLock("test-resource")
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.setnx = AsyncMock(return_value=False)
            assert await lock.acquire() is False

    @pytest.mark.asyncio
    async def test_release_deletes_key(self):
        lock = DistributedLock("test-resource")
        lock.acquired = True
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.delete = AsyncMock(return_value=1)
            await lock.release()
            mock_redis.delete.assert_called_once_with("lock:test-resource")
            assert lock.acquired is False

    @pytest.mark.asyncio
    async def test_context_manager(self):
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.setnx = AsyncMock(return_value=True)
            mock_redis.expire = AsyncMock(return_value=True)
            mock_redis.delete = AsyncMock(return_value=1)

            async with DistributedLock("ctx-test") as acquired:
                assert acquired is True

            mock_redis.delete.assert_called_once()


class TestSessionStore:
    @pytest.mark.asyncio
    async def test_set_stores_json(self):
        store = SessionStore("oauth", default_ttl=900)
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.set = AsyncMock(return_value=True)
            result = await store.set("abc123", {"company_id": "xyz"})
            assert result is True
            mock_redis.set.assert_called_once_with(
                "session:oauth:abc123",
                json.dumps({"company_id": "xyz"}),
                ex=900,
            )

    @pytest.mark.asyncio
    async def test_get_returns_parsed_json(self):
        store = SessionStore("oauth")
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(
                return_value=json.dumps({"company_id": "xyz"})
            )
            result = await store.get("abc123")
            assert result == {"company_id": "xyz"}

    @pytest.mark.asyncio
    async def test_get_returns_none_when_missing(self):
        store = SessionStore("oauth")
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(return_value=None)
            result = await store.get("nonexistent")
            assert result is None

    @pytest.mark.asyncio
    async def test_get_and_delete_removes_after_read(self):
        store = SessionStore("oauth")
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(
                return_value=json.dumps({"token": "secret"})
            )
            mock_redis.delete = AsyncMock(return_value=1)
            result = await store.get_and_delete("one-time")
            assert result == {"token": "secret"}
            mock_redis.delete.assert_called_once_with("session:oauth:one-time")

    @pytest.mark.asyncio
    async def test_returns_false_when_not_configured(self):
        store = SessionStore("oauth")
        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = False
            assert await store.set("id", {"data": 1}) is False
            assert await store.get("id") is None


class TestCacheDecorator:
    @pytest.mark.asyncio
    async def test_caches_function_result(self):
        call_count = 0

        @cache_response(ttl_seconds=60, key_prefix="test")
        async def expensive_fn(x: int):
            nonlocal call_count
            call_count += 1
            return {"result": x * 2}

        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(return_value=None)
            mock_redis.set = AsyncMock(return_value=True)

            result = await expensive_fn(5)
            assert result == {"result": 10}
            assert call_count == 1
            mock_redis.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_cached_value_on_hit(self):
        call_count = 0

        @cache_response(ttl_seconds=60, key_prefix="test")
        async def expensive_fn(x: int):
            nonlocal call_count
            call_count += 1
            return {"result": x * 2}

        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = True
            mock_redis.get = AsyncMock(
                return_value=json.dumps({"result": 10})
            )

            result = await expensive_fn(5)
            assert result == {"result": 10}
            assert call_count == 0

    @pytest.mark.asyncio
    async def test_skips_cache_when_not_configured(self):
        call_count = 0

        @cache_response(ttl_seconds=60, key_prefix="test")
        async def expensive_fn():
            nonlocal call_count
            call_count += 1
            return {"data": True}

        with patch("utils.redis_client.redis_client") as mock_redis:
            mock_redis.is_configured = False
            result = await expensive_fn()
            assert result == {"data": True}
            assert call_count == 1
