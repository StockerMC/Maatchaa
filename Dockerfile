# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code into the container
COPY backend/ .

# Expose the port the app runs on
EXPOSE 8080

# ============================================================================
# MULTI-MODE SUPPORT
# ============================================================================
# This Dockerfile supports multiple run modes via the API_MODE environment variable:
#
#   API_MODE=api (default)    - Run the API server (uvicorn)
#   API_MODE=worker           - Run the ARQ job worker
#   API_MODE=both             - Run both API and legacy service worker
#
# For Cloud Run, deploy two services:
#   1. API service: API_MODE=api (or unset)
#   2. Worker service: API_MODE=worker
# ============================================================================

# Environment variable to control which process runs
ENV API_MODE=api

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Use the entrypoint script to switch between API and Worker
ENTRYPOINT ["/docker-entrypoint.sh"]
