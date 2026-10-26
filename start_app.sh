#!/usr/bin/env bash
# Start the YouTube Downloader on macOS / Linux.
# Starts the backend in the background and the frontend in the foreground; Ctrl+C stops both.
set -euo pipefail

cd "$(dirname "$0")"
echo "Starting YouTube Downloader..."

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Please install Node.js 18 or newer from https://nodejs.org/"
  exit 1
fi

# On macOS / Linux yt-dlp runs on Python 3.9+
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is not installed. Please install Python 3.9 or newer."
  exit 1
fi

# Stop if another copy of the app (for example an older version) is still using the ports
node scripts/check-ports.js || exit 1

# Install server dependencies if missing (also after updating from a version that used yt-dlp-exec)
if [ ! -d server/node_modules/youtube-dl-exec ]; then
  echo "Installing server dependencies..."
  (cd server && npm install)
fi

if [ ! -d client/node_modules ]; then
  echo "Installing client dependencies..."
  (cd client && npm install)
fi

echo "Starting Backend Server..."
(cd server && node index.js) &
BACKEND_PID=$!
trap 'kill "$BACKEND_PID" 2>/dev/null || true' EXIT INT TERM

# Wait a moment for the backend to initialize
sleep 2

echo "Starting Frontend Client (press Ctrl+C to stop)..."
cd client
# --strictPort: fail instead of silently using another port
npm run dev -- --open --strictPort
