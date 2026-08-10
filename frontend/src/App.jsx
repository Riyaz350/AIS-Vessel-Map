import { useRef } from 'react'; 

import VesselMap from './components/VesselMap'; 

import AICommandBar from './components/AICommandBar'; 

  

export default function App() { 

  const vesselMapRef = useRef(null); 

  

  return ( 

    <> 

      <VesselMap ref={vesselMapRef} /> 

      <AICommandBar vesselMapRef={vesselMapRef} /> 

    </> 

  ); 

} 