# AGENTS.md — AIS Vessel Map

## Overview
Real-time vessel tracking app: a Node/Express/Socket.IO backend decodes a live
AIS TCP feed, stores vessel positions in MongoDB, and streams updates to a
React/Vite/Leaflet frontend over WebSockets.

## Architecture
- **Frontend** (`frontend/`): Vite + React 19 + react-leaflet. Connects to the
  backend via Socket.IO using `import.meta.env.VITE_API_URL`. Port 5173 (mapped to host 3000).
- **Backend** (`backend/`): Express + Socket.IO + Mongoose. Listens on port 5000
  (mapped to host 8000). `nodemon` for live reload.
- **MongoDB**: compose service `mongo:7`, database `ais`.

## External services (user-provided)
- `AIS_FEED_HOST` / `AIS_FEED_PORT` — the live AIS TCP feed. The backend connects
  on startup and auto-reconnects. Without these, the backend boots but the map
  stays empty (the feed socket errors and retries every 1s — noisy but harmless).
- `AISSTREAM_API_KEY` — aisstream.io WebSocket key for ship-name enrichment.
  Optional; name lookups are silently disabled without it.

## Running
```
docker compose -f docker-compose.base44.yml up -d --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000 (health: GET /health)
- Vessels: GET /api/vessels

## Compose notes
- Both app services use `node:22` base images with source bind-mounted
  (no prebuilt app images) — edits hot-reload via nodemon / Vite HMR.
- `VITE_API_URL` and `CORS_ORIGIN` are derived from `BASE44_PUBLIC_HOST_SUFFIX`
  so the frontend can reach the backend across separate origins.
- Secret precedence: `.env.base44-defaults` (placeholders) → `/run/base44/app.env`
  (user secrets, always wins). User-supplied keys are NEVER in `environment:`.
