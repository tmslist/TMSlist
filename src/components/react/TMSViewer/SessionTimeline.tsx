'use client';

import { useTMS } from './TMSContext';

export function SessionTimeline() {
  const { state } = useTMS();
  const sessions = state.selectedProtocol?.sessionsTotal ?? 36;
  const activeSession = Math.min(Math.floor(state.pulseCount / 100) + 1, sessions);
  const sessionProgress = Math.round((activeSession / sessions) * 100);
  const weeks = Math.round(sessions / 5); // ~5 sessions/week
  const remaining = Math.max(0, sessions - activeSession);

  // Decide which session nodes to show — always show first, last, and active ± 1
  const showNode = (i: number) => {
    const idx = i + 1;
    return idx === 1 || idx === sessions || idx === activeSession || idx === activeSession - 1 || idx === activeSession + 1;
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-5 py-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Treatment Course</div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {activeSession === sessions ? 'Course complete!' : `${remaining} session${remaining === 1 ? '' : 's'} remaining`}
            {' · '}{weeks} weeks total
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-white">{activeSession}</div>
          <div className="text-[9px] text-slate-500">of {sessions}</div>
        </div>
      </div>

      {/* Horizontal timeline */}
      <div className="relative">
        {/* Track line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700 rounded-full" />

        {/* Progress line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${sessionProgress}%` }}
        />

        {/* Session nodes */}
        <div className="relative flex items-center justify-between">
          {Array.from({ length: Math.min(sessions, 18) }).map((_, i) => {
            const idx = i + 1;
            const progress = (idx / sessions) * 100;
            const isActive = idx === activeSession;
            const isPast = idx < activeSession;
            const isFuture = idx > activeSession;
            const show = showNode(i);

            if (!show) {
              // Skip marker for middle sessions
              if (i === 1 || i === Math.min(sessions, 18) - 2) {
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-4 h-4" />
                    <span className="text-[8px] text-slate-600 mt-1">...</span>
                  </div>
                );
              }
              return null;
            }

            return (
              <div key={i} className="flex flex-col items-center">
                {/* Node circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300 ${
                    isActive
                      ? 'bg-cyan-400 border-cyan-300 text-slate-900 shadow-lg shadow-cyan-400/40 scale-110'
                      : isPast
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-500'
                  }`}
                >
                  {isActive ? (
                    <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                  ) : (
                    idx
                  )}
                </div>
                {/* Label */}
                <span className={`text-[8px] mt-1.5 ${isActive ? 'text-cyan-300 font-semibold' : isPast ? 'text-slate-500' : 'text-slate-600'}`}>
                  {idx === 1 ? 'Start' : idx === sessions ? 'End' : idx}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar below */}
      <div className="mt-4 space-y-1.5">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${sessionProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-0.5 bg-violet-500 rounded-full" />
            <span className="text-[9px] text-slate-500">{activeSession} sessions complete</span>
          </div>
          <span className="text-[9px] text-slate-500">{sessionProgress}% complete</span>
        </div>
      </div>
    </div>
  );
}
