#!/bin/bash

# Maatchaa Development Runner
# Runs all services in parallel: Backend API, Shopify App, ngrok, Frontend, Worker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Service names
BACKEND_NAME="Backend API"
SHOPIFY_NAME="Shopify App"
NGROK_NAME="ngrok"
FRONTEND_NAME="Frontend"
WORKER_NAME="Worker"

# PID tracking
PIDS=()

# Cleanup function
cleanup() {
    echo -e "\n${RED}🛑 Shutting down all services...${NC}"

    # Kill all background processes
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done

    # Kill any remaining processes
    pkill -f "uvicorn API:app" 2>/dev/null || true
    pkill -f "shopify app dev" 2>/dev/null || true
    pkill -f "ngrok http" 2>/dev/null || true
    pkill -f "bun run dev" 2>/dev/null || true
    pkill -f "python.*background_worker.py" 2>/dev/null || true

    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up trap to cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║            🚀 MAATCHAA DEV RUNNER 🚀              ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# 1. Start Backend API (uvicorn)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 Starting ${BACKEND_NAME}...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd backend
uvicorn API:app --reload --port 8000 --host 0.0.0.0 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)
echo -e "${GREEN}✅ ${BACKEND_NAME} started (PID: $BACKEND_PID)${NC}"
echo -e "${YELLOW}   📝 Logs: logs/backend.log${NC}"
echo -e "${YELLOW}   🌐 URL: http://localhost:8000${NC}\n"
cd ..

# 2. Start Shopify App
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}🛍️  Starting ${SHOPIFY_NAME}...${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ -d "maatchaa-oauth" ]; then
    cd maatchaa-oauth
    shopify app dev > ../logs/shopify.log 2>&1 &
    SHOPIFY_PID=$!
    PIDS+=($SHOPIFY_PID)
    echo -e "${GREEN}✅ ${SHOPIFY_NAME} started (PID: $SHOPIFY_PID)${NC}"
    echo -e "${YELLOW}   📝 Logs: logs/shopify.log${NC}\n"
    cd ..
else
    echo -e "${YELLOW}⚠️  maatchaa-oauth directory not found, skipping Shopify app${NC}\n"
fi

# 3. Start ngrok
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🌐 Starting ${NGROK_NAME}...${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
ngrok http 8000 > logs/ngrok.log 2>&1 &
NGROK_PID=$!
PIDS+=($NGROK_PID)
echo -e "${GREEN}✅ ${NGROK_NAME} started (PID: $NGROK_PID)${NC}"
echo -e "${YELLOW}   📝 Logs: logs/ngrok.log${NC}"
echo -e "${YELLOW}   🌐 Dashboard: http://localhost:4040${NC}\n"

# 4. Start Frontend
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}⚛️  Starting ${FRONTEND_NAME}...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd frontend
bun run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)
echo -e "${GREEN}✅ ${FRONTEND_NAME} started (PID: $FRONTEND_PID)${NC}"
echo -e "${YELLOW}   📝 Logs: logs/frontend.log${NC}"
echo -e "${YELLOW}   🌐 URL: http://localhost:3000${NC}\n"
cd ..

# 5. Start Background Worker
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚙️  Starting ${WORKER_NAME}...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
cd backend
python3 background_worker.py > ../logs/worker.log 2>&1 &
WORKER_PID=$!
PIDS+=($WORKER_PID)
echo -e "${GREEN}✅ ${WORKER_NAME} started (PID: $WORKER_PID)${NC}"
echo -e "${YELLOW}   📝 Logs: logs/worker.log${NC}\n"
cd ..

# Wait a moment for services to start
sleep 3

# Summary
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}✨ All services started successfully!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${GREEN}📋 Service Status:${NC}"
echo -e "   ${BLUE}• ${BACKEND_NAME}:${NC}  http://localhost:8000 (PID: $BACKEND_PID)"
echo -e "   ${MAGENTA}• ${SHOPIFY_NAME}:${NC}  Check logs/shopify.log"
echo -e "   ${CYAN}• ${NGROK_NAME}:${NC}      http://localhost:4040 (PID: $NGROK_PID)"
echo -e "   ${GREEN}• ${FRONTEND_NAME}:${NC}  http://localhost:3000 (PID: $FRONTEND_PID)"
echo -e "   ${YELLOW}• ${WORKER_NAME}:${NC}    Running (PID: $WORKER_PID)"

echo -e "\n${YELLOW}📝 Logs directory: ./logs/${NC}"
echo -e "${YELLOW}   • tail -f logs/backend.log${NC}"
echo -e "${YELLOW}   • tail -f logs/frontend.log${NC}"
echo -e "${YELLOW}   • tail -f logs/worker.log${NC}"
echo -e "${YELLOW}   • tail -f logs/ngrok.log${NC}"

echo -e "\n${RED}Press Ctrl+C to stop all services${NC}\n"

# Wait for all processes
wait
