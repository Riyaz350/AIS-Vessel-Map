require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./db");
const vesselRoutes = require("./routes/vessels");
const AisFeedConnection = require("./ais/connection");
const { decodeSentence } = require("./ais/decoder");
const initSockets = require("./sockets");
const AisStreamConnection = require("./ais/aisstream");
const aisNameCache = require("./ais/aisNameCache");
const { upsertVessel, updateVesselName } = require("./services/vesselService");
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught exception:", err);
  // Deliberately not calling process.exit() here -- log and keep running,
  // since a hard crash on every transient network hiccup is worse than
  // staying up in a slightly imperfect state for something this small.
});
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use("/api/vessels", vesselRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const server = http.createServer(app);
const io = initSockets(server);

async function start() {
  await connectDB(process.env.MONGO_URI);

  console.log("[Server] Database connected");

  aisNameCache.connect(process.env.AISSTREAM_API_KEY, async (mmsi, name) => {
    try {
      console.log(`[Server] AISStream name received: ${mmsi} -> ${name}`);

      const vessel = await updateVesselName(mmsi, name);

      if (vessel) {
        console.log(`[Server] MongoDB updated: ${mmsi} -> ${vessel.name}`);

        io.emit("vessel:update", vessel);
      }
    } catch (err) {
      console.error("[Server] Failed to update vessel name:", err);
    }
  });

  const feed = new AisFeedConnection({
    host: process.env.AIS_FEED_HOST,
    port: Number(process.env.AIS_FEED_PORT),
  });

  feed.on("sentence", async (line) => {
    const decoded = decodeSentence(line);

    if (!decoded) return;

    decoded?.name && console.log(`This ${decoded?.mmsi} has a name`, decoded?.name);
    // console.log(decoded);
    const vessel = await upsertVessel(decoded);

    if (vessel) {
      io.emit("vessel:update", vessel);
    }
  });
  const port = process.env.PORT || 5000;

  server.listen(port, () => {
    console.log(`[Server] Listening on port ${port}`);
  });
  feed.connect();

  // ...
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
