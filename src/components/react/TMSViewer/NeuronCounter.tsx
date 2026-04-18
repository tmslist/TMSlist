'use client';

import { useEffect, useRef, useState } from 'react';
import { useTMS } from './TMSContext';
import { CheckIcon } from '../Icons';

const BENCHMARK_NEURONS = 50000; // ~50k neurons activated per typical TMS session

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

export function NeuronCounter() {
  const { state } = useTMS();
  const [neurons, setNeurons] = useState(0);
  const [history, setHistory] = useState<number[]>(Array(20).fill(0));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevPulseRef = useRef(0);

  // Estimate neurons activated per pulse (intensity-dependent)
  const neuronsPerPulse = Math.round((state.intensity / 120) * 1500);

  // Update counter on pulse
  useEffect(() => {
    if (state.pulseCount > prevPulseRef.current) {
      const delta = state.pulseCount - prevPulseRef.current;
      setNeurons(n => n + delta * neuronsPerPulse);
      setHistory(h => {
        const next = [...h.slice(1), delta * neuronsPerPulse];
        return next;
      });
    }
    prevPulseRef.current = state.pulseCount;
  }, [state.pulseCount, neuronsPerPulse]);

  // Draw sparkline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);
    const data = history;
    if (data.length < 2) return;

    const max = Math.max(...data, 1);
    const min = 0;
    const stepX = W / (data.length - 1);

    ctx.beginPath();
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    data.forEach((val, i) => {
      const x = i * stepX;
      const y = H - ((val - min) / (max - min)) * H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(34,211,238,0.1)';
    ctx.fill();
  }, [history]);

  const progress = Math.min(neurons / BENCHMARK_NEURONS, 1);
  const sessionComplete = progress >= 1;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Neurons Activated</span>
        {sessionComplete && (
          <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[8px] font-bold text-emerald-400 uppercase">
            Session ✓
          </span>
        )}
      </div>

      {/* Large counter */}
      <div className="text-center mb-2">
        <span className="text-2xl font-mono font-bold text-white tabular-nums">
          {formatNumber(neurons)}
        </span>
        <div className="text-[9px] text-slate-500 mt-0.5">
          / {formatNumber(BENCHMARK_NEURONS)} typical session
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            background: sessionComplete
              ? 'linear-gradient(90deg, #22c55e, #22d3ee)'
              : 'linear-gradient(90deg, #7c3aed, #22d3ee)',
          }}
        />
      </div>

      {/* Sparkline */}
      <div className="h-6 rounded bg-slate-900/50 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" style={{ height: '24px' }} />
      </div>

      {/* Stats row */}
      <div className="flex justify-between mt-2 text-[8px] text-slate-600">
        <span>~{neuronsPerPulse.toLocaleString()} neurons/pulse</span>
        <span>{Math.round(progress * 100)}% session dose</span>
      </div>
    </div>
  );
}
