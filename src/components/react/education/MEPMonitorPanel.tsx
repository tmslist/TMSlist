'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useTMS } from '../../TMSViewer/TMSContext';

interface MEPMonitorPanelProps {
  compact?: boolean;
}

interface WaveformPoint {
  x: number;
  y: number;
}

function simulateMEP(intensity: number, t: number, playing: boolean): number {
  if (!playing) return 0;
  // Base noise floor
  let signal = (Math.random() - 0.5) * 0.08;
  // Stimulus artifact at t=0.1
  const artifactPos = 0.1;
  const artifactDist = Math.abs(t - artifactPos);
  if (artifactDist < 0.04) {
    signal += (1 - artifactDist / 0.04) * intensity * 0.6 * (Math.random() > 0.5 ? 1 : -1);
  }
  // N20 peak (~20ms)
  const n20Dist = Math.abs(t - 0.28);
  if (n20Dist < 0.06) {
    signal -= (1 - n20Dist / 0.06) * intensity * 0.8;
  }
  // P30 (~35ms)
  const p30Dist = Math.abs(t - 0.40);
  if (p30Dist < 0.07) {
    signal += (1 - p30Dist / 0.07) * intensity * 1.2;
  }
  // N45 (~50ms)
  const n45Dist = Math.abs(t - 0.55);
  if (n45Dist < 0.06) {
    signal -= (1 - n45Dist / 0.06) * intensity * 0.9;
  }
  // P60 (~65ms)
  const p60Dist = Math.abs(t - 0.70);
  if (p60Dist < 0.07) {
    signal += (1 - p60Dist / 0.07) * intensity * 1.0;
  }
  return signal;
}

