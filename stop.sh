#!/bin/bash

# Stop all Maatchaa services

echo "🛑 Stopping all Maatchaa services..."

# Kill services by process name
pkill -f "uvicorn API:app" && echo "✅ Stopped Backend API" || echo "⚠️  Backend API not running"
pkill -f "shopify app dev" && echo "✅ Stopped Shopify App" || echo "⚠️  Shopify App not running"
pkill -f "ngrok http" && echo "✅ Stopped ngrok" || echo "⚠️  ngrok not running"
pkill -f "bun run dev" && echo "✅ Stopped Frontend" || echo "⚠️  Frontend not running"
pkill -f "python.*background_worker.py" && echo "✅ Stopped Worker" || echo "⚠️  Worker not running"

echo ""
echo "✅ All services stopped"
