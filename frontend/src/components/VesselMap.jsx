import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useVesselSocket } from '../hooks/useVesselSocket';
import { useCollisionRisks } from '../hooks/useCollisionRisks';
import { normalizeDigits } from '../lib/normalizeIdentifier';
import VesselDrawer from './VesselDrawer';
import VesselNameDropdown from './VesselNameDropdown';
import CollisionRiskBanner from './CollisionRiskBanner';

const DEFAULT_CENTER = [30.0522, -118.2437];
const DEFAULT_ZOOM = 6;
const DEFAULT_COLOR = '#2563eb';
const FOCUSED_COLOR = '#16f9ee';
const RISK_COLOR = '#dc2626';

function createShipIcon(rotation = 0, color = DEFAULT_COLOR) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
         style="transform: rotate(${rotation}deg); transform-origin: center;">
      <path d="M12 2 L18 16 L12 13 L6 16 Z" fill="${color}" stroke="#1e3a8a" stroke-width="1"/>
    </svg>
  `;
  return L.divIcon({ html: svg, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
}

function MapClickDeselect({ onDeselect }) {
  useMapEvents({ click: () => onDeselect() });
  return null;
}

const VesselMap = forwardRef(function VesselMap(_props, ref) {
  const vessels = useVesselSocket();
  const [selectedMmsi, setSelectedMmsi] = useState(null);
  const mapRef = useRef(null);

  const risks = useCollisionRisks(vessels, { thresholdNm: 1, maxLookaheadMinutes: 20 });
  const riskyMmsiSet = new Set();
  risks.forEach((r) => { riskyMmsiSet.add(r.vesselA.mmsi); riskyMmsiSet.add(r.vesselB.mmsi); });

  const selectedVessel = vessels.find((v) => v.mmsi === selectedMmsi) || null;

  function colorFor(v, isFocused) {
    if (isFocused) return FOCUSED_COLOR;
    if (riskyMmsiSet.has(v.mmsi)) return RISK_COLOR;
    return DEFAULT_COLOR;
  }

  // This is the ONE function that both selects a vessel for the drawer
  // AND flies the map to it. Every entry point (marker click, dropdown
  // pick, AI focus) should call this exact function, so there's only
  // ever one place that decides what "focusing a vessel" means.
  function selectVesselAndFly(vessel) {
    if (!vessel) return;
    setSelectedMmsi(vessel.mmsi);
    if (mapRef.current) {
      mapRef.current.flyTo([vessel.lat, vessel.lon], 10, { duration: 1.5 });
    }
  }

  useImperativeHandle(ref, () => ({
    focusVessel(identifier) {
      let target = null;
      let matches = [];

      if (identifier.mmsi) {
        const cleanId = normalizeDigits(identifier.mmsi);
        target = vessels.find((v) => String(v.mmsi) === cleanId);
      } else if (identifier.imo) {
        const cleanId = normalizeDigits(identifier.imo);
        target = vessels.find((v) => String(v.imo) === cleanId);
      } else if (identifier.name) {
        const query = identifier.name.trim().toUpperCase();
        matches = vessels.filter((v) => v.name && v.name.toUpperCase().includes(query));
        if (matches.length === 1) target = matches[0];
      }

      if (!target) return { found: false, matches };
      selectVesselAndFly(target);
      return { found: true, vessel: target };
    },
    focusLocation(bounds) {
      if (mapRef.current && bounds) {
        mapRef.current.flyToBounds(bounds, { padding: [40, 40], duration: 1.5 });
      }
    },
    clearSelection() {
      setSelectedMmsi(null);
    },
  }));

  return (
    <>
      <VesselDrawer vessel={selectedVessel} onClose={() => setSelectedMmsi(null)} />

      <VesselNameDropdown
        vessels={vessels}
        selectedMmsi={selectedMmsi}
        onSelect={(mmsi) => {
          const target = vessels.find((v) => v.mmsi === mmsi);
          selectVesselAndFly(target);
        }}
      />

      <CollisionRiskBanner
        risks={risks}
        onSelectPair={(r) => selectVesselAndFly(r.vesselA)}
      />

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
              icon={createShipIcon(rotation, colorFor(v, isFocused))}
              eventHandlers={{ click: () => selectVesselAndFly(v) }}
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