function drawWaveform(
  canvas: HTMLCanvasElement,
  intensity: number,
  isPlaying: boolean,
  showGrid: boolean,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#0a0f1e';
  ctx.fillRect(0, 0, w, h);

  // Grid
  if (showGrid) {
    ctx.strokeStyle = '#1e2a3a';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Center lines
    ctx.strokeStyle = '#253040';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();
  }

  if (!isPlaying) {
    // Flat line with noise floor
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Label
    ctx.fillStyle = '#334155';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AWAITING STIMULUS', cx, cy + 24);
    return;
  }

  // Draw MEP waveform
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 6;
  ctx.beginPath();

  for (let px = 0; px < w; px++) {
    const t = px / w;
    const amplitude = intensity * 0.035;
    const y = cy - simulateMEP(amplitude, t, true) * cy;
    if (px === 0) ctx.moveTo(px, y);
    else ctx.lineTo(px, y);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Threshold line (dashed)
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  const thresholdY = cy - intensity * 0.035 * 0.5 * cy;
  ctx.beginPath();
  ctx.moveTo(0, thresholdY);
  ctx.lineTo(w, thresholdY);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function MEPMonitorPanel({ compact = false }: MEPMonitorPanelProps) {
  const { state } = useTMS();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [mode, setMode] = useState<'treatment' | 'mapping'>('treatment');
  const [showMotorMap, setShowMotorMap] = useState(false);
  const [sessionHistory] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      session: i + 1,
      amplitude: 180 + Math.round((i + Math.random() * 5) * 18),
    })),
  );

  // Estimate MEP amplitude from intensity
  const baseAmplitude = Math.round(200 + (state.intensity - 80) * 5);
  const mepAmplitude = mode === 'mapping' ? baseAmplitude : Math.round(baseAmplitude * 0.85);
  const threshold = 50;
  const snr = mepAmplitude / threshold;

  const animate = useCallback(() => {
    if (canvasRef.current) {
      drawWaveform(canvasRef.current, state.intensity / 120, state.isPlaying, true);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [state.intensity, state.isPlaying]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  if (compact) {
    return (
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={480}
          height={80}
          className="w-full rounded-lg"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">MEP Monitor</span>
        <div className="ml-auto flex rounded-lg border border-slate-700 overflow-hidden">
          {(['treatment', 'mapping'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide transition-all ${
                mode === m
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-500 border-slate-800'
              }`}
            >
              {m === 'treatment' ? 'Treatment' : 'Motor Map'}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-700/50">
        <canvas
          ref={canvasRef}
          width={480}
          height={140}
          className="w-full"
        />

        {/* Latency markers overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { label: 'N20', pos: '14%', color: 'text-cyan-400' },
            { label: 'P30', pos: '28%', color: 'text-emerald-400' },
            { label: 'N45', pos: '40%', color: 'text-amber-400' },
            { label: 'P60', pos: '52%', color: 'text-violet-400' },
          ].map(marker => (
            <div
              key={marker.label}
              className={`absolute top-1 ${marker.color} text-[8px] font-mono font-bold`}
              style={{ left: marker.pos }}
            >
              {marker.label}
            </div>
          ))}
        </div>
      </div>

      {/* Amplitude and threshold row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel rounded-xl px-3 py-2.5 text-center">
          <div className="text-lg font-bold text-cyan-400 font-mono">{mepAmplitude} µV</div>
          <div className="text-[9px] text-slate-500 mt-0.5">MEP Amplitude</div>
        </div>
        <div className="glass-panel rounded-xl px-3 py-2.5 text-center">
          <div className="text-lg font-bold text-rose-400 font-mono">{threshold} µV</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Threshold</div>
        </div>
      </div>

      {/* Signal quality */}
      <div className="glass-panel rounded-xl px-3 py-2">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${
            snr > 3 ? 'bg-emerald-400' : snr > 2 ? 'bg-amber-400' : 'bg-rose-400'
          } animate-pulse`} />
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Signal Quality</span>
          <span className={`ml-auto text-[9px] font-bold ${
            snr > 3 ? 'text-emerald-400' : snr > 2 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {snr > 3 ? 'Good' : snr > 2 ? 'Fair' : 'Poor'} · SNR: {snr.toFixed(1)}x
          </span>
        </div>
        {/* SNR bar */}
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              snr > 3 ? 'bg-emerald-400' : snr > 2 ? 'bg-amber-400' : 'bg-rose-400'
            }`}
            style={{ width: `${Math.min(snr / 5 * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Motor map (collapsible) */}
      {mode === 'mapping' && (
        <div className="glass-panel rounded-xl px-3 py-2.5">
          <button
            onClick={() => setShowMotorMap(!showMotorMap)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">M1 Motor Map</span>
            <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showMotorMap ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showMotorMap && (
            <div className="mt-2">
              {/* 4x4 motor map grid */}
              <div className="grid grid-cols-4 gap-1 mb-2">
                {Array.from({ length: 16 }, (_, i) => {
                  const isActive = i >= 6 && i <= 9;
                  return (
                    <div
                      key={i}
                      className={`h-6 rounded transition-all ${
                        isActive
                          ? 'bg-cyan-500/60 shadow-sm shadow-cyan-500/40'
                          : 'bg-slate-700/50'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-500">
                <span>Hotspot: [2.4, -1.8] cm</span>
                <span className="text-cyan-400 font-semibold">Optimal position found</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session history trend */}
      <div className="glass-panel rounded-xl px-3 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Amplitude Trend</span>
          <span className="text-[9px] text-emerald-400 font-semibold">
            ↑ {Math.round((sessionHistory[9].amplitude - sessionHistory[0].amplitude) / sessionHistory[0].amplitude * 100)}% over course
          </span>
        </div>
        {/* Mini sparkline */}
        <svg viewBox="0 0 200 40" className="w-full h-8">
          <polyline
            points={sessionHistory.map((s, i) => {
              const x = (i / (sessionHistory.length - 1)) * 200;
              const y = 36 - ((s.amplitude - 150) / 250) * 32;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={sessionHistory.map((s, i) => {
              const x = (i / (sessionHistory.length - 1)) * 200;
              const y = 36 - ((s.amplitude - 150) / 250) * 32;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="8"
            strokeOpacity="0.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="flex justify-between text-[8px] text-slate-600 mt-0.5">
          <span>Session 1</span>
          <span>Session 5</span>
          <span>Session 10</span>
        </div>
      </div>

      {/* Motor threshold workflow */}
      {mode === 'treatment' && (
        <div className="glass-panel rounded-xl px-3 py-2.5">
          <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Motor Threshold Tracking
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Current MT</span>
              <span className="text-[10px] font-mono font-bold text-cyan-400">{state.intensity}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Status</span>
              <span className={`text-[10px] font-semibold ${
                state.intensity >= 100 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {state.intensity >= 120 ? 'Above threshold' : state.intensity >= 100 ? 'At threshold' : 'Subthreshold'}
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full"
                style={{ width: `${(state.intensity / 140) * 100}%` }}
              />
            </div>
            <p className="text-[9px] text-slate-600 leading-relaxed">
              Motor threshold is the minimum stimulation needed to produce a visible muscle twitch in the hand. Found during your first session by gradually increasing intensity until a thumb movement is observed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
