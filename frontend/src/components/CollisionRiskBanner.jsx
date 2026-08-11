export default function CollisionRiskBanner({ risks, onSelectPair }) {
  if (risks.length === 0) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.title}>⚠ {risks.length} vessel{risks.length > 1 ? 's' : ''} on a collision course</div>
      {risks.slice(0, 4).map((r) => (
        <button
          key={`${r.vesselA.mmsi}-${r.vesselB.mmsi}`}
          onClick={() => onSelectPair(r)}
          style={styles.item}
        >
          {(r.vesselA.name || r.vesselA.mmsi)} ↔ {(r.vesselB.name || r.vesselB.mmsi)}
          {' — '}CPA {r.cpaNm.toFixed(2)} nm in {Math.round(r.tcpaMinutes)} min
        </button>
      ))}
    </div>
  );
}

const styles = {
  banner: {
    position: 'fixed', top: 16, right: 16, zIndex: 1000, background: '#fff',
    borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.25)', padding: '10px 12px',
    width: 300, fontFamily: 'system-ui, sans-serif',
  },
  title: { fontSize: 13, fontWeight: 700, color: '#b91c1c', marginBottom: 6 },
  item: {
    display: 'block', width: '100%', textAlign: 'left', fontSize: 12, color: '#111827',
    background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer',
  },
};