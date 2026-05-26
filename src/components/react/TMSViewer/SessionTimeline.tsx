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
    <div className="glass-panel rounded-2xl px-5 py-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Treatment Course</div>
          <div className="text-[9px] text-white/40 mt-0.5">
            {activeSession === sessions ? 'Course complete!' : `${remaining} session${remaining === 1 ? '' : 's'} remaining`}
            {' · '}{weeks} weeks total
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-white">{activeSession}</div>
          <div className="text-[9px] text-white/40">of {sessions}</div>
        </div>
      </div>

      {/* Horizontal timeline */}
      <div className="relative">
        {/* Track line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-[var(--paper2)] rounded-full" />

        {/* Progress line */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-[var(--ink2)] to-[var(--warm)] rounded-full transition-all duration-500"
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
                    <span className="text-[8px] text-white/40 mt-1">...</span>
                  </div>
                );
              }
              return null;
            }

            return (
              <div key={i} className="flex flex-col items-center">
                {/* Node circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                    isActive
                      ? 'bg-[var(--paper2)] border-[var(--line)] text-[var(--warm)] shadow-lg shadow-[rgba(10,22,40,0.2)] scale-110'
                      : isPast
                      ? 'bg-[var(--ink2)] border-[var(--ink2)] text-white'
                      : 'bg-[var(--paper2)] border-[var(--line)] text-white/40'
                  }`}
                >
                  {isActive ? (
                    <div className="w-2 h-2 rounded-full bg-[var(--ink2)] animate-pulse" />
                  ) : (
                    idx
                  )}
                </div>
                {/* Label */}
                <span className={`text-[8px] mt-1.5 ${isActive ? 'text-[var(--warm)] font-semibold' : isPast ? 'text-white/40' : 'text-white/40'}`}>
                  {idx === 1 ? 'Start' : idx === sessions ? 'End' : idx}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress bar below */}
      <div className="mt-4 space-y-1.5">
        <div className="h-1.5 bg-[var(--paper2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--ink2)] to-[var(--warm)] rounded-full transition-all duration-500"
            style={{ width: `${sessionProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-0.5 bg-[var(--ink2)] rounded-full" />
            <span className="text-[9px] text-white/40">{activeSession} sessions complete</span>
          </div>
          <span className="text-[9px] text-white/40">{sessionProgress}% complete</span>
        </div>
      </div>
    </div>
  );
}
