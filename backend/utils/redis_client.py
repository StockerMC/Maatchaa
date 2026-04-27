"""
Redis client for caching, rate limiting, and distributed locks.
Uses Upstash Redis REST API for serverless compatibility with Cloud Run.
"""
import os
import json
import hashlib
from typing import Optional, Any, Callable, TypeVar
from functools import wraps
import httpx
from dotenv import load_dotenv

load_dotenv()

UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

T = TypeVar('T')


class RedisClient:
    """
    Async Redis client using Upstash REST API.

    Upstash provides a serverless Redis with HTTP API, perfect for
    stateless environments like Cloud Run where persistent connections
    are problematic.
    """

    def __init__(self):
        self.url = UPSTASH_REDIS_REST_URL
        self.token = UPSTASH_REDIS_REST_TOKEN
        self._client: Optional[httpx.AsyncClient] = None

    @property
    def is_configured(self) -> bool:
        """Check if Redis is properly configured"""
        return bool(self.url and self.token)

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.url,
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10.0
            )
        return self._client

    async def _execute(self, *args) -> Any:
        """Execute a Redis command via REST API"""
        if not self.is_configured:
            return None

        try:
            client = await self._get_client()
            # Upstash REST API: POST with command array
            response = await client.post("/", json=list(args))
            data = response.json()

            if "error" in data:
                print(f"Redis error: {data['error']}")
                return None

            return data.get("result")
        except Exception as e:
            print(f"Redis connection error: {e}")
            return None

    async def get(self, key: str) -> Optional[str]:
        """Get a value by key"""
        return await self._execute("GET", key)

    async def set(self, key: str, value: str, ex: int = None) -> bool:
        """
        Set a key-value pair.

        Args:
            key: The key to set
            value: The value to store
            ex: Optional expiration time in seconds
        """
        if ex:
            result = await self._execute("SET", key, value, "EX", ex)
        else:
            result = await self._execute("SET", key, value)
        return result == "OK"

    async def setex(self, key: str, seconds: int, value: str) -> bool:
        """Set a key with expiration"""
        result = await self._execute("SETEX", key, seconds, value)
        return result == "OK"

    async def delete(self, key: str) -> int:
        """Delete a key"""
        result = await self._execute("DEL", key)
        return result if result else 0

    async def exists(self, key: str) -> bool:
        """Check if a key exists"""
        result = await self._execute("EXISTS", key)
        return result == 1

    async def incr(self, key: str) -> int:
        """Increment a key's integer value"""
        result = await self._execute("INCR", key)
        return result if result else 0

    async def incrby(self, key: str, amount: int) -> int:
        """Increment a key by a specific amount"""
        result = await self._execute("INCRBY", key, amount)
        return result if result else 0

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration on a key"""
        result = await self._execute("EXPIRE", key, seconds)
        return result == 1

    async def ttl(self, key: str) -> int:
        """Get time-to-live for a key"""
        result = await self._execute("TTL", key)
        return result if result else -1

    async def setnx(self, key: str, value: str) -> bool:
        """Set if not exists - useful for distributed locks"""
        result = await self._execute("SETNX", key, value)
        return result == 1

    async def keys(self, pattern: str) -> list:
        """Get keys matching a pattern (use sparingly in production)"""
        result = await self._execute("KEYS", pattern)
        return result if result else []

    async def close(self):
        """Close the HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None


# Singleton instance
redis_client = RedisClient()


# ============================================================================
# CACHING DECORATOR
# ============================================================================

