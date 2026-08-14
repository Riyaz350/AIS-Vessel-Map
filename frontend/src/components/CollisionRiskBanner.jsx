import { useState } from "react";

export default function CollisionRiskBanner({
  risks,
  onSelectPair,
}) {
  const [closed, setClosed] = useState(false);

  if (risks.length === 0 || closed) return null;

  return (
    <div style={styles.banner}>
      <button
        onClick={() => setClosed(true)}
        style={styles.closeButton}
        aria-label="Close collision risk banner"
      >
        ×
      </button>

      <div style={styles.title}>
        ⚠ {risks.length} vessel
        {risks.length > 1 ? "s" : ""} on a
        collision course
      </div>

      {risks.slice(0, 4).map((r) => (
        <button
          key={`${r.vesselA.mmsi}-${r.vesselB.mmsi}`}
          onClick={() => onSelectPair(r)}
          style={styles.item}
        >
          {r.vesselA.name || r.vesselA.mmsi} ↔{" "}
          {r.vesselB.name || r.vesselB.mmsi}
          {" — "}CPA {r.cpaNm.toFixed(2)} nm in{" "}
          {Math.round(r.tcpaMinutes)} min
        </button>
      ))}
    </div>
  );
}

const styles = {
  banner: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
    padding: "10px 12px",
    width: 300,
    fontFamily: "system-ui, sans-serif",
  },

  closeButton: {
    position: "absolute",
    top: 5,
    right: 8,
    border: "none",
    background: "transparent",
    fontSize: 20,
    lineHeight: 1,
    color: "#6b7280",
    cursor: "pointer",
    padding: "2px 5px",
  },

  title: {
    fontSize: 13,
    fontWeight: 700,
    color: "#b91c1c",
    marginBottom: 6,
    paddingRight: 20,
  },

  item: {
    display: "block",
    width: "100%",
    textAlign: "left",
    fontSize: 12,
    color: "#111827",
    background: "none",
    border: "none",
    padding: "4px 0",
    cursor: "pointer",
  },
};