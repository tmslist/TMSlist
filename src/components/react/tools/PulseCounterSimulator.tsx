'use client';

import { useState, useEffect, useRef } from 'react';
import { protocols } from '../../../data/tmsProtocols';

export default function PulseCounterSimulator() {
  const [selectedProtocol, setSelectedProtocol] = useState(protocols[0]);
  const [isActive, setIsActive] = useState(false);
  const [pulses, setPulses] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalPulses = selectedProtocol.pulses;
  const totalDurationSec = parseDuration(selectedProtocol.duration);

  function parseDuration(dur: string): number {
    const match = dur.match(/(\d+)\s*min/);
    return match ? parseInt(match[1]) * 60 : 60;
  }

  const msPerPulse = totalDurationSec > 0 ? (totalDurationSec * 1000) / totalPulses : 100;

  const startSim = () => {
    setIsActive(true);
    setPulses(0);
    setElapsed(0);
    intervalRef.current = setInterval(() => {
      setPulses(p => {
        if (p >= totalPulses) {
          stopSim();
          return totalPulses;
        }
        return p + 1;
      });
      setElapsed(e => Math.min(e + msPerPulse / 1000, totalDurationSec));
    }, msPerPulse);
  };

  const stopSim = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
  };

  const reset = () => {
    stopSim();
    setPulses(0);
    setElapsed(0);
  };

  useEffect(() => {
    reset();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [selectedProtocol]);

  const progress = totalPulses > 0 ? (pulses / totalPulses) * 100 : 0;
  const timePct = totalDurationSec > 0 ? (elapsed / totalDurationSec) * 100 : 0;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const allProtocols = protocols.filter(p => p.name !== 'SNT (Stanford Protocol)');

  return (
    <div className="space-y-8">
      {/* Protocol selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allProtocols.map(p => (
          <button
            key={p.name}
            onClick={() => setSelectedProtocol(p)}
            className={`text-left p-4 rounded-xl border transition-all ${
              selectedProtocol.name === p.name
                ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-300'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{p.type}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.evidence === 'Strong' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {p.evidence}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">{p.name}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{p.pulsesDisplay}</span>
              <span className="text-slate-300">·</span>
              <span>{p.duration}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Pulse visualization */}
      <div className="bg-slate-950 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-600/5" />
        <div className="relative">
          {/* Animated pulse rings */}
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="absolute w-32 h-32 rounded-full border-2 border-cyan-400/30"
                  style={{
                    animation: `pulseRing 1.5s ease-out infinite`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="text-center">
            {/* Pulse count */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pulses Delivered</p>
              <p className="text-6xl lg:text-7xl font-bold text-white tracking-tight">
                {pulses.toLocaleString()}
              </p>
              <p className="text-sm text-slate-400 mt-1">of {totalPulses.toLocaleString()} total</p>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #7c3aed)',
                }}
              />
            </div>

            {/* Time */}
            <div className="flex items-center justify-center gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Elapsed</p>
                <p className="text-2xl font-bold text-cyan-400">{formatTime(elapsed)}</p>
              </div>
              <div className="text-slate-600 text-3xl">/</div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Total</p>
                <p className="text-2xl font-bold text-slate-400">{formatTime(totalDurationSec)}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {!isActive ? (
                <button
                  onClick={startSim}
                  className="px-8 py-3.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-600/30 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Start Simulation
                </button>
              ) : (
                <button
                  onClick={stopSim}
                  className="px-8 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-600/30 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
                  Pause
                </button>
              )}
              <button
                onClick={reset}
                className="px-6 py-3.5 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/10"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Speed comparison bar */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Session Duration Comparison</p>
        <div className="space-y-2">
          {allProtocols.map(p => {
            const dur = parseDuration(p.duration);
            const w = totalDurationSec > 0 ? (dur / Math.max(...allProtocols.map(a => parseDuration(a.duration)))) * 100 : 0;
            const isSelected = p.name === selectedProtocol.name;
            return (
              <div key={p.name} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-36 shrink-0">{p.name.split('(')[0].trim()}</span>
                <div className="flex-1 bg-slate-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isSelected ? 'bg-violet-500' : 'bg-slate-300'}`}
                    style={{ width: `${w}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 w-20 text-right">{p.duration}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pulse pattern visualization */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <p className="text-sm font-bold text-slate-700 mb-4">Pulse Pattern: {selectedProtocol.name}</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {selectedProtocol.pulsePattern === 'continuous' && (
            <div className="flex gap-0.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-1 bg-violet-400 rounded-sm"
                  style={{ height: `${24 + Math.sin(i * 0.5) * 12}px`, animation: isActive ? `pulseBar ${0.1 + (i * 0.02)}s ease-in-out infinite alternate` : undefined }}>
                </div>
              ))}
            </div>
          )}
          {selectedProtocol.pulsePattern === 'tbs-burst' && (
            <div className="flex gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  {[3, 3, 3].map((_, j) => (
                    <div key={j} className="w-2 bg-cyan-400 rounded-sm animate-pulse"
                      style={{ height: '28px', animationDelay: `${(i * 3 + j) * 0.1}s` }} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {selectedProtocol.pulsePattern === 'continuous' ? 'Continuous pulses at ' + selectedProtocol.frequencyDisplay
            : 'Theta burst pattern — 3 pulses at 50Hz, repeated at 5Hz theta frequency'}
        </p>
      </div>

      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes pulseBar {
          0% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}