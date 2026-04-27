"""
ARQ Job Queue Module

This module provides persistent, reliable background job processing
using ARQ (Async Redis Queue). Jobs survive server restarts and
include automatic retries with exponential backoff.

Job Types:
    - discover_creators_job: YouTube search + Gemini analysis
    - send_email_job: Partnership emails with retries
    - generate_embeddings_job: Cohere embeddings with rate limiting
    - sync_shopify_products_job: Product ingestion from Shopify

Usage:
    from jobs import enqueue_job
    from jobs.tasks import discover_creators_job

    # Enqueue a job
    await enqueue_job(
        discover_creators_job,
        company_id="uuid-here",
        shop_domain="store.myshopify.com"
    )

Worker:
    Run the worker with: arq jobs.worker.WorkerSettings
"""

from jobs.worker import enqueue_job

__all__ = ["enqueue_job"]
