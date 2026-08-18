# AIS Vessel Map

A real-time vessel tracking web app that decodes a live AIS feed, stores vessel positions in MongoDB, and displays them on an interactive map with hover tooltips and live updates.

## Recorded Demo
Here's the recorded demo of this project [Live Demo](https://youtu.be/xm1mToCxIGY?si=RX6_X7uSNMJ9makW)
## 🔗 Links

- **Live Demo:** [AIS Vessel Map](https://ais-vessel-map-tawny.vercel.app/)
- **API:** [AIS Vessel Map API](https://ais-vessel-map-npdx.onrender.com/)


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

## Task Recording

A video recording demonstrating the completed AIS Vessel Map task is available here:

[Watch the AIS Vessel Map Task Recording](https://shiptrackscom-my.sharepoint.com/:v:/g/personal/riyaz_ahmed_carga_com/IQDhdUg0P2yLR57h6mznVISYAQsZUD7jh75ta0791YacGpc?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=UtJoWC)
 
## Architecture
See docs/ARCHITECTURE.md for schema, API design notes, and how
NMEA decoding is implemented.
