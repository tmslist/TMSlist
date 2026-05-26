'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// Compact, education-focused TMS preview.
// Uses raw SVG + small math model — no Three.js, runs entirely on the main thread.
// All values are illustrative ranges drawn from published rTMS literature; the goal is
// intuition, not precision. The full /simulation/ page uses the heavier 3D model.

type Protocol = {
  key: string;
  label: string;
  hz: number;
  intensity: number;
  pulses: number;
  pattern: 'continuous' | 'theta-burst' | 'low';
  description: string;
};

const PROTOCOLS: Protocol[] = [
  {
    key: 'std',
    label: 'Standard rTMS',
    hz: 10,
    intensity: 120,
    pulses: 3000,
    pattern: 'continuous',
    description: '10 Hz, 120% MT — most-studied depression protocol',
  },
  {
    key: 'tbs',
    label: 'Theta Burst (iTBS)',
    hz: 50,
    intensity: 80,
    pulses: 600,
    pattern: 'theta-burst',
    description: '50 Hz bursts, 80% MT — 3-min sessions',
  },
  {
    key: 'low',
    label: 'Low-frequency rTMS',
    hz: 1,
    intensity: 110,
    pulses: 1200,
    pattern: 'low',
    description: '1 Hz, inhibitory — used contralateral to lesion',
  },
];

// Approximate E-field as a function of intensity %MT (linear) and depth (exponential decay).
// Penetration depth scales mildly with intensity. Numbers are illustrative.
function efieldAtDepth(intensityPct: number, depthCm: number): number {
  const surface = (intensityPct / 100) * 140; // ~140 V/m at 100% MT at the cortex surface
  const decayPerCm = 0.55; // ~45% remaining per cm of depth
  return surface * Math.pow(decayPerCm, depthCm);
}

function reachAtThreshold(intensityPct: number, thresholdVm = 60): number {
  // Solve for depth where field = threshold. Returns cm.
  const surface = (intensityPct / 100) * 140;
  if (surface <= thresholdVm) return 0;
  const decayPerCm = 0.55;
  return Math.log(thresholdVm / surface) / Math.log(decayPerCm);
}

