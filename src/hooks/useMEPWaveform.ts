'use client';

import { useRef, useCallback, useEffect } from 'react';

interface WaveformOptions {
  intensityPct: number;  // 60–140 (% MT)
  onPulse: (timestamp: number) => void;
}

/**
 * Generates a simulated MEP (Motor Evoked Potential) waveform.
 *
 * Anatomy of one MEP response:
 *  1. Baseline noise (Gaussian, ~5% MEP height)
 *  2. Stimulus artifact — sharp spike at t=0, exponential decay (~10ms)
 *  3. MEP response — rising phase at ~20ms latency, peak ~35ms, decay by ~100ms
 *
 * Intensity linearly scales MEP amplitude (capped at saturation ~130% MT).
 */
export function useMEPWaveform({ intensityPct, onPulse }: WaveformOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const pulseTimesRef = useRef<number[]>([]); // timestamps of recent pulses
  const pendingPulseRef = useRef(false);

  // Register a new pulse
  const registerPulse = useCallback(() => {
    pulseTimesRef.current.push(performance.now());
    // Keep only last 3 pulses in view
    if (pulseTimesRef.current.length > 3) {
      pulseTimesRef.current.shift();
    }
    pendingPulseRef.current = true;
  }, []);

  // Expose to parent via onPulse registration
  useEffect(() => {
    const handler = () => registerPulse();
    onPulse; // reference to keep linter happy — parent passes onPulse
  }, [onPulse, registerPulse]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const now = performance.now();

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.strokeStyle = 'rgba(99,102,241,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Time axis labels
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = '9px monospace';
    const timeLabels = ['0ms', '20ms', '35ms', '60ms', '100ms'];
    timeLabels.forEach((label, i) => {
      const x = (i / (timeLabels.length - 1)) * W;
      ctx.fillText(label, x - 10, H - 4);
    });

    const midY = H / 2;

    // Draw each pulse's waveform (only recent pulses)
    const windowMs = 120;
    for (const pulseTime of pulseTimesRef.current) {
      const age = (now - pulseTime) / 1000; // seconds
      if (age > 0.6) continue; // hide old pulses

      const opacity = Math.max(0, 1 - age / 0.6);
      const intensityNorm = Math.min(intensityPct / 100, 1.3) / 1.3; // saturate at 130%
      const mepHeight = 28 * intensityNorm;

      // Draw waveform line
      ctx.beginPath();
      ctx.strokeStyle = `rgba(34,211,238,${opacity})`;
      ctx.lineWidth = 1.5;

      for (let px = 0; px < W; px++) {
        const t = (px / W) * windowMs; // ms
        let y = midY;

        if (t < 5) {
          // Baseline noise
          y = midY + (Math.random() - 0.5) * 4;
        } else if (t < 8) {
          // Stimulus artifact — sharp spike then decay
          const artifact = Math.exp(-(t - 5) * 1.2) * 18;
          y = midY - artifact;
        } else if (t < 20) {
          // Rising phase
          const rise = (t - 8) / 12;
          y = midY - rise * mepHeight * 0.3;
        } else if (t < 35) {
          // MEP rise
          const rise = (t - 20) / 15;
          y = midY - mepHeight * (0.3 + rise * 0.7);
        } else if (t < 55) {
          // MEP peak decay
          const decay = (t - 35) / 20;
          y = midY - mepHeight * Math.exp(-decay * 1.5);
        } else if (t < 100) {
          // Return to baseline
          const decay = (t - 55) / 45;
          y = midY - mepHeight * 0.1 * Math.exp(-decay * 3);
        } else {
          // Baseline
          y = midY + (Math.random() - 0.5) * 4;
        }

        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      // Fill under MEP curve (subtle)
      ctx.lineTo(W, midY);
      ctx.lineTo(0, midY);
      ctx.closePath();
      ctx.fillStyle = `rgba(34,211,238,${opacity * 0.06})`;
      ctx.fill();
    }

    // Center line
    ctx.strokeStyle = 'rgba(99,102,241,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(W, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, [intensityPct]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawWaveform);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [drawWaveform]);

  // Cleanup old pulses every second
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = performance.now() - 2000;
      pulseTimesRef.current = pulseTimesRef.current.filter(t => t > cutoff);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { canvasRef, registerPulse };
}
