'use client';

import { useEffect, useRef } from 'react';
import { useTMS } from './TMSContext';

interface Props {
  width?: number;
  height?: number;
}

export function PulsePatternWaveform({ width = 800, height = 80 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotPositionRef = useRef(0); // 0-1 progress through the pattern
  const lastTickRef = useRef(0);
  const animationRef = useRef<number>(0);

  const { state } = useTMS();

  // Pattern config per type
  const patternConfig = {
    continuous: {
      label: '100ms interval (10Hz)',
      colors: { line: '#22d3ee', fill: 'rgba(34,211,238,0.15)', dot: '#00ffff' },
      pulseCount: 10,
      repeat: true,
    },
    'tbs-burst': {
      label: 'iTBS — 50Hz bursts / 2s interval',
      colors: { line: '#a78bfa', fill: 'rgba(167,139,250,0.15)', dot: '#c4b5fd' },
      pulseCount: 3,
      repeat: true,
    },
    ctbs: {
      label: 'cTBS — 50Hz bursts / 200ms interval',
      colors: { line: '#f97316', fill: 'rgba(249,115,22,0.15)', dot: '#fb923c' },
      pulseCount: 3,
      repeat: true,
    },
    single: {
      label: 'Single pulse',
      colors: { line: '#22d3ee', fill: 'rgba(34,211,238,0.15)', dot: '#00ffff' },
      pulseCount: 1,
      repeat: false,
    },
  } as const;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    const pattern = state.selectedProtocol?.pulsePattern ?? 'continuous';
    const config = patternConfig[pattern as keyof typeof patternConfig] ?? patternConfig.continuous;
    const isPlaying = state.isPlaying;

    // Pattern dimensions
    const padLeft = 12;
    const padRight = 12;
    const padTop = 10;
    const padBottom = 24;
    const chartWidth = width - padLeft - padRight;
    const chartHeight = height - padTop - padBottom;

    // Pattern interval in ms
    const patternIntervalMs =
      pattern === 'single' ? 0 :
      pattern === 'ctbs' ? 200 :
      pattern === 'tbs-burst' ? 2000 :
      1000 / state.frequency; // continuous

    // Total pattern width in px
    const totalPatternWidth = chartWidth;
    const pxPerMs = chartWidth / patternIntervalMs;

    function draw(timestamp: number) {
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = 'rgba(15,23,42,0.8)';
      ctx.fillRect(0, 0, width, height);

      // Label
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.fillText(config.label, padLeft, padTop - 2);

      // Draw pattern lines
      ctx.save();
      ctx.translate(padLeft, padTop);

      const { colors } = config;

      // Fill area under the chart
      ctx.fillStyle = colors.fill;
      ctx.fillRect(0, 0, chartWidth, chartHeight);

      // Draw pulse lines
      if (pattern === 'continuous') {
        // 10 evenly-spaced vertical lines for 10Hz
        for (let i = 0; i < 10; i++) {
          const x = (i / 10) * chartWidth;
          ctx.strokeStyle = colors.line;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, chartHeight * 0.7);
          ctx.stroke();

          // Tick labels at 0 and 100ms
          if (i === 0 || i === 9) {
            ctx.font = '8px monospace';
            ctx.fillStyle = 'rgba(148,163,184,0.6)';
            ctx.fillText(i === 0 ? '0ms' : '100ms', x - 10, chartHeight + 12);
          }
        }
      } else if (pattern === 'tbs-burst') {
        // Cluster of 3 lines at 20ms apart (50Hz), shown as cluster
        const clusterWidth = pxPerMs * 40;
        const clusterHeight = chartHeight * 0.75;
        for (let i = 0; i < 3; i++) {
          const x = (i * 20 / patternIntervalMs) * chartWidth;
          ctx.strokeStyle = colors.line;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.moveTo(x, clusterHeight * 0.3);
          ctx.lineTo(x, clusterHeight);
          ctx.stroke();
        }
        // Tick labels
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(148,163,184,0.6)';
        ctx.fillText('0ms', 2, chartHeight + 12);
        ctx.fillText('40ms burst', clusterWidth / 2 - 15, chartHeight + 12);
        ctx.fillText('2s interval', chartWidth - 25, chartHeight + 12);
      } else if (pattern === 'ctbs') {
        // Continuous 3-pulse clusters every 200ms
        const clusterWidth = pxPerMs * 40;
        const clusterHeight = chartHeight * 0.75;
        for (let i = 0; i < 3; i++) {
          const x = (i * 20 / patternIntervalMs) * chartWidth;
          ctx.strokeStyle = colors.line;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.moveTo(x, clusterHeight * 0.3);
          ctx.lineTo(x, clusterHeight);
          ctx.stroke();
        }
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(148,163,184,0.6)';
        ctx.fillText('0ms', 2, chartHeight + 12);
        ctx.fillText('200ms', chartWidth - 25, chartHeight + 12);
      } else {
        // Single pulse
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        const x = chartWidth / 2;
        ctx.beginPath();
        ctx.moveTo(x, chartHeight * 0.15);
        ctx.lineTo(x, chartHeight * 0.85);
        ctx.stroke();
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(148,163,184,0.6)';
        ctx.fillText('Single pulse', chartWidth / 2 - 20, chartHeight + 12);
      }

      // Animated dot — advance when playing
      if (isPlaying) {
        if (timestamp - lastTickRef.current > 16) {
          const advancePerFrame =
            pattern === 'single' ? 0 :
            pattern === 'ctbs' ? (16 / 200) :
            pattern === 'tbs-burst' ? (16 / 2000) :
            (16 / (1000 / state.frequency));
          dotPositionRef.current = (dotPositionRef.current + advancePerFrame) % 1;
          lastTickRef.current = timestamp;
        }

        const dotX = dotPositionRef.current * chartWidth;
        const dotY = chartHeight * 0.5;

        // Glow effect
        const gradient = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 8);
        gradient.addColorStop(0, 'rgba(0,255,255,0.9)');
        gradient.addColorStop(1, 'rgba(0,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Solid dot
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(draw);
    }

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [state.selectedProtocol?.pulsePattern, state.frequency, state.isPlaying, width, height]);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-slate-700/50">
      <canvas
        ref={canvasRef}
        className="block"
        style={{ display: 'block' }}
      />
    </div>
  );
}