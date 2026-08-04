require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./db');
const vesselRoutes = require('./routes/vessels');
const AisFeedConnection = require('./ais/connection');
const { decodeSentence } = require('./ais/decoder');
const { upsertVessel } = require('./services/vesselService');
const initSockets = require('./sockets');
 
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use('/api/vessels', vesselRoutes);
 
app.get('/health', (req, res) => res.json({ status: 'ok' }));
 
const server = http.createServer(app);
const io = initSockets(server);
 
async function start() {
  await connectDB(process.env.MONGO_URI);
 
  const feed = new AisFeedConnection({
    host: process.env.AIS_FEED_HOST,
    port: Number(process.env.AIS_FEED_PORT),
  });
 
  feed.on('sentence', async (line) => {
    const decoded = decodeSentence(line);
    if (!decoded) return;
    const vessel = await upsertVessel(decoded);
    if (vessel) io.emit('vessel:update', vessel);
  });
 
  feed.connect();
 
  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`[Server] Listening on ${port}`));
}
 
start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
