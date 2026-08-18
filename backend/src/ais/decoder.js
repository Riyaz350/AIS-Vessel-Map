const { AisDecode } = require("ggencoder");
const aisNameCache = require("./aisNameCache");
const { updateVesselName } = require("../services/vesselService");

const pendingParts = {};

function decodeSentence(rawLine) {
  try {
    const decoded = new AisDecode(rawLine, pendingParts);

    if (!decoded || !decoded.valid) {
      return null;
    }

    /*
     * Portvision AIS name
     */
    const portvisionName = decoded.shipname
      ? decoded.shipname.trim()
      : undefined;

    /*
     * If Portvision provides a valid vessel name,
     * immediately update MongoDB using the MMSI.
     */
    if (portvisionName && decoded.mmsi) {
       

      updateVesselName(decoded.mmsi, portvisionName)
        .catch((err) => {
          console.error(
            `[DECODER] Failed to update vessel name | MMSI=${decoded.mmsi}`,
            err
          );
        });
    }

    /*
     * Check AISStream name cache if Portvision
     * does not provide a name.
     */
    const cachedName = decoded.mmsi
      ? aisNameCache.getName(decoded.mmsi)
      : undefined;

    

    /*
     * Prefer Portvision name.
     * Fall back to AISStream cached name.
     */
    const shipName =
      portvisionName ||
      cachedName ||
      undefined;

    /*
     * MMSI and position are required.
     * Name is optional.
     */
    if (
      !decoded.mmsi ||
      decoded.lat == null ||
      decoded.lon == null
    ) {
      return null;
    }

    return {
      mmsi: decoded.mmsi,

      imo: decoded.imo || undefined,

      name: shipName,

      lat: decoded.lat,
      lon: decoded.lon,

      sog: decoded.sog,
      cog: decoded.cog,
      heading: decoded.hdg,

      vesselType: decoded.cargo,

      lastUpdated: new Date(),
    };

  } catch (err) {
    console.warn(
      "[AIS] Failed to decode sentence:",
      rawLine,
      err
    );

    return null;
  }
}

module.exports = {
  decodeSentence,
};