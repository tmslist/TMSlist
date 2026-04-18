'use client';

import { useEffect, useRef, useState } from 'react';
import { useTMS } from './TMSContext';

export function PulseRateMeter() {
  const { state } = useTMS();
  const [pulseRate, setPulseRate] = useState(0);
  const recentTimesRef = useRef<number[]>([]);

  // Track recent pulse timestamps to compute pulses/sec
  useEffect(() => {
    if (state.pulseCount > 0) {
      const now = performance.now();
      recentTimesRef.current.push(now);
      // Keep only last 2 seconds
      recentTimesRef.current = recentTimesRef.current.filter(t => now - t < 2000);
      const rate = recentTimesRef.current.length > 1
        ? Math.round(recentTimesRef.current.length / 2 * 10) / 10
        : state.frequency;
      setPulseRate(rate);
    } else {
      recentTimesRef.current = [];
      setPulseRate(0);
    }
  }, [state.pulseCount]);

  const rate = state.isPlaying ? state.frequency : pulseRate;
  const displayRate = Math.min(rate, 50);

  // Arc color based on rate
  const getArcColor = () => {
    if (displayRate >= 30) return '#ef4444';
    if (displayRate >= 10) return '#f59e0b';
    return '#22d3ee';
  };

  // SVG circle parameters
  const size = 80;
  const cx = size / 2;
  const cy = size / 2;
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const maxRate = 50;
  const progress = Math.min(displayRate / maxRate, 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Pulse Rate</div>

      <div className="flex items-center gap-3">
        {/* SVG gauge */}
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Track */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="#1e293b"
              strokeWidth="5"
            />
            {/* Tick marks */}
            {[0, 10, 20, 30, 40, 50].map(v => {
              const angle = (v / maxRate) * 270 - 135;
              const rad = (angle * Math.PI) / 180;
              const x1 = cx + (r - 6) * Math.cos(rad);
              const y1 = cy + (r - 6) * Math.sin(rad);
              const x2 = cx + (r + 2) * Math.cos(rad);
              const y2 = cy + (r + 2) * Math.sin(rad);
              return (
                <line
                  key={v}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#334155" strokeWidth="1.5" strokeLinecap="round"
                />
              );
            })}
            {/* Progress arc */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={getArcColor()}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-135 ${cx} ${cy})`}
              style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
            />
            {/* Center text */}
            <text x={cx} y={cy - 3} textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="bold" fontFamily="monospace">
              {displayRate.toFixed(1)}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="sans-serif">
              Hz
            </text>
          </svg>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Pulses/sec</span>
            <span className={`text-[11px] font-mono font-bold ${state.isPlaying ? 'text-cyan-400' : 'text-slate-500'}`}>
              {state.isPlaying ? '● LIVE' : '○ STOPPED'}
            </span>
          </div>

          {/* Min/max labels */}
          <div className="flex justify-between text-[8px] text-slate-600">
            <span>0 Hz</span>
            <span>50 Hz</span>
          </div>

          {/* Rate label */}
          <div className={`text-[10px] font-semibold ${displayRate >= 30 ? 'text-red-400' : displayRate >= 10 ? 'text-amber-400' : 'text-cyan-400'}`}>
            {displayRate >= 30 ? 'High frequency' : displayRate >= 10 ? 'Standard rTMS' : displayRate > 0 ? 'Low frequency' : 'Idle'}
          </div>
        </div>
      </div>
    </div>
  );
}
