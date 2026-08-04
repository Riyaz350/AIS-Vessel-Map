const { AisDecode } = require('ggencoder');

// Multi-part messages (type 5, static/voyage data) arrive as two
// sentences sharing a sequence id. ggencoder needs a PLAIN OBJECT
// (not a Map) to hold in-progress fragments between calls, or it
// throws 'A session object is required...' on every such message.
const pendingParts = {};

function decodeSentence(rawLine) {
    try {
        const decoded = new AisDecode(rawLine, pendingParts);
        if (!decoded || !decoded.valid) return null;

        console.log(decoded);

        return {
            mmsi: decoded.mmsi,
            name: decoded.shipname ? decoded.shipname.trim() : undefined,
            lat: decoded.lat,
            lon: decoded.lon,
            sog: decoded.sog,          // Speed Over Ground (knots)
            cog: decoded.cog,          // Course Over Ground (degrees)
            heading: decoded.hdg,      // Heading (degrees)
            vesselType: decoded.cargo, // numeric AIS ship/cargo type code
            lastUpdated: new Date(),
        };
    } catch (err) {
        console.warn('[AIS] Failed to decode sentence:', rawLine, err);
        return null;
    }
}

module.exports = { decodeSentence };
