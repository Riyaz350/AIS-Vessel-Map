import { useMemo } from 'react';

export default function VesselNameDropdown({ vessels, selectedMmsi, onSelect }) {
  const namedVessels = useMemo(() => {
    return vessels
      .filter((v) => v.name && v.name.trim().length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [vessels]);

  if (namedVessels.length === 0) return null;

  return (
    <div style={styles.wrapper}>
      <select
        style={styles.select}
        value={selectedMmsi != null ? String(selectedMmsi) : ''}
        onChange={(e) => {
          const value = e.target.value;
          if (!value) return;
          onSelect(Number(value)); // <option> values are always strings -- convert back explicitly
        }}
      >
        <option value="">Available Vessels ({namedVessels.length})</option>
        {namedVessels.map((v) => (
          <option key={v.mmsi} value={String(v.mmsi)}>
            {v.name} — MMSI {v.mmsi}
          </option>
        ))}
      </select>
    </div>
  );
}

const styles = {
  wrapper: { position: 'fixed', top: 16, right: 16, zIndex: 1000, fontFamily: 'system-ui, sans-serif' },
  select: {
    padding: '8px 10px', fontSize: 13, borderRadius: 8, border: '1px solid #d1d5db',
    background: '#ffffff', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', maxWidth: 260, cursor: 'pointer',
  },
};