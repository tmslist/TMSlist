'use client';

import { useTMS } from './TMSContext';

export function DosimetryDisplay() {
  const { state } = useTMS();

  // Calculate dose: pulseCount * (intensity/100) * 0.015 J
  const estimatedDose = (state.pulseCount * (state.intensity / 100) * 0.015).toFixed(1);

  // Pulses per minute based on frequency and pattern
  const pulsesPerMinute = (() => {
    const pattern = state.selectedProtocol?.pulsePattern ?? 'continuous';
    if (pattern === 'single') return 0;
    if (pattern === 'tbs-burst') {
      return Math.round((3 * 10) / 2 * 60);
    }
    if (pattern === 'ctbs') {
      return 900;
    }
    return Math.round(state.frequency * 60);
  })();

  const totalCourse = state.selectedProtocol?.pulses ?? 3000;
  const sessionProgress = totalCourse > 0 ? Math.min((state.pulseCount / totalCourse) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Dose Metrics — 3 columns */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Dose</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${state.isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-[9px] text-slate-500 uppercase">{state.isPlaying ? 'Active' : 'Idle'}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Total pulses */}
          <div className="text-center">
            <div className="text-xl font-mono font-bold text-cyan-300 leading-none">{state.pulseCount.toLocaleString()}</div>
            <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Pulses</div>
          </div>

          {/* Estimated dose */}
          <div className="text-center border-x border-slate-700/50">
            <div className="text-xl font-mono font-bold text-violet-300 leading-none">
              {estimatedDose}
              <span className="text-xs text-slate-500 ml-0.5">J</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">Est. Dose</div>
          </div>

          {/* Pulses per minute */}
          <div className="text-center">
            <div className="text-xl font-mono font-bold text-emerald-300 leading-none">{pulsesPerMinute}</div>
            <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-wider">/min</div>
          </div>
        </div>
      </div>

      {/* Session progress */}
      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Session Progress</span>
          <span className="text-[10px] font-mono font-bold text-slate-300">{sessionProgress.toFixed(1)}%</span>
        </div>

        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            state.isPlaying ? 'shadow-[0_0_8px_rgba(34,211,238,0.4)]' : ''
          }`}
          style={{
            background: sessionProgress > 80
              ? 'linear-gradient(90deg, #22d3ee, #a78bfa)'
              : sessionProgress > 50
              ? 'linear-gradient(90deg, #22d3ee, #22c55e)'
              : '#22d3ee',
          }}
        />

        <div className="flex justify-between mt-1.5">
          <span className="text-[8px] text-slate-600">{state.pulseCount.toLocaleString()} delivered</span>
          <span className="text-[8px] text-slate-600">{totalCourse.toLocaleString()} target</span>
        </div>
      </div>
    </div>
  );
}
