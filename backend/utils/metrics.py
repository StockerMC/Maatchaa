"""
Prometheus metrics for observability.

Exposes a /metrics endpoint for Prometheus/Grafana scraping.
Track API performance, external service usage, and job queue health.

Usage:
    from utils.metrics import track_request, track_external_api

    @track_request("/partnerships")
    async def get_partnerships():
        ...

    async with track_external_api("youtube"):
        result = await youtube_api.search(...)
"""
import time
from functools import wraps
from typing import Callable
from contextlib import asynccontextmanager

from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)


# ============================================================================
# API METRICS
# ============================================================================

# Total API requests by method, endpoint, and status
api_requests_total = Counter(
    "api_requests_total",
    "Total API requests",
    ["method", "endpoint", "status"]
)

# API request duration histogram
api_request_duration_seconds = Histogram(
    "api_request_duration_seconds",
    "API request duration in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
)

# Active requests gauge
api_active_requests = Gauge(
    "api_active_requests",
    "Number of active API requests",
    ["endpoint"]
)


# ============================================================================
# EXTERNAL API METRICS
# ============================================================================

# External API calls by service and status
external_api_calls_total = Counter(
    "external_api_calls_total",
    "External API calls",
    ["service", "status"]  # service: youtube, gemini, cohere, shopify
)

# External API call duration
external_api_duration_seconds = Histogram(
    "external_api_duration_seconds",
    "External API call duration in seconds",
    ["service"],
    buckets=[0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30, 60]
)

# Remaining quota gauge (updated periodically)
external_api_quota_remaining = Gauge(
    "external_api_quota_remaining",
    "Remaining quota for external APIs",
    ["service"]
)


# ============================================================================
# JOB QUEUE METRICS
# ============================================================================

# Job queue depth
job_queue_depth = Gauge(
    "job_queue_depth",
    "Number of jobs in queue",
    ["queue_name", "status"]  # status: pending, active, completed, failed
)

# Job processing duration
job_processing_duration_seconds = Histogram(
    "job_processing_duration_seconds",
    "Job processing duration",
    ["job_type"],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600, 1800]
)

# Total jobs processed
jobs_total = Counter(
    "jobs_total",
    "Total jobs processed",
    ["job_type", "status"]  # status: success, failure, retry
)


# ============================================================================
# DISCOVERY METRICS
# ============================================================================

# Discovery cycle duration
discovery_cycle_duration_seconds = Histogram(
    "discovery_cycle_duration_seconds",
    "Creator discovery cycle duration",
    buckets=[60, 120, 300, 600, 1200, 1800, 3600]
)

# Creators discovered
creators_discovered_total = Counter(
    "creators_discovered_total",
    "Total creators discovered"
)

# Videos processed
videos_processed_total = Counter(
    "videos_processed_total",
    "Total videos processed",
    ["status"]  # relevant, irrelevant, error, skipped
)

# Products in system
products_count = Gauge(
    "products_count",
    "Total products in system",
    ["company_id"]
)

# Partnerships count by status
partnerships_count = Gauge(
    "partnerships_count",
    "Number of partnerships by status",
    ["status"]
)


# ============================================================================
# DECORATORS
# ============================================================================

def track_request(endpoint: str, method: str = "GET"):
    """
    Decorator to track API request metrics.

    Usage:
        @track_request("/partnerships", "GET")
        async def get_partnerships(request):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            api_active_requests.labels(endpoint=endpoint).inc()
            start_time = time.time()
            status = "200"

            try:
                result = await func(*args, **kwargs)
                # Try to get status from response
                if hasattr(result, "status"):
                    status = str(result.status)
                return result
            except Exception as e:
                status = "500"
                raise
            finally:
                duration = time.time() - start_time
                api_requests_total.labels(
                    method=method,
                    endpoint=endpoint,
                    status=status
                ).inc()
                api_request_duration_seconds.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(duration)
                api_active_requests.labels(endpoint=endpoint).dec()

        return wrapper
    return decorator


@asynccontextmanager
async def track_external_api(service: str):
    """
    Context manager to track external API calls.

    Usage:
        async with track_external_api("youtube"):
            result = await youtube_api.search(keyword)
    """
    start_time = time.time()
    status = "success"

    try:
        yield
    except Exception as e:
        status = "error"
        raise
    finally:
        duration = time.time() - start_time
        external_api_calls_total.labels(service=service, status=status).inc()
        external_api_duration_seconds.labels(service=service).observe(duration)


def track_job(job_type: str):
    """
    Decorator to track job execution metrics.

    Usage:
        @track_job("discover_creators")
        async def discover_creators_job(ctx, company_id):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = "success"

            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = "failure"
                raise
            finally:
                duration = time.time() - start_time
                jobs_total.labels(job_type=job_type, status=status).inc()
                job_processing_duration_seconds.labels(
                    job_type=job_type
                ).observe(duration)

        return wrapper
    return decorator


# ============================================================================
# UPDATE FUNCTIONS
# ============================================================================

async def update_quota_metrics():
    """
    Update quota gauges from Redis rate limiters.

    Call this periodically or before generating metrics.
    """
    from utils.redis_client import (
        youtube_limiter,
        gemini_limiter,
        cohere_limiter,
        redis_client,
    )

    if not redis_client.is_configured:
        return

    try:
        external_api_quota_remaining.labels(service="youtube").set(
            await youtube_limiter.get_remaining()
        )
        external_api_quota_remaining.labels(service="gemini").set(
            await gemini_limiter.get_remaining()
        )
        external_api_quota_remaining.labels(service="cohere").set(
            await cohere_limiter.get_remaining()
        )
    except Exception as e:
        print(f"Error updating quota metrics: {e}")


async def update_partnership_metrics(supabase_client):
    """
    Update partnership count metrics from database.

    Call this periodically to keep gauges current.
    """
    try:
        # Get partnership counts by status
        result = await supabase_client.client.rpc(
            "get_partnership_counts_by_status"
        ).execute()

        if result.data:
            for row in result.data:
                partnerships_count.labels(status=row["status"]).set(row["count"])
    except Exception as e:
        # RPC might not exist, that's OK
        print(f"Error updating partnership metrics: {e}")


# ============================================================================
# METRICS EXPORT
# ============================================================================

def get_metrics() -> bytes:
    """
    Generate Prometheus metrics output.

    Returns bytes suitable for HTTP response.
    """
    return generate_latest()


def get_metrics_content_type() -> str:
    """Get content type for metrics endpoint."""
    return CONTENT_TYPE_LATEST


# ============================================================================
# HELPER: Record common events
# ============================================================================

def record_video_processed(status: str):
    """Record a video processing event."""
    videos_processed_total.labels(status=status).inc()


def record_creator_discovered():
    """Record a creator discovery event."""
    creators_discovered_total.inc()


def record_job_enqueued(job_type: str):
    """Record a job being enqueued."""
    job_queue_depth.labels(queue_name="maatchaa:jobs", status="pending").inc()


def record_job_started(job_type: str):
    """Record a job starting execution."""
    job_queue_depth.labels(queue_name="maatchaa:jobs", status="pending").dec()
    job_queue_depth.labels(queue_name="maatchaa:jobs", status="active").inc()


def record_job_completed(job_type: str, success: bool):
    """Record a job completing."""
    job_queue_depth.labels(queue_name="maatchaa:jobs", status="active").dec()
    status = "completed" if success else "failed"
    job_queue_depth.labels(queue_name="maatchaa:jobs", status=status).inc()
