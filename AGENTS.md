# AGENTS.md — AIS Vessel Map

## Overview
Real-time vessel tracking app: a Node/Express/Socket.IO backend decodes a live
AIS TCP feed, stores vessel positions in MongoDB, and streams updates to a
React/Vite/Leaflet frontend over WebSockets.

## Architecture
- **Frontend** (`frontend/`): Vite + React 19 + react-leaflet. Connects to the
  backend via Socket.IO using `import.meta.env.VITE_API_URL`. Runs on port 5173.
- **Backend** (`backend/`): Express + Socket.IO + Mongoose. Listens on the port
  from `PORT` in `backend/.env`. `nodemon` for live reload.
- **MongoDB**: a MongoDB instance reachable via `MONGO_URI`.

## External services (user-provided)
- `AIS_FEED_HOST` / `AIS_FEED_PORT` — the live AIS TCP feed. The backend connects
  on startup and auto-reconnects. Without these, the backend boots but the map
  stays empty (the feed socket errors and retries every 1s — noisy but harmless).
- `AISSTREAM_API_KEY` — aisstream.io WebSocket key for ship-name enrichment.
  Optional; name lookups are silently disabled without it.

## Running locally
Backend (from `backend/`, with `.env` populated — see `.env.example`):
```
npm install
npm run dev
```

Frontend (from `frontend/`, with `.env` populated — see `VITE_API_URL` etc.):
```
npm install
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: whatever `PORT` is set to in `backend/.env`
