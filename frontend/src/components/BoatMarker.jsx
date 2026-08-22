import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function BoatMarker({
    position,
    color = '#2563eb',
    heading = 0,
    eventHandlers = {},
    tooltipContent,
}) {
    const map = useMap();
    const markerRef = useRef(null);

    useEffect(() => {
        if (!map) return;

        const icon = L.divIcon({
            className: 'boat-marker',
            html: `
                <svg
                    class="boat-svg"
                    width="30"
                    height="30"
                    viewBox="0 0 30 30"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <polygon
                        points="15,2 27,27 15,22 3,27"
                        fill="${color}"
                    />
                </svg>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
        });

        const marker = L.marker(position, {
            icon,
        });

        // Rotate the boat
        const svg = marker.getElement()?.querySelector('.boat-svg');

        if (svg) {
            svg.style.transform = `rotate(${heading}deg)`;
            svg.style.transformOrigin = 'center';
        }

        // Event handlers
        Object.entries(eventHandlers).forEach(([event, handler]) => {
            marker.on(event, handler);
        });

        // Tooltip
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
    }, [map]);

    // Update position and heading
    useEffect(() => {
        const marker = markerRef.current;

        if (!marker) return;

        marker.setLatLng(position);

        const svg = marker.getElement()?.querySelector('.boat-svg');

        if (svg) {
            svg.style.transform = `rotate(${heading || 0}deg)`;
            svg.style.transformOrigin = 'center';
        }
    }, [position, heading]);

    return null;
}