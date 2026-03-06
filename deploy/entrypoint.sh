#!/bin/bash
set -e

# Start FastAPI backend in the background on port 8001
echo "🚀 Starting Velxio Backend..."
uvicorn app.main:app --host 127.0.0.1 --port 8001 &

# Wait for backend to be healthy (optional but good practice)
sleep 2

# Start Nginx in the foreground to keep the container running
echo "🌐 Starting Nginx Web Server on port 80..."
exec nginx -g "daemon off;"
