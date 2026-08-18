const WebSocket = require("ws");

const nameCache = new Map();

let ws = null;
let reconnectTimer = null;

function connect(apiKey, onShipName) {
  if (!apiKey) {
    console.error(
      "[AISStream] Missing AISSTREAM_API_KEY - name lookups disabled.",
    );
    return;
  }

  console.log("[AISStream] Connecting name cache...");

  ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

  ws.on("open", () => {
    console.log("[AISStream] Connected (name cache)");

    ws.send(
      JSON.stringify({
        APIKey: apiKey,

        BoundingBoxes: [
          [
            [32.0, -119.5],
            [34.5, -117.0],
          ],
        ],

        FilterMessageTypes: ["ShipStaticData"],
      }),
    );
  });

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());


      if (msg.MessageType !== "ShipStaticData") {
        return;
      }

      const mmsi = msg.MetaData?.MMSI;

      const metaName = msg.MetaData?.ShipName?.trim();

      const staticName = msg.Message?.ShipStaticData?.Name?.trim();

      const name = metaName || staticName || null;


      if (!mmsi || !name) {
        console.log("[AISStream] Static message has no MMSI/name");
        return;
      }

      // Cache it
      nameCache.set(String(mmsi), name);


      // IMPORTANT:
      // Tell server to update MongoDB immediately.
      if (onShipName) {
        onShipName(mmsi, name);
      }
    } catch (err) {
      console.warn("[AISStream] Failed to parse message:", err.message);
    }
  });

  ws.on("error", (err) => {
    console.error("[AISStream] Error:", err.message);
  });

  ws.on("close", () => {
    console.warn("[AISStream] Closed. Reconnecting in 5000ms");

    ws = null;

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect(apiKey, onShipName);
    }, 5000);
  });
}

function getName(mmsi) {
  if (mmsi == null) {
    return null;
  }

  return nameCache.get(String(mmsi)) || null;
}

module.exports = {
  connect,
  getName,
};
