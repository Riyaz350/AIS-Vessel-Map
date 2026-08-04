import { useEffect, useRef, useState } from 'react';

import { io } from 'socket.io-client';



export function useVesselSocket() {

    const [vessels, setVessels] = useState({}); // keyed by mmsi 

    const socketRef = useRef(null);



    useEffect(() => {

        const socket = io(import.meta.env.VITE_API_URL);

        socketRef.current = socket;



        socket.on('vessel:snapshot', (list) => {

            const map = {};

            list.forEach((v) => { map[v.mmsi] = v; });

            setVessels(map);

        });



        socket.on('vessel:update', (vessel) => {

            setVessels((prev) => ({ ...prev, [vessel.mmsi]: vessel }));

        });



        return () => socket.disconnect();

    }, []);



    return Object.values(vessels);

} 