def cache_response(ttl_seconds: int = 300, key_prefix: str = "cache"):
    """
    Decorator to cache async function results in Redis.

    Caches the JSON-serializable return value of an async function.
    If Redis is unavailable, the function executes normally without caching.

    Usage:
        @cache_response(ttl_seconds=600, key_prefix="products")
        async def get_products(company_id: str):
            # Expensive database query
            ...
            return products

    Args:
        ttl_seconds: How long to cache the result (default 5 minutes)
        key_prefix: Prefix for the cache key
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Skip caching if Redis not configured
            if not redis_client.is_configured:
                return await func(*args, **kwargs)

            # Generate cache key from function name and arguments
            # Filter out non-serializable args (like Request objects)
            serializable_args = []
            for arg in args:
                if hasattr(arg, '__dict__'):
                    # Skip complex objects like Request
                    continue
                serializable_args.append(str(arg))

            serializable_kwargs = {
                k: str(v) for k, v in kwargs.items()
                if not hasattr(v, '__dict__')
            }

            key_data = f"{func.__name__}:{serializable_args}:{sorted(serializable_kwargs.items())}"
            cache_key = f"{key_prefix}:{hashlib.md5(key_data.encode()).hexdigest()}"

            # Try to get from cache
            try:
                cached = await redis_client.get(cache_key)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                print(f"Cache read error: {e}")

            # Execute function
            result = await func(*args, **kwargs)

            # Cache result
            try:
                await redis_client.set(cache_key, json.dumps(result), ex=ttl_seconds)
            except Exception as e:
                print(f"Cache write error: {e}")

            return result
        return wrapper
    return decorator


async def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching a pattern.

    Usage:
        await invalidate_cache("products:*")  # Clear all product caches
    """
    if not redis_client.is_configured:
        return

    try:
        keys = await redis_client.keys(pattern)
        for key in keys:
            await redis_client.delete(key)
    except Exception as e:
        print(f"Cache invalidation error: {e}")


# ============================================================================
# RATE LIMITING
# ============================================================================

class RateLimiter:
    """
    Token bucket rate limiter using Redis.

    Tracks API usage and enforces quotas. Uses a sliding window approach
    where requests are counted within a time window.

    Usage:
        youtube_limiter = RateLimiter("youtube", max_requests=10000, window_seconds=86400)

        if await youtube_limiter.is_allowed(cost=100):
            # Make API call (costs 100 quota units)
            result = youtube_api.search(...)
        else:
            # Quota exceeded
            print(f"Remaining: {await youtube_limiter.get_remaining()}")
    """

    def __init__(self, name: str, max_requests: int, window_seconds: int):
        """
        Initialize a rate limiter.

        Args:
            name: Identifier for this rate limiter (e.g., "youtube_api")
            max_requests: Maximum requests allowed in the window
            window_seconds: Time window in seconds (e.g., 86400 for daily)
        """
        self.name = name
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.key = f"ratelimit:{name}"

    async def is_allowed(self, cost: int = 1) -> bool:
        """
        Check if a request is allowed and increment the counter.

        Args:
            cost: Number of quota units this request consumes (default 1)

        Returns:
            True if the request is allowed, False if quota exceeded
        """
        if not redis_client.is_configured:
            return True  # Allow all requests if Redis unavailable

        try:
            current = await redis_client.get(self.key)
            count = int(current) if current else 0

            if count + cost > self.max_requests:
                return False

            if count == 0:
                # First request in window - set with expiration
                await redis_client.set(self.key, str(cost), ex=self.window_seconds)
            else:
                # Increment existing counter
                await redis_client.incrby(self.key, cost)

            return True
        except Exception as e:
            print(f"Rate limiter error: {e}")
            return True  # Fail open

    async def get_remaining(self) -> int:
        """Get remaining quota units in the current window"""
        if not redis_client.is_configured:
            return self.max_requests

        try:
            current = await redis_client.get(self.key)
            count = int(current) if current else 0
            return max(0, self.max_requests - count)
        except Exception as e:
            print(f"Rate limiter error: {e}")
            return self.max_requests

    async def get_usage(self) -> dict:
        """Get current usage stats"""
        remaining = await self.get_remaining()
        used = self.max_requests - remaining
        ttl = await redis_client.ttl(self.key) if redis_client.is_configured else -1

        return {
            "name": self.name,
            "used": used,
            "remaining": remaining,
            "max": self.max_requests,
            "window_seconds": self.window_seconds,
            "resets_in_seconds": ttl if ttl > 0 else self.window_seconds
        }

    async def reset(self):
        """Reset the rate limit (for testing/admin use)"""
        if redis_client.is_configured:
            await redis_client.delete(self.key)


# Pre-configured rate limiters for external APIs
youtube_limiter = RateLimiter(
    "youtube_api",
    max_requests=10000,  # 10K quota units/day (free tier)
    window_seconds=86400  # 24 hours
)

