import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

function buildIcon(color) {
  return L.divIcon({
    className: 'boat-marker',
    html: `
      <svg class="boat-svg" width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <polygon points="15,2 27,27 15,22 3,27" fill="${color}" />
      </svg>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function applyRotation(marker, heading) {
  const svg = marker.getElement()?.querySelector('.boat-svg');
  if (svg) {
    svg.style.transform = `rotate(${heading || 0}deg)`;
    svg.style.transformOrigin = 'center';
  }
}

export default function BoatMarker({
  position,
  color = '#2563eb',
  heading = 0,
  eventHandlers = {},
  tooltipContent,
}) {
  const map = useMap();
  const markerRef = useRef(null);

  // Create the marker once, on mount -- position/rotation/color for
  // this initial creation only; all later updates are handled below.
  useEffect(() => {
    if (!map) return;

    const marker = L.marker(position, { icon: buildIcon(color) });
    applyRotation(marker, heading);

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      marker.on(event, handler);
    });

    if (tooltipContent) {
      marker.bindTooltip(tooltipContent, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95,
        sticky: false,
      });
    }

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Position and rotation update in place -- cheap, no icon rebuild needed.
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.setLatLng(position);
    applyRotation(marker, heading);
  }, [position, heading]);

  // Color changed (e.g. age bucket advanced, focus/risk state changed) --
  // this is the effect that was missing entirely. Rebuilds just the icon
  // in place, without tearing down and recreating the whole marker.
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.setIcon(buildIcon(color));
    applyRotation(marker, heading); // re-apply rotation -- setIcon() replaces the DOM element, resetting any inline style
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  return null;
}