import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { loadVesselCache, saveVesselCache } from '../lib/vesselCache';

export function useVesselSocket() {
  const [vessels, setVessels] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    // Load cached vessels first, async, so the map has something to show
    // immediately -- but guard against setting state after unmount, and
    // don't let a slow cache read delay the socket connection at all.
    loadVesselCache().then((cached) => {
      if (cached && !cancelled) setVessels(cached);
    });

    const socket = io(import.meta.env.VITE_API_URL);
    socketRef.current = socket;

    socket.on('vessel:snapshot', (list) => {
      const map = {};
      list.forEach((v) => { map[v.mmsi] = v; });
      setVessels(map);
      saveVesselCache(map, { force: true });
    });

    socket.on('vessel:update', (vessel) => {
      setVessels((prev) => {
        const next = { ...prev, [vessel.mmsi]: vessel };
        saveVesselCache(next);
        return next;
      });
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, []);

  return Object.values(vessels);
}