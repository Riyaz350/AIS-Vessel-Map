import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useVesselSocket } from '../hooks/useVesselSocket';
import VesselDrawer from './VesselDrawer';

const DEFAULT_CENTER = [1.29, 103.85];
const DEFAULT_ZOOM = 6;
const DEFAULT_COLOR = '#2563eb';   // normal ship color
const FOCUSED_COLOR = '#f97316';   // orange — the selected vessel

function createShipIcon(rotation = 0, color = DEFAULT_COLOR) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
         style="transform: rotate(${rotation}deg); transform-origin: center;">
      <path d="M12 2 L18 16 L12 13 L6 16 Z" fill="${color}" stroke="#1e3a8a" stroke-width="1"/>
    </svg>
  `;
  return L.divIcon({ html: svg, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
}

// Leaflet marker clicks don't bubble up to the map's own click event (they
// stop propagation internally), so this only fires for clicks on open water
// / land — exactly "clicked elsewhere" — never for clicks on a ship itself.
function MapClickDeselect({ onDeselect }) {
  useMapEvents({ click: () => onDeselect() });
  return null;
}

const VesselMap = forwardRef(function VesselMap(_props, ref) {
  const vessels = useVesselSocket();
  const [selectedMmsi, setSelectedMmsi] = useState(null);
  const mapRef = useRef(null);

  const selectedVessel = vessels.find((v) => v.mmsi === selectedMmsi) || null;

  useImperativeHandle(ref, () => ({
    focusVessel(identifier) {
      const target = vessels.find((v) =>
        identifier.mmsi ? v.mmsi === Number(identifier.mmsi) : v.imo === Number(identifier.imo)
      );
      if (!target) return { found: false };
      setSelectedMmsi(target.mmsi);
      if (mapRef.current) mapRef.current.flyTo([target.lat, target.lon], 10, { duration: 1.5 });
      return { found: true, vessel: target };
    },
    clearSelection() {
      setSelectedMmsi(null); // AI "clear_selection" reverts color the same way as any other deselect
    },
  }));

  return (
    <>
      <VesselDrawer vessel={selectedVessel} onClose={() => setSelectedMmsi(null)} />
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100vh', width: '100%' }} ref={mapRef}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickDeselect onDeselect={() => setSelectedMmsi(null)} />
        {vessels.map((v) => {
          const rotation = (v.heading != null && v.heading !== 511) ? v.heading : (v.cog ?? 0);
          const isFocused = v.mmsi === selectedMmsi;
          return (
            <Marker
              key={v.mmsi}
              position={[v.lat, v.lon]}
              icon={createShipIcon(rotation, isFocused ? FOCUSED_COLOR : DEFAULT_COLOR)}
              eventHandlers={{ click: () => setSelectedMmsi(v.mmsi) }}
            >
              <Tooltip direction="top" offset={[0, -12]}>
                <strong>{v.name || 'Unknown vessel'}</strong><br />
                MMSI: {v.mmsi}<br />
                {v.lat.toFixed(4)}, {v.lon.toFixed(4)}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
});

export default VesselMap;