'use client';

import { useMemo } from 'react';
import { useTMS } from './TMSContext';

function getEFieldContextLabel(vpm: number): { label: string; color: string } {
  if (vpm < 20) return { label: 'Subthreshold', color: 'text-blue-400' };
  if (vpm < 40) return { label: 'Low therapeutic', color: 'text-cyan-400' };
  if (vpm < 60) return { label: 'Therapeutic range', color: 'text-emerald-400' };
  if (vpm < 80) return { label: 'Optimal', color: 'text-yellow-400' };
  return { label: 'High intensity', color: 'text-red-400' };
}

function getEFieldColor(vpm: number): string {
  if (vpm < 20) return '#3b82f6';
  if (vpm < 40) return '#22d3ee';
  if (vpm < 60) return '#22c55e';
  if (vpm < 80) return '#f59e0b';
  return '#ef4444';
}

export function EFieldGauge() {
  const { state } = useTMS();

  // Estimate E-field V/m from intensity and coil distance
  const eFieldVpm = useMemo(() => {
    // Simplified model: intensity * depth_factor * 0.65 V/m per %MT
    const baseIntensity = state.intensity;
    const depthPenalty = 1 - (state.coilDepth * 0.4);
    const anglePenalty = 1 - (state.coilAngle / 90) * 0.25;
    const estimated = baseIntensity * depthPenalty * anglePenalty * 0.55;
    return Math.round(Math.min(estimated, 100));
  }, [state.intensity, state.coilDepth, state.coilAngle]);

  const context = getEFieldContextLabel(eFieldVpm);
  const color = getEFieldColor(eFieldVpm);
  const size = 80;
  const cx = size / 2;
  const cy = size / 2;
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const maxVpm = 100;
  const progress = Math.min(eFieldVpm / maxVpm, 1);
  const dashOffset = circumference * (1 - progress);

  // Gradient stops for the arc
  const gradientId = 'efield-gradient';

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">E-Field Strength</div>

      <div className="flex items-center gap-3">
        {/* SVG gauge */}
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="30%" stopColor="#22d3ee" />
                <stop offset="55%" stopColor="#22c55e" />
                <stop offset="75%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
            {/* Progress arc */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-135 ${cx} ${cy})`}
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
            {/* Center text */}
            <text x={cx} y={cy - 3} textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="monospace">
              {eFieldVpm}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="sans-serif">
              V/m
            </text>
          </svg>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Intensity</span>
            <span className={`text-[11px] font-mono font-bold ${context.color}`}>
              {context.label}
            </span>
          </div>

          {/* Scale labels */}
          <div className="flex justify-between text-[8px] text-slate-600">
            <span>0</span>
            <span>50</span>
            <span>100 V/m</span>
          </div>

          {/* Coil depth + angle context */}
          <div className="text-[9px] text-slate-500">
            <span className="text-slate-400">Depth: </span>{state.coilDepth.toFixed(2)}
            <span className="ml-2 text-slate-400">Angle: </span>{state.coilAngle.toFixed(0)}°
          </div>
        </div>
      </div>

      {/* Intensity bar */}
      <div className="mt-3">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #3b82f6, #22d3ee, #22c55e, #f59e0b, #ef4444)' }} />
        <div className="relative -mt-1.5">
          <div
            className="absolute top-0 w-1.5 h-3 bg-white rounded-full shadow"
            style={{
              left: `calc(${progress * 100}% - 3px)`,
              transition: 'left 0.4s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
}
