#!/bin/bash
# Docker entrypoint script for Maatchaa backend
#
# Supports multiple run modes via API_MODE environment variable:
#   - api (default): Run the uvicorn API server
#   - worker: Run the ARQ job queue worker
#   - both: Run both API and legacy service worker (backwards compatible)

set -e

echo "=========================================="
echo "  MAATCHAA BACKEND"
echo "  Mode: ${API_MODE:-api}"
echo "=========================================="

case "${API_MODE:-api}" in
    "worker")
        echo "Starting ARQ Worker..."
        echo "Queue: maatchaa:jobs"
        echo "Redis: ${UPSTASH_REDIS_URL:-localhost:6379}"
        exec arq jobs.worker.WorkerSettings
        ;;

    "both")
        echo "Starting both API and legacy service worker..."
        # Start service worker in background
        python service_worker.py &
        # Start uvicorn in foreground
        exec uvicorn API:app --host 0.0.0.0 --port 8080
        ;;

    "api"|*)
        echo "Starting API Server..."
        echo "Port: 8080"
        exec uvicorn API:app --host 0.0.0.0 --port 8080
        ;;
esac
