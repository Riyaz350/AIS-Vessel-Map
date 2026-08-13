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
const { upsertVessel, updateVesselName } = require("./services/vesselService");
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());
app.use("/api/vessels", vesselRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

const server = http.createServer(app);
const io = initSockets(server);

async function start() {
  await connectDB(process.env.MONGO_URI);

  const feed = new AisFeedConnection({
    host: process.env.AIS_FEED_HOST,
    port: Number(process.env.AIS_FEED_PORT),
  });

  feed.on("sentence", async (line) => {
    const decoded = decodeSentence(line);
    if (!decoded) return;
    const vessel = await upsertVessel(decoded);
    if (vessel) io.emit("vessel:update", vessel);
  });

  feed.connect();
  const aisStream = new AisStreamConnection({
    apiKey: process.env.AISSTREAM_API_KEY,
    onShipName: async (mmsi, name) => {
      console.log(
        `[Server] Received vessel name update | MMSI: ${mmsi} | Name: "${name}"`,
      );

      try {
        const vessel = await updateVesselName(mmsi, name);

        if (vessel) {
          console.log(
            `[Server] Vessel name updated successfully | MMSI: ${mmsi} | Name: "${vessel.name}"`,
          );

          io.emit("vessel:update", vessel);
        } else {
          console.warn(
            `[Server] Could not update vessel | MMSI: ${mmsi} | Name: "${name}"`,
          );
        }
      } catch (err) {
        console.error(
          `[Server] Failed to update vessel name | MMSI: ${mmsi} | Name: "${name}"`,
          err,
        );
      }
    },
  });
  aisStream.connect();
  const port = process.env.PORT || 5000;
  server.listen(port, () => console.log(`[Server] Listening on ${port}`));
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
