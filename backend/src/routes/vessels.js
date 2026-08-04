const express = require('express');
const Vessel = require('../models/Vessel');
 
const router = express.Router();
 
// GET /api/vessels — all current vessel positions
router.get('/', async (req, res) => {
  try {
    const vessels = await Vessel.find().sort({ lastUpdated: -1 });
    res.json(vessels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vessels' });
  }
});
 
// GET /api/vessels/:mmsi — a specific vessel
router.get('/:mmsi', async (req, res) => {
  try {
    const mmsi = Number(req.params.mmsi);
    if (Number.isNaN(mmsi)) {
      return res.status(400).json({ error: 'mmsi must be a number' });
    }
    const vessel = await Vessel.findOne({ mmsi });
    if (!vessel) {
      return res.status(404).json({ error: 'Vessel not found' });
    }
    res.json(vessel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vessel' });
  }
});
 
module.exports = router;
