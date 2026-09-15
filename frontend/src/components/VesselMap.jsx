import { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useVesselSocket } from '../hooks/useVesselSocket';
import { useCollisionRisks } from '../hooks/useCollisionRisks';
import { normalizeDigits } from '../lib/normalizeIdentifier';
import VesselDrawer from './VesselDrawer';
import VesselNameDropdown from './VesselNameDropdown';
import { getVesselAgeBucket, AGE_BUCKET_COLORS } from '../lib/vesselAge';
import VesselLegend from './VesselLegend';
import BoatMarker from './BoatMarker';   // ← our new wrapper
import { useAuth } from '../context/AuthContext';
import posthog from '../lib/posthog';
import * as Sentry from '@sentry/react';


const DEFAULT_CENTER = [30.0522, -118.2437];
const DEFAULT_ZOOM = 6;
const FOCUSED_COLOR = '#16f9ee';
const RISK_COLOR = '#2563eb';

function MapClickDeselect({ onDeselect }) {
  useMapEvents({ click: () => onDeselect() });
  return null;
}

const VesselMap = forwardRef(function VesselMap(_props, ref) {
  const vessels = useVesselSocket();
  const [selectedMmsi, setSelectedMmsi] = useState(null);
  const mapRef = useRef(null);
  const { requireAuth } = useAuth();

  const namedVessels = vessels.filter((v) => v.name && v.name.trim().length > 0);

  const risks = useCollisionRisks(namedVessels, { thresholdNm: 1, maxLookaheadMinutes: 20 });
  const riskyMmsiSet = new Set();
  risks.forEach((r) => {
    riskyMmsiSet.add(r.vesselA.mmsi);
    riskyMmsiSet.add(r.vesselB.mmsi);
  });

  const selectedVessel = namedVessels.find((v) => v.mmsi === selectedMmsi) || null;

  function colorFor(v, isFocused) {
    if (isFocused) return FOCUSED_COLOR;
    const bucket = getVesselAgeBucket(v.lastUpdated);
    return AGE_BUCKET_COLORS[bucket];
  }
  function selectVesselAndFly(vessel) {
    if (!vessel) return;
    requireAuth(() => {
      setSelectedMmsi(vessel.mmsi);
      if (mapRef.current) {
        mapRef.current.flyTo([vessel.lat, vessel.lon], 10, { duration: 1.5 });
      }
      posthog.capture('vessel_selected', { mmsi: vessel.mmsi, name: vessel.name });
    });
  }

  useImperativeHandle(ref, () => ({
    focusVessel(identifier) {
      let target = null;
      let matches = [];

      if (identifier.mmsi) {
        const cleanId = normalizeDigits(identifier.mmsi);
        target = namedVessels.find((v) => String(v.mmsi) === cleanId);
      } else if (identifier.imo) {
        const cleanId = normalizeDigits(identifier.imo);
        target = namedVessels.find((v) => String(v.imo) === cleanId);
      } else if (identifier.name) {
        const query = identifier.name.trim().toUpperCase();
        matches = namedVessels.filter((v) => v.name.toUpperCase().includes(query));
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

  function triggerSentryTestError() {
    try {
      throw new Error('Manual test error — VesselMap replay check');
    } catch (err) {
      Sentry.captureException(err, { tags: { source: 'manual-test' } });
    }
  }

  function triggerUncaughtTestError() {
    // Deliberately not wrapped in try/catch -- this exercises Sentry's
    // global window.onerror handler and the real crash -> replay path,
    // rather than a manually reported captureException call.
    throw new Error('Manual UNCAUGHT test error — VesselMap replay check');
  }

  const testErrorBtnStyle = {
    position: 'fixed',
    bottom: 16,
    left: 16,
    zIndex: 1000,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    borderRadius: 999,
    background: 'rgba(220, 38, 38, 0.08)',
    color: '#dc2626',
    cursor: 'pointer',
  };

  const uncaughtTestErrorBtnStyle = {
    ...testErrorBtnStyle,
    bottom: 56,
    background: '#dc2626',
    color: '#fff',
  };

  return (
    <>
      <VesselDrawer vessel={selectedVessel} onClose={() => setSelectedMmsi(null)} />

      {import.meta.env.DEV && (
        <button onClick={triggerSentryTestError} style={testErrorBtnStyle}>
          Trigger Sentry Test Error
        </button>
      )}

      <button onClick={triggerUncaughtTestError} style={uncaughtTestErrorBtnStyle}>
        Trigger Uncaught Test Error
      </button>

      <VesselNameDropdown
        vessels={namedVessels}
        selectedMmsi={selectedMmsi}
        onSelect={(mmsi) => {
          const target = namedVessels.find((v) => v.mmsi === mmsi);
          selectVesselAndFly(target);
        }}
      />
      <VesselLegend />

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100vh', width: '100%' }}
        ref={mapRef}
      >

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickDeselect onDeselect={() => setSelectedMmsi(null)} />

        {namedVessels.map((v) => {
          const rotation =
            v.heading != null && v.heading !== 511 ? v.heading : (v.cog ?? 0);
          const isFocused = v.mmsi === selectedMmsi;

          return (
            <BoatMarker
              key={v.mmsi}
              position={[v.lat, v.lon]}
              color={colorFor(v, isFocused)}
              heading={rotation}
              tooltipContent={`
    <div>
      <strong>${v.name || 'Unknown Vessel'}</strong><br />
      Lat: ${v.lat.toFixed(5)}<br />
      Lon: ${v.lon.toFixed(5)}<br />
      Heading: ${rotation}°
    </div>
  `}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  L.DomEvent.preventDefault(e);
                  selectVesselAndFly(v);
                },
              }}
            />
          );
        })}
      </MapContainer>
    </>
  );
});

export default VesselMap;