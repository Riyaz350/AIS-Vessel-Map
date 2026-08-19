import { useState } from 'react';
import { AGE_BUCKET_COLORS, AGE_BUCKET_LABELS } from '../lib/vesselAge';

const FOCUSED_COLOR = '#16f9ee';
const RISK_COLOR = '#dc2626';

export default function VesselLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div style={styles.wrapper}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={styles.toggleButton}
        aria-label="Toggle legend"
        title="What do the colors mean?"
      >
        {open ? '✕' : 'ⓘ Legend'}
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Vessel state</div>
          <Row color={FOCUSED_COLOR} label="Focused / selected" />
          {/* <Row color={RISK_COLOR} label="Collision risk" /> */}

          <div style={{ ...styles.sectionTitle, marginTop: 10 }}>Data age (no risk/focus)</div>
          <Row color={AGE_BUCKET_COLORS.fresh} label={`Fresh — ${AGE_BUCKET_LABELS.fresh}`} />
          <Row color={AGE_BUCKET_COLORS.recent} label={`Recent — ${AGE_BUCKET_LABELS.recent}`} />
          <Row color={AGE_BUCKET_COLORS.stale} label={`Stale — ${AGE_BUCKET_LABELS.stale}`} />
          <Row color={AGE_BUCKET_COLORS.very_stale} label={`Very stale — ${AGE_BUCKET_LABELS.very_stale}`} />
        </div>
      )}
    </div>
  );
}

function Row({ color, label }) {
  return (
    <div style={styles.row}>
      <span style={{ ...styles.swatch, background: color }} />
      <span>{label}</span>
    </div>
  );
}

const styles = {
  wrapper: { position: 'fixed', bottom: 20, right: 16, zIndex: 1000, fontFamily: 'system-ui, sans-serif' },
  toggleButton: {
    padding: '8px 12px', fontSize: 13, borderRadius: 8, border: '1px solid #d1d5db',
    background: '#ffffff', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', cursor: 'pointer',
  },
  panel: {
    position: 'absolute', bottom: 44, right: 0, width: 220, background: '#ffffff',
    borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.25)', padding: '12px 14px', fontSize: 13,
  },
  sectionTitle: { fontWeight: 700, fontSize: 12, color: '#374151', marginBottom: 6 },
  row: { display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', color: '#111827' },
  swatch: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' },
};