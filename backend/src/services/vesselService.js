const Vessel = require("../models/Vessel");

async function upsertVessel(data) {
  if (!data.mmsi || data.lat == null || data.lon == null) return null;

  const update = { lat: data.lat, lon: data.lon, lastUpdated: new Date() };
  if (data.name) update.name = data.name;
  if (data.imo) update.imo = data.imo;
  if (data.sog != null) update.sog = data.sog;
  if (data.cog != null) update.cog = data.cog;
  if (data.heading != null) update.heading = data.heading;
  if (data.vesselType != null) update.vesselType = data.vesselType;

  return Vessel.findOneAndUpdate(
    { mmsi: data.mmsi },
    { $set: update },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}
async function updateVesselName(mmsi, name) {
  return Vessel.findOneAndUpdate(
    { mmsi },
    { $set: { name } },
    { upsert: false, returnDocument: 'after' } // only patch vessels Portvision already reported
  );
}
module.exports = { upsertVessel, updateVesselName };
