# Development Scripts Guide

Quick scripts to manage all Maatchaa services.

## 🚀 Quick Start

```bash
# Start all services
./run.sh

# Check status
./status.sh

# Stop all services
./stop.sh
```

## Scripts Overview

### `./run.sh` - Start All Services

Starts all required services in parallel:
1. **Backend API** (uvicorn on port 8000)
2. **Shopify App** (shopify app dev)
3. **ngrok** (tunneling on port 8000)
4. **Frontend** (bun dev on port 3000)
5. **Background Worker** (creator discovery)

**Features:**
- ✅ Runs all services in background
- ✅ Color-coded output
- ✅ Logs to `./logs/` directory
- ✅ Graceful shutdown on Ctrl+C
- ✅ Shows all service URLs and PIDs

**Usage:**
```bash
./run.sh

# View logs while running
tail -f logs/backend.log
tail -f logs/frontend.log
tail -f logs/worker.log

# Stop with Ctrl+C
```

### `./status.sh` - Check Service Status

Shows which services are running:
```bash
./status.sh

# Output:
# ✅ Backend API: Running (PID: 12345)
# ✅ Frontend: Running (PID: 12346)
# ❌ Worker: Not running
```

### `./stop.sh` - Stop All Services

Stops all Maatchaa services:
```bash
./stop.sh

# Kills:
# - Backend API (uvicorn)
# - Shopify App
# - ngrok
# - Frontend (bun)
# - Worker (Python)
```

## Service URLs

When all services are running:

- 🔧 **Backend API**: http://localhost:8000
- ⚛️ **Frontend**: http://localhost:3000
- 🌐 **ngrok Dashboard**: http://localhost:4040
- 🛍️ **Shopify App**: Check logs for URL

## Logs

All logs are saved to `./logs/`:
- `backend.log` - Backend API logs
- `frontend.log` - Frontend dev server logs
- `worker.log` - Background worker logs
- `ngrok.log` - ngrok tunnel logs
- `shopify.log` - Shopify app logs

**View logs in real-time:**
```bash
# All logs
tail -f logs/*.log

# Specific service
tail -f logs/worker.log

# Follow multiple
tail -f logs/backend.log logs/frontend.log
```

## Troubleshooting

### Port Already in Use

If a port is already in use:
```bash
# Check what's using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or use stop script
./stop.sh
```

### Service Won't Start

1. Check logs: `cat logs/<service>.log`
2. Try stopping all: `./stop.sh`
3. Start again: `./run.sh`

### ngrok Not Working

Make sure ngrok is installed:
```bash
# Install ngrok
brew install ngrok

# Or download from https://ngrok.com
```

### Shopify App Skipped

If you see "maatchaa-oauth directory not found":
- This is normal if you haven't set up the Shopify app yet
- The other services will still run fine

## Development Workflow

**Typical workflow:**
```bash
# Morning: Start everything
./run.sh

# Check if everything is running
./status.sh

# Develop all day...
# (logs are being saved to ./logs/)

# View specific logs as needed
tail -f logs/worker.log

# Evening: Stop everything
./stop.sh
```

## Advanced Usage

### Start Individual Services

If you only need specific services:

```bash
# Backend only
cd backend && uvicorn API:app --reload

# Frontend only
cd frontend && bun run dev

# Worker only
cd backend && python background_worker.py

# ngrok only
ngrok http 8000
```

### Custom Ports

To change ports, edit `run.sh` and update:
- Backend: Change `--port 8000`
- Frontend: Change port in `frontend/package.json`
- ngrok: Change `ngrok http 8000` to desired port

## Tips

- 💡 Keep `./run.sh` running in a dedicated terminal
- 💡 Use `./status.sh` to quickly check what's running
- 💡 Check logs if something isn't working
- 💡 Always use `./stop.sh` or Ctrl+C to stop (not `kill -9`)

## Script Permissions

If scripts aren't executable:
```bash
chmod +x run.sh stop.sh status.sh
```
