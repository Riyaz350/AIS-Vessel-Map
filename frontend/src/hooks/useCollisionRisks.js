import { useEffect, useRef, useState } from 'react';
import { findCollisionRisks } from '../lib/collisionRisk';

export function useCollisionRisks(vessels, options = {}, intervalMs = 5000) {
  const vesselsRef = useRef(vessels);
  useEffect(() => {
    vesselsRef.current = vessels;
  }, [vessels]);
  const [risks, setRisks] = useState([]);

  useEffect(() => {
    const recompute = () => setRisks(findCollisionRisks(vesselsRef.current, options));
    recompute();
    const id = setInterval(recompute, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return risks;
}