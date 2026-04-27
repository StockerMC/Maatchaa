"""Tests for ARQ job queue configuration and task definitions."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from jobs.worker import WorkerSettings, get_redis_settings, enqueue_job
from jobs.tasks import (
    discover_creators_job,
    send_email_job,
    generate_embeddings_job,
    sync_shopify_products_job,
    process_video_job,
    trigger_discovery_with_queue_job,
)


class TestWorkerSettings:
    def test_has_all_required_job_functions(self):
        fn_names = [f.__name__ for f in WorkerSettings.functions]
        assert "discover_creators_job" in fn_names
        assert "send_email_job" in fn_names
        assert "generate_embeddings_job" in fn_names
        assert "sync_shopify_products_job" in fn_names
        assert "process_video_job" in fn_names
        assert "trigger_discovery_with_queue_job" in fn_names

    def test_retry_configuration(self):
        assert WorkerSettings.max_tries >= 1
        assert WorkerSettings.retry_delay > 0

    def test_timeout_configuration(self):
        assert WorkerSettings.job_timeout > 0
        assert WorkerSettings.job_timeout <= 3600

    def test_concurrency_limit(self):
        assert WorkerSettings.max_jobs > 0
        assert WorkerSettings.max_jobs <= 20

    def test_queue_name_set(self):
        assert WorkerSettings.queue_name == "maatchaa:jobs"

    def test_lifecycle_hooks_registered(self):
        assert WorkerSettings.on_startup is not None
        assert WorkerSettings.on_shutdown is not None


class TestGetRedisSettings:
    def test_defaults_to_localhost(self):
        with patch("jobs.worker.REDIS_URL", None):
            settings = get_redis_settings()
            assert settings.host == "localhost"
            assert settings.port == 6379

    def test_parses_redis_url(self):
        with patch("jobs.worker.REDIS_URL", "redis://user:pass@redis.example.com:6380/1"):
            settings = get_redis_settings()
            assert settings.host == "redis.example.com"
            assert settings.port == 6380
            assert settings.password == "pass"
            assert settings.database == 1

    def test_enables_ssl_for_rediss_scheme(self):
        with patch("jobs.worker.REDIS_URL", "rediss://default:token@upstash.io:6379"):
            settings = get_redis_settings()
            assert settings.ssl is True

    def test_no_ssl_for_redis_scheme(self):
        with patch("jobs.worker.REDIS_URL", "redis://default:token@localhost:6379"):
            settings = get_redis_settings()
            assert settings.ssl is False


class TestEnqueueJob:
    @pytest.mark.asyncio
    async def test_enqueue_calls_pool(self):
        mock_pool = AsyncMock()
        mock_pool.enqueue_job = AsyncMock(return_value=MagicMock(job_id="job-123"))

        with patch("jobs.worker.get_redis_pool", return_value=mock_pool):
            result = await enqueue_job(
                discover_creators_job,
                company_id="test-uuid",
                shop_domain="store.myshopify.com",
            )
            mock_pool.enqueue_job.assert_called_once_with(
                "discover_creators_job",
                company_id="test-uuid",
                shop_domain="store.myshopify.com",
            )


class TestDiscoverCreatorsJob:
    @pytest.mark.asyncio
    async def test_skips_when_already_running(self):
        ctx = {}
        with patch("utils.redis_client.DistributedLock") as MockLock:
            lock_instance = AsyncMock()
            lock_instance.__aenter__ = AsyncMock(return_value=False)
            lock_instance.__aexit__ = AsyncMock(return_value=False)
            MockLock.return_value = lock_instance

            result = await discover_creators_job(ctx, company_id="test-123")
            assert result["status"] == "skipped"
            assert result["reason"] == "already_running"


class TestSyncShopifyProductsJob:
    @pytest.mark.asyncio
    async def test_skips_when_sync_already_running(self):
        ctx = {}
        with patch("utils.redis_client.DistributedLock") as MockLock:
            lock_instance = AsyncMock()
            lock_instance.__aenter__ = AsyncMock(return_value=False)
            lock_instance.__aexit__ = AsyncMock(return_value=False)
            MockLock.return_value = lock_instance

            result = await sync_shopify_products_job(
                ctx, shop="store.myshopify.com", access_token="token", company_id="uuid"
            )
            assert result["status"] == "skipped"


class TestTaskDefinitions:
    def test_all_tasks_are_async(self):
        import asyncio

        tasks = [
            discover_creators_job,
            send_email_job,
            generate_embeddings_job,
            sync_shopify_products_job,
            process_video_job,
            trigger_discovery_with_queue_job,
        ]
        for task in tasks:
            assert asyncio.iscoroutinefunction(task), f"{task.__name__} must be async"

    def test_task_signatures(self):
        import inspect

        sig = inspect.signature(discover_creators_job)
        assert "ctx" in sig.parameters
        assert "company_id" in sig.parameters

        sig = inspect.signature(send_email_job)
        assert "ctx" in sig.parameters
        assert "to_email" in sig.parameters
        assert "partnership_id" in sig.parameters

        sig = inspect.signature(sync_shopify_products_job)
        assert "ctx" in sig.parameters
        assert "shop" in sig.parameters
        assert "access_token" in sig.parameters
        assert "company_id" in sig.parameters
