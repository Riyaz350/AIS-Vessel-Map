const NM_PER_DEG_LAT = 60;
const toRad = (deg) => (deg * Math.PI) / 180;

// Converts vessel B's position into nautical-mile x/y offsets relative to
// vessel A, using a flat-earth approximation — accurate enough for vessels
// within the tens-of-miles range this feature cares about.
function relativePositionNm(a, b) {
  const avgLatRad = toRad((a.lat + b.lat) / 2);
  const nmPerDegLon = NM_PER_DEG_LAT * Math.cos(avgLatRad);
  return {
    x: (b.lon - a.lon) * nmPerDegLon, // east-west, nm
    y: (b.lat - a.lat) * NM_PER_DEG_LAT, // north-south, nm
  };
}

// COG is degrees clockwise from true north — convert to an (east, north)
// velocity vector in knots.
function velocityVector(v) {
  const rad = toRad(v.cog ?? 0);
  return { x: (v.sog ?? 0) * Math.sin(rad), y: (v.sog ?? 0) * Math.cos(rad) };
}

// Standard CPA/TCPA calculation: given two vessels' current position and
// velocity, find the time (hours) and distance (nm) of closest approach,
// assuming both hold their current speed and course.
export function computeCPA(a, b) {
  if (a.sog == null || b.sog == null || a.cog == null || b.cog == null) return null;

  const relPos = relativePositionNm(a, b);
  const va = velocityVector(a);
  const vb = velocityVector(b);
  const relVel = { x: vb.x - va.x, y: vb.y - va.y };

  const vv = relVel.x * relVel.x + relVel.y * relVel.y;
  if (vv < 1e-6) {
    // Same speed & course — the distance between them will never change.
    return { cpaNm: Math.hypot(relPos.x, relPos.y), tcpaHours: 0 };
  }

  const pv = relPos.x * relVel.x + relPos.y * relVel.y;
  const tcpaHours = -pv / vv;
  if (tcpaHours < 0) return null; // closest approach was in the past — already separating

  const cpaX = relPos.x + relVel.x * tcpaHours;
  const cpaY = relPos.y + relVel.y * tcpaHours;
  return { cpaNm: Math.hypot(cpaX, cpaY), tcpaHours };
}

// Scans all vessel pairs and returns those on a collision-risk course:
// closer than thresholdNm at their closest point, within the next
// maxLookaheadMinutes.
export function findCollisionRisks(vessels, { thresholdNm = 1, maxLookaheadMinutes = 20 } = {}) {
  const moving = vessels.filter((v) => (v.sog ?? 0) > 0.5); // ignore anchored/stationary ships
  const risks = [];

  for (let i = 0; i < moving.length; i++) {
    for (let j = i + 1; j < moving.length; j++) {
      const result = computeCPA(moving[i], moving[j]);
      if (!result) continue;
      const tcpaMinutes = result.tcpaHours * 60;
      if (result.cpaNm <= thresholdNm && tcpaMinutes <= maxLookaheadMinutes) {
        risks.push({ vesselA: moving[i], vesselB: moving[j], cpaNm: result.cpaNm, tcpaMinutes });
      }
    }
  }
  return risks.sort((a, b) => a.tcpaMinutes - b.tcpaMinutes);
}