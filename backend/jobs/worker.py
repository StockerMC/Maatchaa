"""
ARQ Worker configuration and startup.

Run with: arq jobs.worker.WorkerSettings

This worker processes background jobs from the Redis queue,
including creator discovery, email sending, and Shopify sync.
"""
import os
from typing import Optional
from arq import create_pool
from arq.connections import RedisSettings
from dotenv import load_dotenv

load_dotenv()

# Redis connection from environment
# Upstash provides a standard Redis URL: redis://default:xxx@xxx.upstash.io:6379
REDIS_URL = os.getenv("UPSTASH_REDIS_URL") or os.getenv("REDIS_URL")


def get_redis_settings() -> RedisSettings:
    """
    Parse Redis URL into ARQ RedisSettings.

    Supports both Upstash (redis://...) and local Redis connections.
    """
    if not REDIS_URL:
        # Default to local Redis for development
        return RedisSettings(
            host="localhost",
            port=6379,
            database=0
        )

    # Parse Redis URL (redis://user:password@host:port/db)
    from urllib.parse import urlparse

    parsed = urlparse(REDIS_URL)

    return RedisSettings(
        host=parsed.hostname or "localhost",
        port=parsed.port or 6379,
        password=parsed.password,
        database=int(parsed.path[1:]) if parsed.path and len(parsed.path) > 1 else 0,
        ssl=parsed.scheme == "rediss",  # Use SSL for rediss:// URLs
    )


# Import all job functions
from jobs.tasks import (
    discover_creators_job,
    send_email_job,
    generate_embeddings_job,
    sync_shopify_products_job,
    process_video_job,
    trigger_discovery_with_queue_job,
)


async def startup(ctx: dict):
    """Called when worker starts"""
    print("=" * 60)
    print("🚀 ARQ WORKER STARTING")
    print("=" * 60)
    print(f"Redis: {REDIS_URL[:30]}..." if REDIS_URL else "Redis: localhost:6379")
    print("Registered jobs:")
    print("  - discover_creators_job")
    print("  - send_email_job")
    print("  - generate_embeddings_job")
    print("  - sync_shopify_products_job")
    print("  - process_video_job")
    print("  - trigger_discovery_with_queue_job")
    print("=" * 60)


async def shutdown(ctx: dict):
    """Called when worker shuts down"""
    print("=" * 60)
    print("⏹️  ARQ WORKER SHUTTING DOWN")
    print("=" * 60)


class WorkerSettings:
    """
    ARQ Worker configuration.

    This class defines the worker behavior including:
    - Redis connection settings
    - Registered job functions
    - Retry and timeout policies
    - Queue configuration
    """

    # Redis connection
    redis_settings = get_redis_settings()

    # Register all job functions
    functions = [
        discover_creators_job,
        send_email_job,
        generate_embeddings_job,
        sync_shopify_products_job,
        process_video_job,
        trigger_discovery_with_queue_job,
    ]

    # Lifecycle hooks
    on_startup = startup
    on_shutdown = shutdown

    # Retry configuration
    max_tries = 3  # Retry failed jobs up to 3 times
    retry_delay = 60  # Wait 60 seconds before retry

    # Timeout configuration
    job_timeout = 1800  # 30 minutes max per job
    keep_result = 3600  # Keep results for 1 hour

    # Queue configuration
    queue_name = "maatchaa:jobs"

    # Health check
    health_check_interval = 60  # Check every 60 seconds

    # Concurrency - be conservative to avoid rate limits
    max_jobs = 5  # Max concurrent jobs


# ============================================================================
# HELPER FUNCTIONS FOR ENQUEUING JOBS
# ============================================================================

_pool = None


async def get_redis_pool():
    """Get or create a Redis connection pool for enqueueing jobs"""
    global _pool
    if _pool is None:
        _pool = await create_pool(WorkerSettings.redis_settings)
    return _pool


async def enqueue_job(job_func, **kwargs):
    """
    Helper to enqueue a job from API routes.

    Usage:
        from jobs import enqueue_job
        from jobs.tasks import discover_creators_job

        await enqueue_job(
            discover_creators_job,
            company_id="uuid-here",
            shop_domain="store.myshopify.com"
        )

    Args:
        job_func: The job function to enqueue
        **kwargs: Arguments to pass to the job

    Returns:
        ARQ Job object with job_id
    """
    pool = await get_redis_pool()
    job = await pool.enqueue_job(job_func.__name__, **kwargs)
    return job


async def enqueue_job_with_delay(job_func, delay_seconds: int, **kwargs):
    """
    Enqueue a job to run after a delay.

    Useful for rate-limited operations where you want to spread
    out the load over time.

    Args:
        job_func: The job function to enqueue
        delay_seconds: Seconds to wait before running
        **kwargs: Arguments to pass to the job

    Returns:
        ARQ Job object with job_id
    """
    from datetime import timedelta

    pool = await get_redis_pool()
    job = await pool.enqueue_job(
        job_func.__name__,
        _defer_by=timedelta(seconds=delay_seconds),
        **kwargs
    )
    return job


async def get_job_status(job_id: str) -> Optional[dict]:
    """
    Get the status of a job.

    Args:
        job_id: The job ID returned from enqueue_job

    Returns:
        Dict with job status, or None if not found
    """
    pool = await get_redis_pool()

    try:
        from arq.jobs import Job
        job = Job(job_id, pool)
        info = await job.info()

        if info is None:
            return None

        return {
            "job_id": job_id,
            "function": info.function,
            "status": info.status,
            "start_time": info.start_time.isoformat() if info.start_time else None,
            "finish_time": info.finish_time.isoformat() if info.finish_time else None,
            "success": info.success,
            "result": info.result,
        }
    except Exception as e:
        print(f"Error getting job status: {e}")
        return None


async def close_pool():
    """Close the Redis connection pool"""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
