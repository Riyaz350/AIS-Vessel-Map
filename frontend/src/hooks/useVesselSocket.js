import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { loadVesselCache, saveVesselCache } from '../lib/vesselCache';
import { isVesselFresh } from '../lib/vesselAge';

const MAX_VESSEL_AGE_MINUTES = 20;

export function useVesselSocket() {
  const [vessels, setVessels] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadVesselCache().then((cached) => {
      if (!cached || cancelled) return;
      // Prune on load too -- don't reintroduce vessels the cache saved
      // a while ago that are already past the freshness window.
      const pruned = Object.fromEntries(
        Object.entries(cached).filter(([, v]) => isVesselFresh(v.lastUpdated, MAX_VESSEL_AGE_MINUTES))
      );
      setVessels(pruned);
    });

    const socket = io(import.meta.env.API_URL);
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

    // Actually remove stale entries from state periodically -- this is
    // what stops the underlying object (and therefore every array built
    // from it) from growing forever, independent of any display filter.
    const pruneInterval = setInterval(() => {
      setVessels((prev) => {
        const now = Date.now();

        Object.entries(prev).forEach(([mmsi, v]) => {
          const ageMs = now - new Date(v.lastUpdated).getTime();
          const ageMinutes = ageMs / 60000;


        });

        const next = Object.fromEntries(
          Object.entries(prev).filter(([, v]) =>
            isVesselFresh(v.lastUpdated, MAX_VESSEL_AGE_MINUTES)
          )
        );

        console.log(
          '[PRUNE]',
          'before:',
          Object.keys(prev).length,
          'after:',
          Object.keys(next).length
        );

        if (Object.keys(next).length !== Object.keys(prev).length) {
          saveVesselCache(next, { force: true });
        }

        return next;
      });
    }, 60000);
    return () => {
      cancelled = true;
      clearInterval(pruneInterval);
      socket.disconnect();
    };
  }, []);

  return Object.values(vessels);
}