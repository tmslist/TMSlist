'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTMS } from '../TMSViewer/TMSContext';
import { protocols } from '../../../data/tmsProtocols';

// ---- Types ----

interface DepthLayer {
  id: 'superficial' | 'intermediate' | 'deep';
  label: string;
  depth: number; // cm from surface
  color: string;
  opacity: number;
}

interface StatItem {
  label: string;
  value: string;
  sublabel?: string;
  color: string;
}

// ---- Constants ----

const WIDTH = 420;
const HEIGHT = 280;
const PAD_X = 32;
const PAD_Y = 20;

const PROTOCOL_COLORS: Record<string, string> = {
  'Standard rTMS': '#22d3ee',
  'Theta Burst (iTBS)': '#a78bfa',
  'Deep TMS (BrainsWay)': '#f97316',
  'Low-Frequency (1Hz)': '#fbbf24',
};

const LAYERS: DepthLayer[] = [
  { id: 'superficial', label: 'Superficial (1 cm)', depth: 1, color: '#3b82f6', opacity: 0.55 },
  { id: 'intermediate', label: 'Intermediate (2 cm)', depth: 2, color: '#22c55e', opacity: 0.45 },
  { id: 'deep', label: 'Deep (3 cm)', depth: 3, color: '#ef4444', opacity: 0.35 },
];

// Brain outline path for a coronal cross-section (simplified SVG path)
function brainOutlinePath(): string {
  // Coronal section — left hemisphere shown, symmetrical implicitly
  // Coordinates relative to chart area
  const cx = WIDTH / 2;
  const cy = PAD_Y + 60;

  return [
    // Main brain silhouette (coronal-ish shape)
    `M ${cx - 148} ${cy + 70}`,
    // Temporal lobe bottom
    'C ' + [
      (cx - 148), cy + 100,
      (cx - 120), cy + 118,
      (cx - 85), cy + 115,
    ].join(' '),
    // Lateral sulcus indent
    'C ' + [
      (cx - 60), cy + 112,
      (cx - 40), cy + 95,
      (cx - 30), cy + 80,
    ].join(' '),
    // Parietal lobe
    'C ' + [
      (cx - 15), cy + 60,
      (cx + 10), cy + 40,
      (cx + 40), cy + 25,
    ].join(' '),
    // Frontal pole
    'C ' + [
      (cx + 70), cy + 15,
      (cx + 100), cy + 20,
      (cx + 120), cy + 35,
    ].join(' '),
    // Superior frontal gyrus
    'C ' + [
      (cx + 130), cy + 50,
      (cx + 135), cy + 70,
      (cx + 130), cy + 90,
    ].join(' '),
    // Orbital surface
    'C ' + [
      (cx + 120), cy + 110,
      (cx + 100), cy + 118,
      (cx + 75), cy + 115,
    ].join(' '),
    // Right temporal
    'C ' + [
      (cx + 55), cy + 110,
      (cx + 35), cy + 95,
      (cx + 25), cy + 80,
    ].join(' '),
    // Central sulcus / parietal
    'C ' + [
      (cx + 15), cy + 60,
      (cx - 10), cy + 40,
      (cx - 40), cy + 28,
    ].join(' '),
    // Back of brain
    'C ' + [
      (cx - 70), cy + 18,
      (cx - 105), cy + 22,
      (cx - 130), cy + 40,
    ].join(' '),
    // Occipital
    'C ' + [
      (cx - 145), cy + 55,
      (cx - 152), cy + 70,
      (cx - 148), cy + 70,
    ].join(' '),
    'Z',
  ].join(' ');
}

