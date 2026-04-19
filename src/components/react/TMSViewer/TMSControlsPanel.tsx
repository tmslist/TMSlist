'use client';

import { useState } from 'react';
import { useTMS } from './TMSContext';
import { protocols, protocolTypeColors } from '../../../data/tmsProtocols';
import { useToneGenerator } from '../../../hooks/useToneGenerator';

interface InfoTooltipProps {
  text: string;
}

function InfoTooltip({ text }: InfoTooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-700/80 border border-slate-600/50 text-slate-500 hover:text-slate-300 hover:bg-slate-600 transition-colors cursor-help"
        aria-label={`Info: ${text}`}
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-900/98 border border-slate-600/50 rounded-xl px-3 py-2 text-[9px] text-slate-300 leading-relaxed shadow-xl z-50 pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/98 border-r border-b border-slate-600/50 rotate-45 -mt-1" />
        </div>
      )}
    </span>
  );
}

export function TMSControlsPanel() {
  const { state, dispatch } = useTMS();
  const { fireClick } = useToneGenerator();

  const handlePlayToggle = () => {
    if (!state.isPlaying) fireClick();
    dispatch({ type: 'TOGGLE_PLAY' });
  };

  const handleReset = () => {
    dispatch({ type: 'STOP_PLAYING' });
    dispatch({ type: 'RESET_PULSE_COUNT' });
  };

  const selectedProto = state.selectedProtocol;

  return (
    <div className="flex flex-col gap-4">
      {/* Fire / Stop */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
            Pulse Control
            <InfoTooltip text="Each pulse is a brief magnetic discharge from the coil that activates cortical neurons. Press Fire to start a continuous train, or Stop to halt." />
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePlayToggle}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              state.isPlaying
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                : 'bg-gradient-to-r from-violet-600 to-violet-600 border border-violet-500 text-white hover:from-violet-500 hover:to-violet-500 shadow-lg shadow-violet-600/25'
            }`}
          >
            {state.isPlaying ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                Stop Firing
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Fire Pulses
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-3 rounded-xl border border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
            title="Reset pulse count"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Protocol selector */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
            Clinical Protocol
            <InfoTooltip text="Different TMS protocols deliver stimulation at different frequencies and intensities. Standard rTMS (10Hz) is most common for depression. Theta burst (iTBS) is faster — only 3 minutes per session." />
          </span>
        </div>
        <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
          {protocols.map(p => (
            <button
              key={p.name}
              onClick={() => dispatch({ type: 'SELECT_PROTOCOL', protocol: p })}
              className={`text-left px-3 py-2.5 rounded-xl border text-[11px] transition-all ${
                selectedProto?.name === p.name
                  ? 'bg-violet-600/25 border-violet-500/50 text-white shadow-sm'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${protocolTypeColors[p.type]}`}>{p.type}</span>
                  {p.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{p.badge}</span>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {p.frequencyDisplay} · {p.intensityDisplay} · {p.duration}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
            Frequency (Hz)
            <InfoTooltip text="Pulses per second. 1Hz = 1 pulse/sec (inhibitory, slows neurons down). 10Hz = 10 pulses/sec (excitatory, activates neurons). Higher Hz = faster stimulation." />
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">{state.frequency} Hz</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={50}
          step={0.5}
          value={state.frequency}
          onChange={e => dispatch({ type: 'SET_FREQUENCY', frequency: parseFloat(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
        />
        <div className="flex justify-between mt-1 text-[8px] text-slate-600">
          <span>0.5 Hz<br/><span className="text-slate-700">Slow</span></span>
          <span className="text-center">10 Hz<br/><span className="text-cyan-600/70">Standard</span></span>
          <span className="text-right">50 Hz<br/><span className="text-slate-700">Fast burst</span></span>
        </div>
      </div>

      {/* Intensity */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
            Intensity (% MT)
            <InfoTooltip text="% of your Motor Threshold — the minimum stimulation needed to cause a muscle twitch. 100% MT = reliable activation. 120% MT = standard clinical dose. Below 80% = subthreshold." />
          </span>
          <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">{state.intensity}% MT</span>
        </div>
        <input
          type="range"
          min={60}
          max={140}
          step={5}
          value={state.intensity}
          onChange={e => dispatch({ type: 'SET_INTENSITY', intensity: parseInt(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
        />
        <div className="flex justify-between mt-1 text-[8px] text-slate-600">
          <span>60%<br/><span className="text-slate-700">Subthreshold</span></span>
          <span className="text-center">100%<br/><span className="text-cyan-600/70">Motor threshold</span></span>
          <span className="text-right">140%<br/><span className="text-slate-700">High dose</span></span>
        </div>
      </div>

      {/* Coil Angle + Depth */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
              Angle
              <InfoTooltip text="The tilt of the coil. 0° = perpendicular to scalp (strongest field). 45° = angled (reduces field strength but may reach different cortical regions)." />
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-400">{state.coilAngle}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={45}
            step={1}
            value={state.coilAngle}
            onChange={e => dispatch({ type: 'SET_COIL_ANGLE', angle: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider flex items-center">
              Depth
              <InfoTooltip text="How close the coil is to the scalp surface. Higher = coil pressed in deeper (stronger field at cortex, but less focal). Lower = further away (weaker but more precise)." />
            </span>
            <span className="text-[10px] font-mono font-bold text-cyan-400">{state.coilDepth.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={state.coilDepth}
            onChange={e => dispatch({ type: 'SET_COIL_DEPTH', depth: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      {/* Brain region hover info */}
      {state.hoveredRegion ? (
        <div className="bg-violet-500/10 border border-violet-500/25 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">Active Region</span>
            <span className="text-[9px] text-slate-500 font-mono">{state.hoveredRegion.brodmannArea}</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-200 mb-1">{state.hoveredRegion.name}</div>
          <p className="text-[9px] text-slate-400 leading-relaxed">{state.hoveredRegion.clinicalNote}</p>
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-dashed border-slate-700/50 rounded-xl px-3 py-2.5 text-center">
          <p className="text-[9px] text-slate-600">Hover over the brain surface to identify cortical regions and their clinical relevance.</p>
        </div>
      )}

      {/* Summary card for selected protocol */}
      {selectedProto && (
        <div className="bg-slate-900/80 border border-slate-700/40 rounded-xl px-4 py-3">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Protocol Summary</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-cyan-400 font-mono">{selectedProto.frequencyDisplay}</div>
              <div className="text-[8px] text-slate-600 mt-0.5">Frequency</div>
            </div>
            <div className="border-x border-slate-700/50">
              <div className="text-sm font-bold text-violet-400 font-mono">{selectedProto.intensityDisplay}</div>
              <div className="text-[8px] text-slate-600 mt-0.5">Intensity</div>
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-400 font-mono">{selectedProto.duration}</div>
              <div className="text-[8px] text-slate-600 mt-0.5">Per Session</div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[8px] text-slate-600">{selectedProto.pulsesDisplay}</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
              selectedProto.evidence === 'Strong' ? 'bg-emerald-500/20 text-emerald-400' :
              selectedProto.evidence === 'Moderate' ? 'bg-amber-500/20 text-amber-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>{selectedProto.evidence} evidence</span>
          </div>
        </div>
      )}
    </div>
  );
}
