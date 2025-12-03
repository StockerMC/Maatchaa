#!/bin/bash
# Start the Creator Discovery Background Worker

cd "$(dirname "$0")"

echo "Starting Creator Discovery Worker..."
echo "Press Ctrl+C to stop"
echo ""

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run the worker
python3 background_worker.py
