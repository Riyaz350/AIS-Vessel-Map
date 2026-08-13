const WebSocket = require('ws'); 

  

class AisStreamConnection { 

  constructor({ apiKey, onShipName, reconnectDelayMs = 5000 }) { 

    this.apiKey = apiKey; 

    this.onShipName = onShipName; 

    this.reconnectDelayMs = reconnectDelayMs; 

    this.ws = null; 

  } 

  

  connect() { 

    if (!this.apiKey) { 

      console.error('[AISStream] Missing AISSTREAM_API_KEY - skipping connection.'); 

      return; 

    } 

  

    this.ws = new WebSocket('wss://stream.aisstream.io/v0/stream'); 

  

    this.ws.on('open', () => { 

      console.log('[AISStream] Connected'); 

      this.ws.send(JSON.stringify({ 

        APIKey: this.apiKey, 

        BoundingBoxes: [[[-90, -180], [90, 180]]], 

        // No FilterMessageTypes here on purpose: MetaData.ShipName is 

        // present on every message type once aisstream's network has 

        // seen a ship's static data -- filtering to ShipStaticData 

        // only meant waiting for that one rare message type per ship. 

      })); 

    }); 

  

    this.ws.on('message', (raw) => { 

      try { 

        const msg = JSON.parse(raw.toString()); 

  

        // Uncomment while debugging to confirm data is flowing at all: 

        // console.log('[AISStream] message type:', msg.MessageType); 

  

        const mmsi = msg.MetaData?.MMSI; 

        const rawName = msg.MetaData?.ShipName; 

        const name = rawName ? rawName.trim() : ''; 

  

        if (mmsi && name) this.onShipName(mmsi, name); 

      } catch (err) { 

        console.warn('[AISStream] Failed to parse message:', err.message); 

      } 

    }); 

  

    this.ws.on('error', (err) => { 

      console.error('[AISStream] Error:', err.message); 

    }); 

  

    this.ws.on('close', (code, reason) => { 

      console.warn( 

        `[AISStream] Closed (code ${code}${reason ? ', ' + reason : ''}). ` + 

        `Reconnecting in ${this.reconnectDelayMs}ms` 

      ); 

      setTimeout(() => this.connect(), this.reconnectDelayMs); 

    }); 

  } 

} 

  

module.exports = AisStreamConnection; 