import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.boatmarker';

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

        const marker = L.boatMarker(position, {
            color,
            idleCircle: true,
            iconSize: [10, 10],
        });

        marker.setHeading(heading || 0);

        Object.entries(eventHandlers).forEach(([event, handler]) => {
            marker.on(event, handler);
        });

        // Hover tooltip
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

    useEffect(() => {
        const marker = markerRef.current;

        if (!marker) return;

        marker.setLatLng(position);
        marker.setHeading(heading || 0);

    }, [position, heading]);

    return null;
}