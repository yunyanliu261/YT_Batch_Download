#!/usr/bin/env bash
# Start YouTube Downloader on macOS / Linux: builds the web page, starts the server and opens
# http://localhost:3000 in the browser. Press Ctrl+C here, or "Quit" on the page, to stop it.
# Set BROWSER=none to skip opening the browser.
set -euo pipefail

cd "$(dirname "$0")"
URL="http://localhost:3000"

open_page() {
  if [ "${BROWSER:-}" = "none" ]; then return; fi
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then open "$URL"
  else echo "Open $URL in your browser."
  fi
}

echo "Starting YouTube Downloader..."

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Please install Node.js 22 or newer from https://nodejs.org/"
  exit 1
fi

# On macOS / Linux yt-dlp runs on Python 3.9+
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is not installed. Please install Python 3.9 or newer."
  exit 1
fi

# yt-dlp needs Node.js 22+ for downloads with cookies (members-only / age-restricted videos)
if ! node -e "process.exit(Number(process.versions.node.split('.')[0]) < 22 ? 1 : 0)"; then
  echo "[!] Node.js 22 or newer is recommended (current: $(node --version)). Downloads with cookies"
  echo "    (members-only / age-restricted videos) need it. Update from https://nodejs.org/. Public videos still work."
fi

# Already running: just open the page. Port used by something else: explain and stop.
set +e
node scripts/check-ports.js
port_status=$?
set -e
if [ "$port_status" -eq 2 ]; then
  open_page
  exit 0
elif [ "$port_status" -ne 0 ]; then
  exit 1
fi

# Install server dependencies if missing (also after updating from a version that used yt-dlp-exec)
if [ ! -d server/node_modules/youtube-dl-exec ]; then
  echo "Installing server dependencies..."
  (cd server && npm install)
fi

if [ ! -d client/node_modules ]; then
  echo "Installing client dependencies..."
  (cd client && npm install)
fi

# Build the web page every time, so it always matches the current code (takes a few seconds)
echo "Building the page..."
(cd client && npm run build)

(cd server && exec node index.js) &
SERVER_PID=$!
# The server stops downloads in progress when it gets SIGTERM
trap 'kill "$SERVER_PID" 2>/dev/null || true' INT TERM

if ! node scripts/wait-for-server.js; then
  kill "$SERVER_PID" 2>/dev/null || true
  exit 1
fi

open_page
echo "YouTube Downloader is running at $URL (press Ctrl+C or \"Quit\" on the page to stop)."
wait "$SERVER_PID" || true
