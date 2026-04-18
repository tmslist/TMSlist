'use client';

import { useRef, useEffect } from 'react';
import { useTMS } from './TMSContext';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

export function CoilHeatGauge() {
  const { state } = useTMS();
  const reducedMotion = useReducedMotion();
  const heatRef = useRef(0); // 0–100

  // Heat rises when firing, falls when stopped
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      if (state.isPlaying) {
        heatRef.current = Math.min(100, heatRef.current + 2);
      } else {
        heatRef.current = Math.max(0, heatRef.current - 1);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [state.isPlaying, reducedMotion]);

  const heat = heatRef.current;
  const tempC = Math.round(25 + heat * 0.55); // 25°C ambient to ~80°C max
  const color = heat < 40 ? '#22d3ee' : heat < 70 ? '#f97316' : '#ef4444';
  const label = heat < 30 ? 'Cool' : heat < 60 ? 'Warm' : heat < 80 ? 'Hot' : 'Very Hot';

  return (
    <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Coil Temp</span>
          <span className="text-[10px] font-mono font-bold" style={{ color }}>{tempC}°C</span>
        </div>
        {/* Heat bar */}
        <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${heat}%`, backgroundColor: color }}
          />
        </div>
      </div>
      <span className="text-[9px] font-semibold ml-auto" style={{ color }}>{label}</span>
    </div>
  );
}
