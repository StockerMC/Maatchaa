"""Tests for Prometheus metrics module."""
import pytest
import time
from unittest.mock import AsyncMock, patch

from utils.metrics import (
    api_requests_total,
    api_request_duration_seconds,
    api_active_requests,
    external_api_calls_total,
    external_api_duration_seconds,
    track_request,
    track_external_api,
    track_job,
    record_video_processed,
    record_creator_discovered,
    get_metrics,
    get_metrics_content_type,
    videos_processed_total,
    creators_discovered_total,
    jobs_total,
    job_processing_duration_seconds,
)


class TestTrackRequestDecorator:
    @pytest.mark.asyncio
    async def test_tracks_successful_request(self):
        @track_request("/test-endpoint", "GET")
        async def handler():
            return type("Response", (), {"status": 200})()

        result = await handler()
        assert result.status == 200

    @pytest.mark.asyncio
    async def test_tracks_failed_request(self):
        @track_request("/fail-endpoint", "POST")
        async def handler():
            raise ValueError("something broke")

        with pytest.raises(ValueError, match="something broke"):
            await handler()

    @pytest.mark.asyncio
    async def test_measures_duration(self):
        @track_request("/slow-endpoint", "GET")
        async def slow_handler():
            import asyncio
            await asyncio.sleep(0.05)
            return type("Response", (), {"status": 200})()

        before = time.time()
        await slow_handler()
        elapsed = time.time() - before
        assert elapsed >= 0.05


class TestTrackExternalApi:
    @pytest.mark.asyncio
    async def test_tracks_successful_call(self):
        async with track_external_api("youtube"):
            pass  # simulates a successful API call

    @pytest.mark.asyncio
    async def test_tracks_failed_call(self):
        with pytest.raises(ConnectionError):
            async with track_external_api("gemini"):
                raise ConnectionError("API down")

    @pytest.mark.asyncio
    async def test_measures_external_duration(self):
        import asyncio

        async with track_external_api("cohere"):
            await asyncio.sleep(0.02)


class TestTrackJobDecorator:
    @pytest.mark.asyncio
    async def test_tracks_successful_job(self):
        @track_job("test_job")
        async def my_job():
            return {"status": "done"}

        result = await my_job()
        assert result == {"status": "done"}

    @pytest.mark.asyncio
    async def test_tracks_failed_job(self):
        @track_job("failing_job")
        async def my_job():
            raise RuntimeError("job failed")

        with pytest.raises(RuntimeError, match="job failed"):
            await my_job()


class TestRecordHelpers:
    def test_record_video_processed(self):
        record_video_processed("relevant")
        record_video_processed("irrelevant")
        record_video_processed("error")

    def test_record_creator_discovered(self):
        record_creator_discovered()


class TestMetricsExport:
    def test_get_metrics_returns_bytes(self):
        output = get_metrics()
        assert isinstance(output, bytes)
        assert b"python_info" in output

    def test_get_metrics_content_type(self):
        ct = get_metrics_content_type()
        assert "text/plain" in ct or "text/openmetrics" in ct

    def test_metrics_contain_custom_counters(self):
        record_video_processed("test_status")
        output = get_metrics()
        assert b"videos_processed_total" in output
        assert b"api_requests_total" in output
        assert b"external_api_calls_total" in output
        assert b"job_queue_depth" in output
