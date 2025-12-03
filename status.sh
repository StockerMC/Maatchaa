#!/bin/bash

# Check status of all Maatchaa services

echo "📊 Maatchaa Services Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_service() {
    local name=$1
    local process=$2
    local pid=$(pgrep -f "$process" | head -n 1)

    if [ -n "$pid" ]; then
        echo "✅ $name: Running (PID: $pid)"
    else
        echo "❌ $name: Not running"
    fi
}

check_service "Backend API     " "uvicorn API:app"
check_service "Shopify App     " "shopify app dev"
check_service "ngrok           " "ngrok http"
check_service "Frontend        " "bun run dev"
check_service "Worker          " "python.*background_worker.py"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Service URLs:"
echo "   • Backend API: http://localhost:8000"
echo "   • Frontend:    http://localhost:3000"
echo "   • ngrok:       http://localhost:4040"
echo ""