// Activation heatmap gradient stops for a given intensity (0–1)
function activationStops(intensity: number): string {
  const i = Math.min(Math.max(intensity, 0), 1);
  // blue → cyan → green → yellow → red
  if (i < 0.25) {
    const t = i / 0.25;
    const r = Math.round(30 + t * (0 - 30));
    const g = Math.round(64 + t * (211 - 64));
    const b = Math.round(246 + t * (238 - 246));
    return `rgba(${r},${g},${b},0.7)`;
  } else if (i < 0.5) {
    const t = (i - 0.25) / 0.25;
    const r = Math.round(0 + t * (34 - 0));
    const g = Math.round(211 + t * (197 - 211));
    const b = Math.round(238 + t * (133 - 238));
    return `rgba(${r},${g},${b},0.7)`;
  } else if (i < 0.75) {
    const t = (i - 0.5) / 0.25;
    const r = Math.round(34 + t * (234 - 34));
    const g = Math.round(197 + t * (179 - 197));
    const b = Math.round(133 + t * (0 - 133));
    return `rgba(${r},${g},${b},0.7)`;
  } else {
    const t = (i - 0.75) / 0.25;
    const r = Math.round(234 + t * (239 - 234));
    const g = Math.round(179 + t * (68 - 179));
    const b = Math.round(0 + t * (68 - 0));
    return `rgba(${r},${g},${b},0.75)`;
  }
}

// ---- Sparkline component ----

interface SparklineProps {
  data: number[];
  width: number;
  height: number;
  color: string;
  label: string;
  sublabel: string;
}

function Sparkline({ data, width, height, color, label, sublabel }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const areaPoints = [
    `0,${height}`,
    ...points,
    `${width},${height}`,
  ];

  const gradientId = `sparkGrad_${label.replace(/\s/g, '')}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-[9px] font-mono text-slate-500">{sublabel}</span>
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={areaPoints.join(' ')}
          fill={`url(#${gradientId})`}
        />
        {/* Line */}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* End dot */}
        <circle
          cx={width}
          cy={parseFloat(points[points.length - 1].split(',')[1])}
          r={2.5}
          fill={color}
        />
      </svg>
    </div>
  );
}

// ---- Protocol mini-bar chart ----

interface MiniBarProps {
  name: string;
  spread: number; // 0–1 activation spread
  depth: number;   // 0–1 depth penetration
  color: string;
  selected: boolean;
}