export default function EducationSimulator() {
  const [protoKey, setProtoKey] = useState<string>('std');
  const [hz, setHz] = useState(10);
  const [intensity, setIntensity] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastPulseAt = useRef<number>(0);

  const proto = PROTOCOLS.find(p => p.key === protoKey) ?? PROTOCOLS[0];

  // Apply protocol presets when changed
  useEffect(() => {
    setHz(proto.hz);
    setIntensity(proto.intensity);
    setPulseCount(0);
    setIsPlaying(false);
  }, [protoKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pulse animation loop (RAF, throttled by hz)
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const interval = 1000 / Math.max(hz, 0.5);
    const tick = (now: number) => {
      if (now - lastPulseAt.current >= interval) {
        lastPulseAt.current = now;
        setPulseCount(c => Math.min(c + 1, 9999));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, hz]);

  // Auto-stop at protocol max
  useEffect(() => {
    if (pulseCount >= proto.pulses) setIsPlaying(false);
  }, [pulseCount, proto.pulses]);

  const reach = reachAtThreshold(intensity);
  const surfaceField = efieldAtDepth(intensity, 0);
  const mepAmplitude = useMemo(() => {
    // MEP grows sigmoidally with intensity above motor threshold
    if (intensity < 80) return 0;
    const x = (intensity - 90) / 15;
    return Math.round(1500 / (1 + Math.exp(-x)) * 10) / 10;
  }, [intensity]);

  const sessionsTotal = proto.pulses;
  const progressPct = Math.min(100, (pulseCount / sessionsTotal) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* LEFT — Visual */}
      <div className="lg:col-span-3 space-y-4">
        {/* Protocol picker */}
        <div className="grid grid-cols-3 gap-2">
          {PROTOCOLS.map(p => {
            const active = p.key === protoKey;
            return (
              <button
                key={p.key}
                onClick={() => setProtoKey(p.key)}
                className="text-left rounded-xl px-3 py-2.5 transition-all"
                style={{
                  background: active ? 'rgba(201,101,74,0.10)' : 'var(--paper)',
                  border: `1px solid ${active ? 'var(--warm)' : 'var(--line)'}`,
                  boxShadow: active ? '0 0 0 3px rgba(201,101,74,0.10)' : 'none',
                }}
                aria-pressed={active}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? 'var(--warm)' : 'var(--ink)',
                    lineHeight: 1.2,
                  }}
                >
                  {p.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                  {p.hz} Hz · {p.intensity}%
                </div>
              </button>
            );
          })}
        </div>

        {/* Brain + coil canvas */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              'radial-gradient(ellipse at 20% 10%, rgba(201,101,74,0.06), transparent 55%), var(--paper2)',
            border: '1px solid var(--line)',
            borderRadius: 18,
            padding: 16,
            minHeight: 320,
          }}
        >
          <BrainCoilSvg
            intensity={intensity}
            isPlaying={isPlaying}
            hz={hz}
            reach={reach}
            pulseCount={pulseCount}
            pattern={proto.pattern}
          />

          {/* Floating session HUD */}
          <div
            className="absolute top-3 left-3 flex items-center gap-2"
            style={{
              background: 'rgba(251,250,247,0.92)',
              backdropFilter: 'blur(6px)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '4px 10px',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isPlaying ? '#22c55e' : 'var(--muted)',
                boxShadow: isPlaying ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--ink)',
              }}
            >
              {isPlaying ? 'Stimulating' : 'Idle'}
            </span>
          </div>

          {/* Floating field readout */}
          <div
            className="absolute top-3 right-3"
            style={{
              background: 'rgba(251,250,247,0.92)',
              backdropFilter: 'blur(6px)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '6px 10px',
              textAlign: 'right',
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
              }}
            >
              Cortex E-field
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--warm)',
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              }}
            >
              {Math.round(surfaceField)} V/m
            </div>
          </div>
        </div>

        {/* Transport bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-full transition-all"
            style={{
              background: isPlaying ? '#9c2626' : 'var(--warm)',
              color: '#FBFAF7',
              fontWeight: 700,
              fontSize: 13,
              boxShadow: '0 4px 12px -4px rgba(201,101,74,0.40)',
            }}
            aria-label={isPlaying ? 'Stop pulses' : 'Fire pulses'}
          >
            {isPlaying ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Stop
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Fire pulses
              </>
            )}
          </button>

          <button
            onClick={() => {
              setPulseCount(0);
              setIsPlaying(false);
            }}
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full transition-all"
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>

          <a
            href="/simulation/"
            className="ml-auto inline-flex items-center gap-1.5 h-10 px-5 rounded-full transition-all"
            style={{
              background: 'var(--ink)',
              color: '#FBFAF7',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Open full simulator
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
              Session progress
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--ink)',
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                fontWeight: 600,
              }}
            >
              {pulseCount.toLocaleString()} / {sessionsTotal.toLocaleString()} pulses
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: 9999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, var(--warm), #D4806A)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT — Controls + readouts */}
      <div className="lg:col-span-2 space-y-4">
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, margin: 0 }}>
          {proto.description}. Try moving the sliders — watch how depth of penetration and the
          motor-evoked potential change in real time.
        </p>

        <Slider
          label="Frequency"
          value={hz}
          onChange={setHz}
          min={0.5}
          max={50}
          step={0.5}
          unit="Hz"
          marks={[
            { v: 1, label: 'Inhibit' },
            { v: 10, label: 'Std' },
            { v: 50, label: 'Burst' },
          ]}
        />

        <Slider
          label="Intensity"
          value={intensity}
          onChange={setIntensity}
          min={60}
          max={140}
          step={5}
          unit="% MT"
          marks={[
            { v: 80, label: 'iTBS' },
            { v: 100, label: 'MT' },
            { v: 120, label: 'Std' },
          ]}
        />

        {/* Live readouts */}
        <div className="grid grid-cols-2 gap-2">
          <Readout label="Reach depth" value={`${reach.toFixed(1)} cm`} accent="var(--warm)" />
          <Readout label="Surface field" value={`${Math.round(surfaceField)} V/m`} accent="var(--ink)" />
          <Readout label="Pulse rate" value={`${hz} Hz`} accent="#2E7A8F" />
          <Readout label="MEP amp." value={mepAmplitude > 0 ? `${mepAmplitude} µV` : 'sub-MT'} accent={mepAmplitude > 0 ? '#15803d' : 'var(--muted)'} />
        </div>

        {/* Mechanism explainer card */}
        <div
          style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--warm)',
              }}
            >
              What's happening
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.55, margin: 0 }}>
            At <strong>{intensity}% MT</strong>, the field reaches{' '}
            <strong>~{reach.toFixed(1)} cm</strong> below the scalp — enough to penetrate the
            cortex {reach < 1.5 ? 'shallowly' : reach < 2.5 ? 'comfortably' : 'deeply'}. Pulses fire at{' '}
            <strong>{hz} Hz</strong>, depolarising pyramidal neurons in layer II/III each cycle.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  marks,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  marks?: { v: number; label: string }[];
}) {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '12px 14px',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--muted)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--warm)',
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          }}
        >
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full cursor-pointer"
        style={{
          accentColor: '#C9654A',
          height: 4,
        }}
      />
      {marks && (
        <div className="flex justify-between mt-1.5" style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 500 }}>
          {marks.map(m => (
            <span key={m.v}>
              {m.label} <span style={{ opacity: 0.6 }}>· {m.v}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Readout({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: accent,
          marginTop: 2,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Brain + coil illustration with live E-field overlay ─────────────────────

function BrainCoilSvg({
  intensity,
  isPlaying,
  hz,
  reach,
  pulseCount,
  pattern,
}: {
  intensity: number;
  isPlaying: boolean;
  hz: number;
  reach: number;
  pulseCount: number;
  pattern: 'continuous' | 'theta-burst' | 'low';
}) {
  // Visual reach in SVG units (0–60 maps roughly to 0–4 cm)
  const reachPx = Math.min(60, Math.max(8, reach * 18));
  const fieldOpacity = Math.min(0.95, 0.25 + intensity / 200);
  const pulseAccent = pattern === 'theta-burst' ? '#C9654A' : pattern === 'low' ? '#2E7A8F' : '#C9654A';

  return (
    <svg viewBox="0 0 360 280" className="w-full h-auto" style={{ maxHeight: 320 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="brainSurface" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FBFAF7" />
          <stop offset="100%" stopColor="#EDE5D2" />
        </radialGradient>

        <radialGradient id="efield" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#C9654A" stopOpacity={fieldOpacity} />
          <stop offset="40%" stopColor="#D4806A" stopOpacity={fieldOpacity * 0.6} />
          <stop offset="100%" stopColor="#FBFAF7" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="coilGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1E2A3B" />
          <stop offset="100%" stopColor="#0A1628" />
        </linearGradient>

        <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <clipPath id="brainClip">
          <path d="M 60 170 C 65 110, 110 60, 180 55 C 250 50, 305 90, 310 160 C 314 215, 270 245, 200 248 C 130 250, 85 230, 65 200 C 60 190, 58 180, 60 170 Z" />
        </clipPath>
      </defs>

      {/* Skull cross-section context — subtle stroke */}
      <ellipse cx="186" cy="155" rx="160" ry="115" fill="none" stroke="rgba(10,22,40,0.10)" strokeWidth="1" strokeDasharray="3 3" />

      {/* Scalp line */}
      <ellipse cx="186" cy="155" rx="155" ry="110" fill="none" stroke="rgba(10,22,40,0.18)" strokeWidth="0.8" />

      {/* Brain silhouette */}
      <path
        d="M 60 170 C 65 110, 110 60, 180 55 C 250 50, 305 90, 310 160 C 314 215, 270 245, 200 248 C 130 250, 85 230, 65 200 C 60 190, 58 180, 60 170 Z"
        fill="url(#brainSurface)"
        stroke="var(--ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Sulci — thin ink hairlines */}
      <g fill="none" stroke="rgba(10,22,40,0.18)" strokeWidth="0.7" strokeLinecap="round" clipPath="url(#brainClip)">
        <path d="M 80 110 C 130 100, 200 95, 290 110" />
        <path d="M 70 150 C 130 145, 220 140, 305 150" />
        <path d="M 75 195 C 140 200, 230 205, 305 195" />
        <path d="M 130 70 C 140 110, 145 160, 140 220" />
        <path d="M 220 65 C 230 105, 235 165, 232 230" />
      </g>

      {/* E-field beam — ellipse from coil pointing into cortex */}
      {isPlaying && (
        <g clipPath="url(#brainClip)" style={{ animation: 'eFieldPulse 0.6s ease-out infinite' }}>
          <ellipse cx="220" cy="55" rx={reachPx * 0.7} ry={reachPx} fill="url(#efield)" />
        </g>
      )}

      {/* Static field visualization — even when not playing, shows reach */}
      {!isPlaying && (
        <g clipPath="url(#brainClip)" opacity="0.6">
          <ellipse cx="220" cy="55" rx={reachPx * 0.7} ry={reachPx} fill="url(#efield)" />
        </g>
      )}

      {/* Reach depth marker — dotted line */}
      <g style={{ pointerEvents: 'none' }}>
        <line
          x1="220"
          y1="55"
          x2="220"
          y2={55 + reachPx}
          stroke="var(--warm)"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.7"
        />
        <text
          x="226"
          y={55 + reachPx + 4}
          style={{ fontSize: 9, fill: 'var(--warm)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}
        >
          {reach.toFixed(1)} cm
        </text>
      </g>

      {/* Figure-8 coil */}
      <g transform="translate(220, 30)">
        {/* Handle */}
        <rect x="-32" y="-22" width="64" height="14" rx="6" fill="url(#coilGrad)" />
        <rect x="-26" y="-19" width="52" height="6" rx="2" fill="rgba(255,255,255,0.08)" />
        {/* Wings */}
        <ellipse cx="-22" cy="-2" rx="18" ry="11" fill="none" stroke="url(#coilGrad)" strokeWidth="3.5" />
        <ellipse cx="22" cy="-2" rx="18" ry="11" fill="none" stroke="url(#coilGrad)" strokeWidth="3.5" />
        {/* Inner rings */}
        <ellipse cx="-22" cy="-2" rx="12" ry="7" fill="none" stroke="rgba(201,101,74,0.4)" strokeWidth="1" />
        <ellipse cx="22" cy="-2" rx="12" ry="7" fill="none" stroke="rgba(201,101,74,0.4)" strokeWidth="1" />
        {/* Center pulse indicator */}
        {isPlaying && (
          <circle
            cx="0"
            cy="-2"
            r="3"
            fill={pulseAccent}
            filter="url(#pulseGlow)"
            style={{ animation: `coilPulse ${1000 / Math.max(hz, 0.5)}ms ease-out infinite` }}
          />
        )}
        {!isPlaying && <circle cx="0" cy="-2" r="2.5" fill="rgba(201,101,74,0.6)" />}
      </g>

      {/* Pulse counter — bottom right */}
      <g transform="translate(310, 250)">
        <text
          textAnchor="end"
          style={{
            fontSize: 9,
            fontWeight: 600,
            fill: 'var(--muted)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Pulses: {pulseCount}
        </text>
      </g>

      {/* Cortex layer label */}
      <text
        x="186"
        y="270"
        textAnchor="middle"
        style={{
          fontSize: 9,
          fill: 'var(--muted)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontStyle: 'italic',
        }}
      >
        Cortical pyramidal neurons (layer II/III)
      </text>

      <style>{`
        @keyframes coilPulse {
          0%   { opacity: 1; r: 3; }
          50%  { opacity: 0.7; r: 5; }
          100% { opacity: 1; r: 3; }
        }
        @keyframes eFieldPulse {
          0%   { opacity: 0.7; }
          50%  { opacity: 1; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </svg>
  );
}
