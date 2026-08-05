# AIS Vessel Map
 
Real-time vessel tracking web app that decodes a live AIS feed,
stores vessel positions in MongoDB, and displays them on an
interactive map with hover tooltips and live updates.
 
## Tech Stack
- Frontend: React (Vite) + Leaflet
- Backend: Node.js + Express + Socket.IO
- Database: MongoDB (Mongoose)
- AIS decoding: ggencoder
 
## Prerequisites
- Node.js 18+
- A MongoDB connection string (Atlas or local)
- AIS feed host/port (provided separately)
 
## Setup
 
### 1. Backend
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, AIS_FEED_HOST, AIS_FEED_PORT
npm run dev
 
### 2. Frontend
cd frontend
npm install
npm run dev
 
Open the printed local URL in your browser.
 
## Connecting to the AIS Feed
Set AIS_FEED_HOST, AIS_FEED_PORT and AIS_FEED_PROTOCOL in backend/.env
to the values provided for this assessment. The backend connects
automatically on startup and reconnects if the connection drops.
 
## API
- GET /api/vessels        — all current vessel positions
- GET /api/vessels/:mmsi  — a single vessel by MMSI
- WebSocket 'vessel:snapshot' / 'vessel:update' events for live data
 
## Architecture
See docs/ARCHITECTURE.md for schema, API design notes, and how
NMEA decoding is implemented.
