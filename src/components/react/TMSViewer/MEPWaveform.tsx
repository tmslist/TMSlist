'use client';

import { useRef, useEffect, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';

interface MEPWaveformProps {
  intensityPct: number;
  pulseCount: number;
  isPlaying: boolean;
  onPulse?: () => void;
}

const HISTORY_SIZE = 20;

export function MEPWaveform({ intensityPct, pulseCount, isPlaying }: MEPWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ampCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const pulseTimesRef = useRef<number[]>([]);
  const ampHistoryRef = useRef<number[]>([]);
  const lastPulseCountRef = useRef(pulseCount);
  const reducedMotion = useReducedMotion();
  const [viewMode, setViewMode] = useState<'emg' | 'amplitude'>('emg');
  const [latestMEP, setLatestMEP] = useState<number | null>(null);

  // Register new pulse when pulseCount increments
  useEffect(() => {
    if (pulseCount > lastPulseCountRef.current) {
      const delta = pulseCount - lastPulseCountRef.current;
      for (let i = 0; i < delta; i++) {
        pulseTimesRef.current.push(performance.now());
        if (pulseTimesRef.current.length > 3) pulseTimesRef.current.shift();

        const intensityNorm = Math.min(intensityPct / 100, 1.3) / 1.3;
        const baseAmp = intensityNorm * (0.6 + Math.random() * 0.4);
        ampHistoryRef.current.push(baseAmp);
        if (ampHistoryRef.current.length > HISTORY_SIZE) ampHistoryRef.current.shift();

        // Estimate MEP amplitude in µV
        const mepUV = Math.round(intensityNorm * 1500 * (0.8 + Math.random() * 0.4));
        setLatestMEP(mepUV);
      }
    }
    lastPulseCountRef.current = pulseCount;
  }, [pulseCount, intensityPct]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ampCanvas = ampCanvasRef.current;
    if (!canvas || !ampCanvas) return;
    const ctx = canvas.getContext('2d');
    const ampCtx = ampCanvas.getContext('2d');
    if (!ctx || !ampCtx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const ampH = 28;
    ampCanvas.width = W * dpr;
    ampCanvas.height = ampH * dpr;
    ampCtx.scale(dpr, dpr);

    const midY = H / 2;

    const draw = () => {
      const now = performance.now();

      ctx.clearRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(99,102,241,0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 15) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Time labels
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.font = '7px monospace';
      ['0', '20ms', '35ms', '60ms', '100ms'].forEach((label, i) => {
        ctx.fillText(label, (i / 4) * W - 8, H - 4);
      });

      // Vertical latency markers
      const markers = [
        { x: 20 / 120, label: '20', color: '#64748b' },
        { x: 35 / 120, label: '35', color: '#22d3ee' },
        { x: 60 / 120, label: '60', color: '#64748b' },
        { x: 100 / 120, label: '100', color: '#64748b' },
      ];
      markers.forEach(({ x: mx, label, color }) => {
        const xPos = mx * W;
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.75;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, H);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color + '80';
        ctx.font = '6px monospace';
        ctx.fillText(label, xPos - 4, 10);
      });

      ctx.fillStyle = 'rgba(99,102,241,0.04)';
      ctx.fillRect(W * (5 / 120), 0, W * (95 / 120), H);

      const windowMs = 120;
      const intensityNorm = Math.min(intensityPct / 100, 1.3) / 1.3;
      const mepHeight = 22 * intensityNorm;

      for (const pulseTime of pulseTimesRef.current) {
        const age = (now - pulseTime) / 1000;
        if (age > 0.7) continue;
        const opacity = Math.max(0, 1 - age / 0.7);

        ctx.beginPath();
        ctx.strokeStyle = `rgba(34,211,238,${opacity})`;
        ctx.lineWidth = 1.8;

        for (let px = 0; px < W; px++) {
          const t = (px / W) * windowMs;
          let y = midY;

          if (t < 5) {
            y = midY + (Math.random() - 0.5) * 4;
          } else if (t < 8) {
            y = midY - Math.exp(-(t - 5) * 1.5) * 16;
          } else if (t < 20) {
            y = midY - ((t - 8) / 12) * mepHeight * 0.3;
          } else if (t < 35) {
            y = midY - mepHeight * (0.3 + ((t - 20) / 15) * 0.7);
          } else if (t < 60) {
            y = midY - mepHeight * Math.exp(-((t - 35) / 25) * 1.5);
          } else if (t < 100) {
            y = midY - mepHeight * 0.08 * Math.exp(-((t - 60) / 40) * 3);
          } else {
            y = midY + (Math.random() - 0.5) * 4;
          }

          if (px === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.lineTo(W, midY);
        ctx.lineTo(0, midY);
        ctx.closePath();
        ctx.fillStyle = `rgba(34,211,238,${opacity * 0.08})`;
        ctx.fill();
      }

      // Baseline
      ctx.strokeStyle = 'rgba(99,102,241,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(W, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Amplitude chart
      ampCtx.clearRect(0, 0, W, ampH);
      ampCtx.fillStyle = 'rgba(99,102,241,0.04)';
      ampCtx.fillRect(0, 0, W, ampH);

      const history = ampHistoryRef.current;
      const barW = W / HISTORY_SIZE;
      if (history.length > 0) {
        history.forEach((amp, i) => {
          const barH = amp * ampH * 0.9;
          const x = i * barW;
          const gradient = ampCtx.createLinearGradient(x, ampH - barH, x, ampH);
          gradient.addColorStop(0, 'rgba(34,211,238,0.9)');
          gradient.addColorStop(1, 'rgba(99,102,241,0.3)');
          ampCtx.fillStyle = gradient;
          ampCtx.fillRect(x + 1, ampH - barH, barW - 2, barH);
        });
      }

      ampCtx.strokeStyle = 'rgba(99,102,241,0.25)';
      ampCtx.lineWidth = 1;
      ampCtx.beginPath();
      ampCtx.moveTo(0, ampH * 0.1);
      ampCtx.lineTo(W, ampH * 0.1);
      ampCtx.stroke();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [intensityPct, reducedMotion]);

  const thresholdLabel = intensityPct >= 100 ? 'Above MT' : intensityPct >= 80 ? 'Near MT' : 'Below MT';
  const thresholdColor = intensityPct >= 100 ? 'text-emerald-400' : intensityPct >= 80 ? 'text-amber-400' : 'text-slate-400';

  return (
    <div className="flex flex-col gap-1.5">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">MEP Response</span>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-slate-800/80 border border-slate-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('emg')}
              className={`px-2 py-0.5 text-[8px] font-medium transition-colors ${viewMode === 'emg' ? 'bg-violet-600/30 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              EMG
            </button>
            <button
              onClick={() => setViewMode('amplitude')}
              className={`px-2 py-0.5 text-[8px] font-medium transition-colors ${viewMode === 'amplitude' ? 'bg-violet-600/30 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Amplitude
            </button>
          </div>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-3 text-[9px] text-slate-400">
        <span className="font-mono">{intensityPct}% MT</span>
        <span>·</span>
        <span className="font-mono">{pulseCount > 0 ? pulseCount.toLocaleString() : '—'} pulses</span>
        <span>·</span>
        <span className={`font-semibold ${thresholdColor}`}>{thresholdLabel}</span>
        {latestMEP !== null && (
          <>
            <span>·</span>
            <span className="font-mono text-cyan-400">MEP: {latestMEP} µV</span>
          </>
        )}
      </div>

      {/* Waveform */}
      <div className="relative rounded-lg overflow-hidden bg-slate-900/80 border border-slate-700/50">
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ height: '100px' }}
          aria-label={`Motor Evoked Potential waveform, ${intensityPct}% MT, ${pulseCount} pulses`}
        />
        <div className="absolute top-1.5 right-2 flex flex-col gap-0.5 text-[7px] text-slate-400/50 font-mono">
          <span>artifact →</span>
          <span>peak @ 35ms</span>
        </div>
        {latestMEP !== null && (
          <div className="absolute bottom-1 right-2 text-[7px] font-mono text-cyan-400/60">
            MEP ~{latestMEP} µV
          </div>
        )}
      </div>

      {/* Amplitude trend */}
      <div className="relative rounded-lg overflow-hidden bg-slate-900/60 border border-slate-700/30">
        <canvas
          ref={ampCanvasRef}
          className="w-full"
          style={{ height: '28px' }}
          aria-label="MEP amplitude trend over last 20 pulses"
        />
        <div className="absolute bottom-0.5 left-1.5 text-[7px] text-slate-500/50 font-mono">amplitude trend (last 20)</div>
      </div>
    </div>
  );
}