gemini_limiter = RateLimiter(
    "gemini_api",
    max_requests=15,  # 15 requests/minute (free tier)
    window_seconds=60  # 1 minute
)

cohere_limiter = RateLimiter(
    "cohere_api",
    max_requests=100,  # 100 requests/minute
    window_seconds=60  # 1 minute
)

shopify_limiter = RateLimiter(
    "shopify_api",
    max_requests=80,  # Shopify allows ~2 req/sec sustained
    window_seconds=60  # 1 minute
)


# ============================================================================
# DISTRIBUTED LOCKING
# ============================================================================

class DistributedLock:
    """
    Distributed lock using Redis SETNX.

    Prevents duplicate processing across multiple workers/instances.
    Uses automatic expiration to prevent deadlocks if a worker crashes.

    Usage:
        async with DistributedLock(f"video:{video_id}") as acquired:
            if acquired:
                # Only one worker processes this video
                await process_video(video_id)
            else:
                # Another worker is already processing
                print("Skipping - already being processed")
    """

    def __init__(self, resource_name: str, timeout_seconds: int = 300):
        """
        Initialize a distributed lock.

        Args:
            resource_name: Unique identifier for the resource being locked
            timeout_seconds: Lock timeout (auto-release after this time)
        """
        self.key = f"lock:{resource_name}"
        self.timeout = timeout_seconds
        self.acquired = False

    async def acquire(self) -> bool:
        """Attempt to acquire the lock"""
        if not redis_client.is_configured:
            return True  # No Redis = no locking (single instance mode)

        try:
            self.acquired = await redis_client.setnx(self.key, "1")
            if self.acquired:
                await redis_client.expire(self.key, self.timeout)
            return self.acquired
        except Exception as e:
            print(f"Lock acquisition error: {e}")
            return True  # Fail open

    async def release(self):
        """Release the lock"""
        if self.acquired and redis_client.is_configured:
            try:
                await redis_client.delete(self.key)
            except Exception as e:
                print(f"Lock release error: {e}")
        self.acquired = False

    async def __aenter__(self):
        """Context manager entry"""
        await self.acquire()
        return self.acquired

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self.release()


# ============================================================================
# SESSION/STATE STORAGE
# ============================================================================

class SessionStore:
    """
    Simple session/state storage using Redis.

    Useful for storing temporary state like OAuth flows, draft data, etc.

    Usage:
        session = SessionStore("oauth_state")

        # Store OAuth state
        await session.set(state_id, {"company_id": "xxx", "shop": "store.myshopify.com"})

        # Retrieve and delete (for one-time use)
        data = await session.get_and_delete(state_id)
    """

    def __init__(self, prefix: str, default_ttl: int = 900):
        """
        Initialize session store.

        Args:
            prefix: Key prefix for this session type
            default_ttl: Default expiration in seconds (15 minutes)
        """
        self.prefix = prefix
        self.default_ttl = default_ttl

    def _key(self, session_id: str) -> str:
        return f"session:{self.prefix}:{session_id}"

    async def set(self, session_id: str, data: dict, ttl: int = None) -> bool:
        """Store session data"""
        if not redis_client.is_configured:
            return False

        try:
            return await redis_client.set(
                self._key(session_id),
                json.dumps(data),
                ex=ttl or self.default_ttl
            )
        except Exception as e:
            print(f"Session store error: {e}")
            return False

    async def get(self, session_id: str) -> Optional[dict]:
        """Retrieve session data"""
        if not redis_client.is_configured:
            return None

        try:
            data = await redis_client.get(self._key(session_id))
            return json.loads(data) if data else None
        except Exception as e:
            print(f"Session retrieve error: {e}")
            return None

    async def get_and_delete(self, session_id: str) -> Optional[dict]:
        """Retrieve and delete session data (one-time use)"""
        data = await self.get(session_id)
        if data:
            await redis_client.delete(self._key(session_id))
        return data

    async def delete(self, session_id: str) -> bool:
        """Delete session data"""
        if not redis_client.is_configured:
            return False

        result = await redis_client.delete(self._key(session_id))
        return result > 0


# Pre-configured session stores
oauth_state_store = SessionStore("oauth_state", default_ttl=900)  # 15 minutes
draft_store = SessionStore("draft", default_ttl=86400)  # 24 hours
