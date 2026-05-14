#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# 1. Build frontend
echo "==> Building frontend..."
cd "$ROOT/frontend"
npm install --silent
npm run build

# 2. Install backend deps if needed
echo "==> Starting backend on :8000..."
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  uv venv
  uv pip install -e . -q
fi

# 3. Start uvicorn (blocks; Ctrl-C to stop)
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
