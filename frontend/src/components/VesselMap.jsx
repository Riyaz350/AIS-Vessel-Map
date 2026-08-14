import {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { useVesselSocket } from "../hooks/useVesselSocket";
import VesselDrawer from "./VesselDrawer";
import { useCollisionRisks } from "../hooks/useCollisionRisks";
import { normalizeDigits } from "../lib/normalizeIdentifier";

const DEFAULT_CENTER = [30.0522, -118.2437];
const DEFAULT_ZOOM = 6;
const DEFAULT_COLOR = "#2563eb";
const FOCUSED_COLOR = "#16f9ee";

function createShipIcon(rotation = 0, color = DEFAULT_COLOR) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
         style="transform: rotate(${rotation}deg); transform-origin: center;">
      <path d="M12 2 L18 16 L12 13 L6 16 Z"
        fill="${color}"
        stroke="#1e3a8a"
        stroke-width="1"/>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

const shipIconCache = new Map();

function getShipIcon(rotation, color) {
  const key = `${Math.round(rotation)}|${color}`;

  let icon = shipIconCache.get(key);

  if (!icon) {
    icon = createShipIcon(rotation, color);
    shipIconCache.set(key, icon);
  }

  return icon;
}

function MapClickDeselect({ onDeselect }) {
  useMapEvents({
    click: () => onDeselect(),
  });

  return null;
}

const VesselMap = forwardRef(function VesselMap(_props, ref) {
  const vessels = useVesselSocket();

  const [selectedMmsi, setSelectedMmsi] = useState(null);

  const mapRef = useRef(null);

  /*
   * Only show vessels that have a valid name.
   *
   * This removes:
   * - undefined
   * - null
   * - empty string
   * - whitespace-only names
   */
  const namedVessels = useMemo(() => {
    return vessels.filter(
      (v) =>
        typeof v.name === "string" &&
        v.name.trim().length > 0
    );
  }, [vessels]);

  const selectedVessel =
    namedVessels.find(
      (v) => v.mmsi === selectedMmsi
    ) || null;

  useImperativeHandle(ref, () => ({
    focusVessel(identifier) {
      const rawId = identifier.mmsi ?? identifier.imo;
      const cleanId = normalizeDigits(rawId);

      console.debug("[focusVessel] looking for", {
        rawId,
        cleanId,
        type: identifier.mmsi ? "mmsi" : "imo",
      });

      if (!cleanId) {
        return { found: false };
      }

      const target = namedVessels.find((v) =>
        identifier.mmsi
          ? String(v.mmsi) === cleanId
          : String(v.imo) === cleanId
      );

      if (!target) {
        console.debug(
          "[focusVessel] named vessel not found"
        );

        return { found: false };
      }

      setSelectedMmsi(target.mmsi);

      if (mapRef.current) {
        mapRef.current.flyTo(
          [target.lat, target.lon],
          10,
          { duration: 1.5 }
        );
      }

      return {
        found: true,
        vessel: target,
      };
    },

    focusLocation(bounds) {
      if (mapRef.current && bounds) {
        mapRef.current.flyToBounds(bounds, {
          padding: [40, 40],
          duration: 1.5,
        });
      }
    },

    clearSelection() {
      setSelectedMmsi(null);
    },
  }));

  /*
   * Only calculate collision risks between named vessels.
   */
  const risks = useCollisionRisks(namedVessels, {
    thresholdNm: 1,
    maxLookaheadMinutes: 20,
  });

  const riskyMmsiSet = useMemo(() => {
    const set = new Set();

    risks.forEach((r) => {
      set.add(r.vesselA.mmsi);
      set.add(r.vesselB.mmsi);
    });

    return set;
  }, [risks]);

  const RISK_COLOR = "#dc2626";

  function colorFor(v, isFocused) {
    if (isFocused) return FOCUSED_COLOR;

    if (riskyMmsiSet.has(v.mmsi)) {
      return RISK_COLOR;
    }

    return DEFAULT_COLOR;
  }

  return (
    <>
      <VesselDrawer
        vessel={selectedVessel}
        onClose={() => setSelectedMmsi(null)}
      />

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{
          height: "100vh",
          width: "100%",
        }}
        ref={mapRef}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickDeselect
          onDeselect={() => setSelectedMmsi(null)}
        />

        {/* Collision risk lines */}
        {risks.map((r) => (
          <Polyline
            key={`${r.vesselA.mmsi}-${r.vesselB.mmsi}`}
            positions={[
              [r.vesselA.lat, r.vesselA.lon],
              [r.vesselB.lat, r.vesselB.lon],
            ]}
            pathOptions={{
              color: "#dc2626",
              weight: 2,
              dashArray: "6 6",
            }}
          />
        ))}

        {/* Only render named vessels */}
        {namedVessels.map((v) => {
          const rotation =
            v.heading != null && v.heading !== 511
              ? v.heading
              : (v.cog ?? 0);

          const isFocused =
            v.mmsi === selectedMmsi;

          return (
            <Marker
              key={v.mmsi}
              position={[v.lat, v.lon]}
              icon={getShipIcon(
                rotation,
                colorFor(v, isFocused)
              )}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  setSelectedMmsi(v.mmsi);
                },
              }}
            >
              <Tooltip
                direction="top"
                offset={[0, -12]}
              >
                <strong>
                  {v.name}
                </strong>

                <br />

                MMSI: {v.mmsi}

                <br />

                {v.lat.toFixed(4)},{" "}
                {v.lon.toFixed(4)}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
});

export default VesselMap;