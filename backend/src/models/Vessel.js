const mongoose = require('mongoose');
 
const vesselSchema = new mongoose.Schema(
  {
    mmsi: { type: Number, required: true, unique: true, index: true },
    name: { type: String, default: null },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    sog: { type: Number, default: null },
    cog: { type: Number, default: null },
    heading: { type: Number, default: null },
    vesselType: { type: Number, default: null },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
 
module.exports = mongoose.model('Vessel', vesselSchema);
