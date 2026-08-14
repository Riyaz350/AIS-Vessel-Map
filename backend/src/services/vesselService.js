const Vessel = require("../models/Vessel");

/*
 * Create or update vessel position/data.
 *
 * This does NOT update the vessel name.
 * Vessel names coming from Portvision are handled
 * separately by updateVesselName().
 */
async function upsertVessel(data) {
  if (
    !data.mmsi ||
    data.lat == null ||
    data.lon == null
  ) {
    return null;
  }

  const update = {
    lat: data.lat,
    lon: data.lon,
    lastUpdated: new Date(),
  };

  if (data.imo) {
    update.imo = data.imo;
  }

  if (data.sog != null) {
    update.sog = data.sog;
  }

  if (data.cog != null) {
    update.cog = data.cog;
  }

  if (data.heading != null) {
    update.heading = data.heading;
  }

  if (data.vesselType != null) {
    update.vesselType = data.vesselType;
  }

  

  const vessel = await Vessel.findOneAndUpdate(
    {
      mmsi: data.mmsi,
    },
    {
      $set: update,
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  return vessel;
}


/*
 * Update vessel name.
 *
 * This is called directly from decoder.js when
 * Portvision provides a valid vessel name.
 */
async function updateVesselName(mmsi, name) {
  if (!mmsi || !name) {
    return null;
  }

  const cleanName = String(name).trim();

  if (!cleanName) {
    return null;
  }

  /*
   * First find the existing vessel.
   *
   * We don't want to create a vessel here because
   * position data should be handled by upsertVessel().
   */
  const existingVessel = await Vessel.findOne({
    mmsi,
  });

  /*
   * Vessel doesn't exist yet.
   *
   * upsertVessel() will create it when the position
   * message is processed.
   */
  if (!existingVessel) {
    console.log(
      `[DB] Name update skipped - vessel not found | MMSI=${mmsi} | NAME=${cleanName}`
    );

    return null;
  }

  /*
   * Don't perform another MongoDB update if the
   * vessel already has the same name.
   */
  if (existingVessel.name === cleanName) {
    return existingVessel;
  }

   

  const vessel = await Vessel.findOneAndUpdate(
    {
      mmsi,
    },
    {
      $set: {
        name: cleanName,
      },
    },
    {
      upsert: false,
      returnDocument: "after",
    }
  );

  if (vessel) {
    console.log(
      `[DB] Vessel name updated | MMSI=${mmsi} | NAME=${vessel.name}`
    );
  }

  return vessel;
}


module.exports = {
  upsertVessel,
  updateVesselName,
};