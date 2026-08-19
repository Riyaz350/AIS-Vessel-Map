import { getVesselAgeBucket, AGE_BUCKET_COLORS, AGE_BUCKET_LABELS, formatVesselAge } from '../lib/vesselAge';

const VESSEL_TYPE_LABELS = {
  30: "Fishing vessel",
  31: "Towing vessel",
  35: "Military vessel",
  36: "Sailing vessel",
  37: "Pleasure craft",
  52: "Tug",
  60: "Passenger ship",
  70: "Cargo ship",
  80: "Tanker",
};

function describeVesselType(code) {
  if (code == null) return "Unknown";
  if (VESSEL_TYPE_LABELS[code]) return VESSEL_TYPE_LABELS[code];
  if (code >= 60 && code < 70) return "Passenger ship";
  if (code >= 70 && code < 80) return "Cargo ship";
  if (code >= 80 && code < 90) return "Tanker";
  return `Type ${code}`;
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <span style={styles.value}>{value ?? "—"}</span>
    </div>
  );
}

export default function VesselDrawer({ vessel, onClose }) {
  const isOpen = !!vessel;

  // Moved inside the component -- `vessel` only exists as a prop here,
  // not at module scope. Also recomputed on every render, which is what
  // we want: it should reflect however old the data is right now.
  const ageBucket = vessel ? getVesselAgeBucket(vessel.lastUpdated) : null;

  return (
    <div
      style={{
        ...styles.drawer,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
      }}
    >
      {vessel && (
        <>
          <div style={{ ...styles.header, marginTop: "80px" }}>
            <h2 style={styles.title}>{vessel.name || "Unknown vessel"}</h2>
            <button onClick={onClose} style={styles.closeBtn} aria-label="Close">
              ×
            </button>
          </div>

          <div style={styles.body}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#fff",
                background: AGE_BUCKET_COLORS[ageBucket],
                borderRadius: 12,
                padding: "3px 10px",
                marginBottom: 12,
              }}
            >
              ● {AGE_BUCKET_LABELS[ageBucket]} old ({formatVesselAge(vessel.lastUpdated)})
            </div>

            <Row label="MMSI" value={vessel.mmsi} />
            <Row label="Latitude" value={vessel.lat?.toFixed(5)} />
            <Row label="Longitude" value={vessel.lon?.toFixed(5)} />
            <Row label="Speed Over Ground" value={vessel.sog != null ? `${vessel.sog} kn` : null} />
            <Row label="Course Over Ground" value={vessel.cog != null ? `${vessel.cog}°` : null} />
            <Row
              label="Heading"
              value={vessel.heading != null && vessel.heading !== 511 ? `${vessel.heading}°` : "Not available"}
            />
            <Row label="Vessel Type" value={describeVesselType(vessel.vesselType)} />
            <Row
              label="Last Updated"
              value={vessel.lastUpdated ? new Date(vessel.lastUpdated).toLocaleTimeString() : null}
            />
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  drawer: {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    width: "320px",
    background: "#ffffff",
    boxShadow: "2px 0 12px rgba(0,0,0,0.25)",
    zIndex: 1000,
    transition: "transform 0.25s ease-out",
    display: "flex",
    flexDirection: "column",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
  },
  title: { margin: 0, fontSize: "18px", color: "#1f2937" },
  closeBtn: {
    border: "none",
    background: "none",
    fontSize: "24px",
    lineHeight: 1,
    cursor: "pointer",
    color: "#6b7280",
  },
  body: { padding: "16px 20px", overflowY: "auto" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "14px",
  },
  label: { color: "#6b7280" },
  value: { color: "#111827", fontWeight: 600 },
};