function MiniBar({ name, spread, depth, color, selected }: MiniBarProps) {
  return (
    <div className={`flex items-center gap-2 py-1 ${selected ? 'opacity-100' : 'opacity-60'}`}>
      <div className="w-20 text-[8px] font-medium text-slate-300 truncate" title={name}>{name}</div>
      {/* Spread bar */}
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${spread * 100}%`, backgroundColor: color }}
        />
      </div>
      {/* Depth indicator */}
      <div className="w-10 flex items-center justify-end gap-0.5">
        {[0.3, 0.6, 1.0].map((d, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-sm transition-all duration-300"
            style={{
              backgroundColor: depth >= d ? color : 'rgba(51,65,85,0.4)',
              opacity: depth >= d ? 0.9 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---- Main component ----

export function CorticalActivationMap() {
  const { state } = useTMS();
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(['superficial', 'intermediate', 'deep'])
  );
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const toggleLayer = useCallback((id: string) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id); // keep at least one
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Derived values
  const { spreadFactor, peakStrength, fieldStrength, penetrationDepth, focalityIndex } = useMemo(() => {
    const freqNorm = Math.min(state.frequency / 50, 1);
    const intNorm = Math.min(state.intensity / 140, 1);
    const depthNorm = 1 - state.coilDepth; // 0 = deep, 1 = superficial

    // Activation spread increases with frequency
    const spread = 0.3 + freqNorm * 0.5 + intNorm * 0.2;
    // Peak activation strength
    const peak = intNorm * 0.9 + freqNorm * 0.1;
    // Field strength at cortical surface (V/m)
    const field = Math.round(40 + intNorm * 80 + freqNorm * 20);
    // Penetration depth
    const depth = 1.0 + intNorm * 1.5 + (1 - state.coilDepth) * 0.8;
    // Focality: ratio of surface vs deep activation
    const focality = depthNorm > 0.5
      ? (1.5 + intNorm).toFixed(1)
      : (0.8 + intNorm * 0.5).toFixed(1);

    return {
      spreadFactor: Math.min(spread, 1),
      peakStrength: peak,
      fieldStrength: field,
      penetrationDepth: Math.round(depth * 10) / 10,
      focalityIndex: parseFloat(focality),
    };
  }, [state.frequency, state.intensity, state.coilDepth]);

  // Neuron activation count
  const neuronCount = useMemo(() => {
    const durationMin = 20; // typical session
    const totalPulses = state.frequency * 60 * durationMin;
    const activated = Math.round(totalPulses * (state.intensity / 140) * spreadFactor * 0.6);
    return activated.toLocaleString();
  }, [state.frequency, state.intensity, spreadFactor]);

  // Protocol comparison data
  const protocolData = useMemo(() => {
    return protocols.slice(0, 4).map(p => ({
      name: p.name,
      spread: Math.min(0.3 + (p.frequencyHz / 50) * 0.4 + (p.intensityPct / 140) * 0.3, 1),
      depth: Math.min(0.4 + (p.intensityPct / 140) * 0.6, 1),
      color: PROTOCOL_COLORS[p.name] ?? '#94a3b8',
      selected: state.selectedProtocol?.name === p.name,
    }));
  }, [state.selectedProtocol]);

  // 6-week treatment sparkline data (36 sessions, ~5 sessions/week)
  const sparkData = useMemo(() => {
    const sessions = 36;
    const data: number[] = [];
    let acc = 0;
    for (let i = 0; i < sessions; i++) {
      // Build-up effect: stronger early sessions, plateau later
      const sessionEffect = 5 + 20 * (1 - Math.exp(-i / 8)) + (Math.random() - 0.5) * 4;
      acc += sessionEffect;
      data.push(Math.round(acc));
    }
    return data;
  }, []);

  // Activation layer ellipses — positions shift with parameters
  const layerEllipses = useMemo(() => {
    const cx = WIDTH / 2;
    const baseY = PAD_Y + 70;
    const spreadX = 60 + spreadFactor * 40;
    const spreadY = 30 + spreadFactor * 20;

    return LAYERS.map((layer, i) => ({
      ...layer,
      cx,
      cy: baseY + i * 4,
      rx: spreadX + i * 12,
      ry: spreadY + i * 8,
    }));
  }, [spreadFactor]);

  // Stats
  const stats: StatItem[] = [
    {
      label: '~47,000',
      value: 'neurons/session',
      sublabel: `calc: ${neuronCount}`,
      color: 'text-cyan-400',
    },
    {
      label: `${fieldStrength} V/m`,
      value: 'field strength',
      color: 'text-emerald-400',
    },
    {
      label: `${penetrationDepth} cm`,
      value: 'penetration',
      color: 'text-violet-400',
    },
    {
      label: `${focalityIndex}`,
      value: 'focality',
      color: 'text-amber-400',
    },
  ];

  // Color legend stops
  const legendStops = [
    { color: '#1d4ed8', label: 'Weak' },
    { color: '#22d3ee', label: 'Low' },
    { color: '#22c55e', label: 'Therapeutic' },
    { color: '#eab308', label: 'Strong' },
    { color: '#ef4444', label: 'Peak' },
  ];

  const isPlaying = state.isPlaying;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
            <svg className="w-3 h-3 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
            </svg>
          </div>
          <span className="text-[11px] font-bold text-slate-200">Cortical Activation Map</span>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] text-cyan-400 font-medium">LIVE</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
        {/* Brain SVG */}
        <div className="glass-panel rounded-xl p-3 overflow-hidden">
          {/* Layer toggles */}
          <div className="flex items-center gap-2 mb-2">
            {LAYERS.map(layer => (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                onMouseEnter={() => setHoveredLayer(layer.id)}
                onMouseLeave={() => setHoveredLayer(null)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-medium transition-all duration-200 ${
                  visibleLayers.has(layer.id)
                    ? 'border-slate-600 bg-slate-800/60 text-slate-200'
                    : 'border-slate-700/40 bg-slate-900/30 text-slate-600'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{
                    backgroundColor: visibleLayers.has(layer.id) ? layer.color : 'transparent',
                    border: `1px solid ${layer.color}`,
                    opacity: visibleLayers.has(layer.id) ? 1 : 0.4,
                  }}
                />
                {layer.label}
              </button>
            ))}
            <span className="ml-auto text-[8px] text-slate-600">Coronal Cross-Section</span>
          </div>

          {/* Brain visualization */}
          <svg
            width="100%"
            viewBox={`0 0 ${WIDTH} ${HEIGHT - 20}`}
            style={{ display: 'block', maxHeight: '220px' }}
          >
            <defs>
              {/* Brain shape clip */}
              <clipPath id="brainClip">
                <path d={brainOutlinePath()} />
              </clipPath>

              {/* Heatmap gradient */}
              <radialGradient id="activationGradient" cx="50%" cy="45%" r="55%">
                <stop offset="0%" stopColor={activationStops(peakStrength)} stopOpacity={0.9} />
                <stop offset="40%" stopColor={activationStops(spreadFactor * 0.7)} stopOpacity={0.65} />
                <stop offset="70%" stopColor={activationStops(spreadFactor * 0.4)} stopOpacity={0.4} />
                <stop offset="100%" stopColor="#1e3a5f" stopOpacity={0.1} />
              </radialGradient>

              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Brain outline gradient */}
              <linearGradient id="brainBorder" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>

            {/* Background */}
            <rect x={PAD_X} y={PAD_Y} width={WIDTH - PAD_X * 2} height={HEIGHT - PAD_Y - 20}
              fill="#0a1628" rx={6} />

            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(pct => (
              <line
                key={pct}
                x1={PAD_X + 4}
                y1={PAD_Y + (HEIGHT - PAD_Y - 20) * pct}
                x2={WIDTH - PAD_X - 4}
                y2={PAD_Y + (HEIGHT - PAD_Y - 20) * pct}
                stroke="rgba(71,85,105,0.3)"
                strokeWidth={0.5}
                strokeDasharray="2,4"
              />
            ))}

            {/* Brain outline — filled with subtle color */}
            <path
              d={brainOutlinePath()}
              fill="#1a2744"
              stroke="url(#brainBorder)"
              strokeWidth={1.5}
            />

            {/* Activation layers (clipped to brain) */}
            <g clipPath="url(#brainClip)">
              {layerEllipses.map(ell => {
                if (!visibleLayers.has(ell.id)) return null;
                const isHovered = hoveredLayer === ell.id;
                return (
                  <ellipse
                    key={ell.id}
                    cx={ell.cx}
                    cy={ell.cy}
                    rx={ell.rx}
                    ry={ell.ry}
                    fill={activationStops(
                      isHovered ? Math.min(peakStrength + 0.15, 1) : peakStrength - (LAYERS.findIndex(l => l.id === ell.id) ?? 0) * 0.12
                    )}
                    opacity={isHovered ? ell.opacity + 0.15 : ell.opacity}
                    filter={isHovered ? 'url(#glow)' : undefined}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                );
              })}

              {/* Focal hotspot at center */}
              <ellipse
                cx={WIDTH / 2}
                cy={PAD_Y + 72}
                rx={spreadFactor * 28 + 8}
                ry={spreadFactor * 18 + 6}
                fill="url(#activationGradient)"
                filter="url(#glow)"
                opacity={0.8}
                style={{ transition: 'all 0.4s ease' }}
              />
            </g>

            {/* Brain outline again on top */}
            <path
              d={brainOutlinePath()}
              fill="none"
              stroke="#334155"
              strokeWidth={1.5}
            />

            {/* Region labels */}
            <text x={WIDTH / 2 - 80} y={PAD_Y + 40} fill="rgba(148,163,184,0.4)" fontSize={7} fontFamily="monospace">
              Frontal
            </text>
            <text x={WIDTH / 2 + 55} y={PAD_Y + 45} fill="rgba(148,163,184,0.4)" fontSize={7} fontFamily="monospace">
              Parietal
            </text>
            <text x={WIDTH / 2 - 100} y={PAD_Y + 100} fill="rgba(148,163,184,0.4)" fontSize={7} fontFamily="monospace">
              Temporal
            </text>

            {/* Depth indicators */}
            {LAYERS.map((layer, i) => {
              if (!visibleLayers.has(layer.id)) return null;
              return (
                <g key={layer.id}>
                  <text
                    x={WIDTH - PAD_X - 8}
                    y={PAD_Y + 50 + i * 18}
                    fill={layer.color}
                    fontSize={7}
                    fontFamily="monospace"
                    textAnchor="end"
                    opacity={0.7}
                  >
                    {layer.depth}cm
                  </text>
                  <line
                    x1={WIDTH - PAD_X - 20}
                    y1={PAD_Y + 48 + i * 18}
                    x2={WIDTH - PAD_X - 10}
                    y2={PAD_Y + 48 + i * 18}
                    stroke={layer.color}
                    strokeWidth={1.5}
                    opacity={0.6}
                  />
                </g>
              );
            })}

            {/* Coil position indicator (top) */}
            <g>
              <line
                x1={WIDTH / 2 - 8}
                y1={PAD_Y - 2}
                x2={WIDTH / 2 + 8}
                y2={PAD_Y - 2}
                stroke="#22d3ee"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <line
                x1={WIDTH / 2}
                y1={PAD_Y - 2}
                x2={WIDTH / 2}
                y2={PAD_Y + 10}
                stroke="#22d3ee"
                strokeWidth={1.5}
                strokeDasharray="2,2"
              />
              <text
                x={WIDTH / 2 + 14}
                y={PAD_Y - 6}
                fill="#22d3ee"
                fontSize={7}
                fontFamily="monospace"
                opacity={0.8}
              >
                TMS Coil
              </text>
            </g>
          </svg>

          {/* Color legend */}
          <div className="flex items-center gap-2 mt-2 px-1">
            <span className="text-[8px] text-slate-600 w-10">Weak</span>
            <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-green-400 via-yellow-400 to-red-500" />
            <span className="text-[8px] text-slate-600 w-10 text-right">Peak</span>
          </div>
        </div>

        {/* Right panel: stats + protocol comparison */}
        <div className="flex flex-col gap-3">
          {/* Activation stats */}
          <div className="glass-panel rounded-xl p-3">
            <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Activation Metrics
            </div>
            <div className="grid grid-cols-2 gap-2">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-0.5 p-2 rounded-lg bg-slate-900/60 border border-slate-700/30"
                >
                  <span className={`text-[13px] font-bold font-mono ${stat.color}`}>
                    {stat.label}
                  </span>
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider">{stat.value}</span>
                  {stat.sublabel && (
                    <span className="text-[7px] text-slate-700 font-mono">{stat.sublabel}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Protocol comparison */}
          <div className="glass-panel rounded-xl p-3">
            <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Protocol Spread vs Depth
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 text-[8px] text-slate-600">
                <div className="w-4 h-1 bg-gradient-to-r from-slate-600 to-slate-500 rounded-full" />
                Spread
              </div>
              <div className="flex items-center gap-1 text-[8px] text-slate-600 ml-2">
                <div className="flex gap-0.5">
                  {[0.3, 0.6, 1.0].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-sm bg-slate-500" />
                  ))}
                </div>
                Depth
              </div>
            </div>
            {protocolData.map((p, i) => (
              <MiniBar key={i} {...p} />
            ))}
          </div>
        </div>
      </div>

      {/* 6-week treatment sparkline */}
      <div className="glass-panel rounded-xl p-3">
        <Sparkline
          data={sparkData}
          width={380}
          height={48}
          color="#a78bfa"
          label="6-Week Treatment Course"
          sublabel="36 sessions cumulative"
        />
        <div className="flex justify-between mt-1">
          {[0, 9, 18, 27, 36].map(s => (
            <span key={s} className="text-[7px] text-slate-700 font-mono">W{s === 0 ? '0' : Math.ceil(s / 5)}</span>
          ))}
          <span className="text-[7px] text-slate-600 font-mono">Session {sparkData.length}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <span className="text-[8px] text-slate-500">
            Cumulative cortical activation across treatment course. Early sessions establish network engagement;
            later sessions consolidate plasticity changes.
          </span>
        </div>
      </div>
    </div>
  );
}
