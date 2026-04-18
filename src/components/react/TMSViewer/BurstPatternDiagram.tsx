'use client';

import { useTMS } from './TMSContext';

export function BurstPatternDiagram() {
  const { state } = useTMS();
  const pattern = state.selectedProtocol?.pulsePattern ?? 'continuous';

  if (pattern === 'single') {
    return (
      <div className="bg-slate-800/50 rounded-lg p-2.5">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pulse Pattern</div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-4 bg-cyan-400 rounded-sm" />
          <span className="text-[9px] text-slate-500 ml-1">Single pulse</span>
        </div>
      </div>
    );
  }

  if (pattern === 'tbs-burst' || pattern === 'ctbs') {
    // iTBS: 3-pulse burst every 2s (on) / 200ms (interval)
    // Show 3 bursts
    const bursts = pattern === 'tbs-burst' ? 3 : 10;
    const label = pattern === 'tbs-burst' ? 'iTBS: 3 pulses at 50Hz × 3 bursts' : 'cTBS: 3 pulses at 50Hz continuous';

    return (
      <div className="bg-slate-800/50 rounded-lg p-2.5">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pulse Pattern</div>
        <div className="flex items-end gap-px h-6">
          {Array.from({ length: bursts }).map((_, bi) => (
            <div key={bi} className="flex gap-px">
              {[0, 20, 40].map(offset => (
                <div
                  key={offset}
                  className="w-1 bg-cyan-400 rounded-sm"
                  style={{ height: '8px', animationDelay: `${bi * 3 + offset / 20}s` }}
                />
              ))}
              {pattern === 'tbs-burst' && (
                <div className="w-8 bg-transparent" />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          {pattern === 'tbs-burst' ? (
            <>
              <div className="flex gap-px">
                {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-2 bg-cyan-400/40 rounded-sm" />)}
              </div>
              <span className="text-[9px] text-slate-500">→ 2s off → repeat</span>
            </>
          ) : (
            <span className="text-[9px] text-slate-500">3 pulses at 50Hz · continuous</span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1">
          <div className="flex gap-px">
            {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-2 bg-cyan-400/40 rounded-sm" />)}
          </div>
          <span className="text-[9px] text-slate-500">50Hz burst = 20ms interval</span>
        </div>
      </div>
    );
  }

  // Continuous (rTMS)
  const dots = 20;
  return (
    <div className="bg-slate-800/50 rounded-lg p-2.5">
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pulse Pattern</div>
      <div className="flex items-end gap-0.5 h-6">
        {Array.from({ length: dots }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-violet-400/60 rounded-sm animate-pulse"
            style={{
              height: `${4 + Math.sin(i * 0.8) * 4}px`,
              animationDelay: `${i * (1000 / state.frequency) / 200}ms`,
            }}
          />
        ))}
        <span className="text-[9px] text-slate-500 ml-1">× {state.frequency} Hz</span>
      </div>
      <div className="mt-1 text-[9px] text-slate-500">
        {state.frequency} Hz = 1 pulse every {Math.round(1000 / state.frequency)}ms
      </div>
    </div>
  );
}
