'use client';

import { useEffect, useState, useRef } from 'react';
import { useTMS } from './TMSContext';

export function SessionCountdown() {
  const { state } = useTMS();
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.isPlaying) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          setElapsed((Date.now() - startTimeRef.current) / 1000);
        }
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isPlaying]);

  // Track elapsed while stopped too
  useEffect(() => {
    if (!state.isPlaying && elapsed > 0 && startTimeRef.current === null) {
      // already paused
    }
  }, [state.isPlaying, elapsed]);

  // Estimate session time from pulses
  const estimatedSessionPulses = state.selectedProtocol?.pulses ?? 600;
  const pulsesRemaining = Math.max(0, estimatedSessionPulses - state.pulseCount);
  const pulsesPerSecond = state.frequency > 0 && state.isPlaying
    ? state.frequency
    : 0;
  const secondsRemaining = pulsesPerSecond > 0 ? pulsesRemaining / pulsesPerSecond : null;

  const formatTime = (s: number | null) => {
    if (s === null) return '--:--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = state.selectedProtocol?.pulses
    ? Math.min(state.pulseCount / state.selectedProtocol.pulses, 1)
    : 0;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Session Timer</span>
        <span className={`text-[10px] font-mono font-bold ${state.isPlaying ? 'text-cyan-400' : 'text-slate-500'}`}>
          {state.isPlaying ? 'RUNNING' : 'STOPPED'}
        </span>
      </div>

      {/* Large countdown */}
      <div className="text-center mb-2">
        <div className="text-2xl font-mono font-bold text-white tabular-nums">
          {formatTime(secondsRemaining)}
        </div>
        <div className="text-[9px] text-slate-500">remaining in session</div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-500">
          <span>{state.pulseCount.toLocaleString()} pulses</span>
          <span>{pulsesRemaining.toLocaleString()} left</span>
        </div>
      </div>
    </div>
  );
}
