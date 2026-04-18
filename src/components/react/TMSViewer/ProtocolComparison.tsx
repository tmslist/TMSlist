'use client';

import { useState } from 'react';
import { useTMS } from './TMSContext';
import { protocols } from '../../../data/tmsProtocols';

interface CompactProtocolCardProps {
  protocolName: string;
  frequencyHz: number;
  intensityPct: number;
  pulses: number;
  duration: string;
  color: string;
  selected: boolean;
}

function CompactProtocolCard({
  protocolName,
  frequencyHz,
  intensityPct,
  pulses,
  duration,
  color,
  selected,
}: CompactProtocolCardProps) {
  return (
    <div className={`flex flex-col gap-2 rounded-lg p-3 border ${selected ? 'border-violet-500/60 bg-violet-900/20' : 'border-slate-700/50 bg-slate-800/40'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold ${selected ? 'text-white' : 'text-slate-300'}`}>{protocolName}</span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      </div>

      {/* Frequency bar */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 w-16">Frequency</span>
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${(frequencyHz / 50) * 100}%`, backgroundColor: color }} />
        </div>
        <span className="text-[9px] font-mono text-slate-400">{frequencyHz}Hz</span>
      </div>

      {/* Intensity bar */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 w-16">Intensity</span>
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${(intensityPct / 140) * 100}%`, backgroundColor: color }} />
        </div>
        <span className="text-[9px] font-mono text-slate-400">{intensityPct}%</span>
      </div>

      {/* Pulse count bar */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 w-16">Pulses</span>
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${(pulses / 3000) * 100}%`, backgroundColor: color }} />
        </div>
        <span className="text-[9px] font-mono text-slate-400">{pulses >= 1000 ? `${(pulses / 1000).toFixed(1)}k` : pulses}</span>
      </div>

      <div className="text-[9px] text-slate-500">{duration}</div>
    </div>
  );
}

export function ProtocolComparison() {
  const { state, dispatch } = useTMS();
  const [compareMode, setCompareMode] = useState(false);
  const [primary, setPrimary] = useState(protocols[0]);
  const [secondary, setSecondary] = useState(protocols[1]);

  // Also sync secondary with context's comparisonProtocol if set
  const primaryProtocol = state.selectedProtocol ?? primary;

  const handleToggleCompare = () => {
    const next = !compareMode;
    setCompareMode(next);
    if (!next) {
      dispatch({ type: 'TOGGLE_COMPARISON_FIELD' });
    }
  };

  const handlePrimaryChange = (name: string) => {
    const p = protocols.find(p => p.name === name);
    if (p) {
      setPrimary(p);
      dispatch({ type: 'SELECT_PROTOCOL', protocol: p });
    }
  };

  const handleSecondaryChange = (name: string) => {
    const p = protocols.find(p => p.name === name);
    if (p) {
      setSecondary(p);
      dispatch({ type: 'SELECT_COMPARISON_PROTOCOL', protocol: p });
    }
  };

  const handleToggleField = () => {
    dispatch({ type: 'TOGGLE_COMPARISON_FIELD' });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle button */}
      <button
        onClick={handleToggleCompare}
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
          compareMode
            ? 'bg-violet-600/20 border-violet-500/50 text-violet-300 hover:bg-violet-600/30'
            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Compare Protocols
        {compareMode && <span className="text-violet-400 ml-1">ON</span>}
      </button>

      {/* Comparison panel */}
      {compareMode && (
        <div className="flex flex-col gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-700/40">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Side-by-Side Comparison</div>

          {/* Protocol selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-wider">Primary</label>
              <select
                value={primaryProtocol.name}
                onChange={e => handlePrimaryChange(e.target.value)}
                className="bg-slate-800 border border-slate-700/60 rounded-md px-2 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-violet-500/60"
              >
                {protocols.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-slate-500 uppercase tracking-wider">Comparison</label>
              <select
                value={secondary.name}
                onChange={e => handleSecondaryChange(e.target.value)}
                className="bg-slate-800 border border-slate-700/60 rounded-md px-2 py-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-violet-500/60"
              >
                {protocols.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Protocol cards */}
          <CompactProtocolCard
            protocolName={primaryProtocol.name}
            frequencyHz={primaryProtocol.frequencyHz}
            intensityPct={primaryProtocol.intensityPct}
            pulses={primaryProtocol.pulses}
            duration={primaryProtocol.duration}
            color="#22d3ee"
            selected={true}
          />
          <CompactProtocolCard
            protocolName={secondary.name}
            frequencyHz={secondary.frequencyHz}
            intensityPct={secondary.intensityPct}
            pulses={secondary.pulses}
            duration={secondary.duration}
            color="#f97316"
            selected={false}
          />

          {/* E-field overlay toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">Show comparison E-field on brain</span>
            <button
              onClick={handleToggleField}
              className={`w-8 h-4 rounded-full transition-all duration-200 ${
                state.showComparisonField ? 'bg-violet-600' : 'bg-slate-700'
              }`}
            >
              <div className={`w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${
                state.showComparisonField ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}