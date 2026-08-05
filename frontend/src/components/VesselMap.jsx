import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useVesselSocket } from '../hooks/useVesselSocket';
import VesselDrawer from './VesselDrawer';

const DEFAULT_CENTER = [34.0522, -118.2437];
const DEFAULT_ZOOM = 6;

function createShipIcon(rotation = 0, color = '#2563eb') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
         style="transform: rotate(${rotation}deg); transform-origin: center;">
      <path d="M12 2 L18 16 L12 13 L6 16 Z" fill="${color}" stroke="#1e3a8a" stroke-width="1"/>
    </svg>
  `;
  return L.divIcon({ html: svg, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
}

export default function VesselMap() {
  const vessels = useVesselSocket();
  const [selectedMmsi, setSelectedMmsi] = useState(null);

  // Look the selected vessel up fresh from the live array every render,
  // rather than storing a snapshot in state — this way the drawer's data
  // keeps updating live too, exactly like the markers do.
  const selectedVessel = vessels.find((v) => v.mmsi === selectedMmsi) || null;

  return (
    <>
      <VesselDrawer vessel={selectedVessel} onClose={() => setSelectedMmsi(null)} />

      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100vh', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vessels.map((v) => {
          const rotation = (v.heading != null && v.heading !== 511) ? v.heading : (v.cog ?? 0);
          return (
            <Marker
              key={v.mmsi}
              position={[v.lat, v.lon]}
              icon={createShipIcon(rotation)}
              eventHandlers={{
                click: () => setSelectedMmsi(v.mmsi),
              }}
            >
              <Tooltip direction="top" offset={[0, -12]}>
                <strong>{v.name || 'Unknown vessel'}</strong>
                <br />
                MMSI: {v.mmsi}
                <br />
                {v.lat.toFixed(4)}, {v.lon.toFixed(4)}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}