'use client';

import { useState } from 'react';
import { protocols, protocolTypeColors, evidenceColors, type TMSProtocol } from '../../../data/tmsProtocols';

interface ProtocolCardProps {
  protocol: TMSProtocol;
  isActive: boolean;
  onClick: () => void;
}

function ProtocolCard({ protocol, isActive, onClick }: ProtocolCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-5 transition-all duration-200 hover-lift ${
        isActive
          ? 'bg-slate-800/80 border-violet-500/50 shadow-lg shadow-violet-900/20'
          : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h4 className="text-[11px] font-bold text-white leading-tight">{protocol.fullName}</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">{protocol.name}</p>
        </div>
        {protocol.badge && (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-violet-900/50 text-violet-300 border border-violet-700/30">
            {protocol.badge}
          </span>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${protocolTypeColors[protocol.type]}`}>
          {protocol.type}
        </span>
        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${evidenceColors[protocol.evidence]}`}>
          {protocol.evidence}
        </span>
      </div>

      {/* Key Parameters */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600 mb-0.5">Frequency</p>
          <p className="text-[11px] font-bold text-white">{protocol.frequencyDisplay}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600 mb-0.5">Intensity</p>
          <p className="text-[11px] font-bold text-white">{protocol.intensityDisplay}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600 mb-0.5">Pulses</p>
          <p className="text-[11px] font-bold text-white">{protocol.pulsesDisplay}</p>
        </div>
        <div className="bg-slate-900/50 rounded-lg p-2">
          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600 mb-0.5">Duration</p>
          <p className="text-[11px] font-bold text-white">{protocol.duration}</p>
        </div>
      </div>

      {/* Indication */}
      <div className="bg-slate-900/30 rounded-lg p-2 mb-3">
        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600 mb-0.5">Indication</p>
        <p className="text-[10px] text-slate-300 leading-relaxed">{protocol.indication}</p>
      </div>

      {/* Pros/Cons */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-500/70 mb-1">Pros</p>
          <ul className="space-y-0.5">
            {protocol.pros.slice(0, 2).map(p => (
              <li key={p} className="text-[9px] text-slate-400 leading-relaxed flex items-start gap-1">
                <span className="text-emerald-500 shrink-0 mt-0.5">+</span>
                {p.length > 50 ? p.slice(0, 48) + '...' : p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-rose-500/70 mb-1">Cons</p>
          <ul className="space-y-0.5">
            {protocol.cons.slice(0, 2).map(c => (
              <li key={c} className="text-[9px] text-slate-400 leading-relaxed flex items-start gap-1">
                <span className="text-rose-400 shrink-0 mt-0.5">−</span>
                {c.length > 50 ? c.slice(0, 48) + '...' : c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* FDA & Sessions footer */}
      <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between">
        <span className="text-[9px] text-slate-500">
          FDA: {protocol.fdaCleared}
        </span>
        <span className="text-[9px] text-slate-500">
          {protocol.sessionsTotal} sessions
        </span>
      </div>
    </button>
  );
}

export default function ProtocolAcademy() {
  const [selected, setSelected] = useState<TMSProtocol>(protocols[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold text-white mb-2">Protocol Academy</h3>
        <p className="text-[11px] text-slate-400 max-w-lg mx-auto">
          Explore the six primary TMS protocols used clinically. Each targets different brain regions
          with distinct stimulation parameters optimized for specific conditions.
        </p>
      </div>

      {/* Protocol Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {protocols.map(protocol => (
          <ProtocolCard
            key={protocol.name}
            protocol={protocol}
            isActive={selected?.name === protocol.name}
            onClick={() => setSelected(protocol)}
          />
        ))}
      </div>

      {/* Selected Protocol Detail */}
      {selected && (
        <div className="glass-panel rounded-2xl p-6 animate-entrance">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white">{selected.fullName}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${protocolTypeColors[selected.type]}`}>
                  {selected.type}
                </span>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${evidenceColors[selected.evidence]}`}>
                  {selected.evidence} Evidence
                </span>
                <span className="text-[10px] text-slate-500">· FDA: {selected.fdaCleared}</span>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Frequency', value: selected.frequencyDisplay },
              { label: 'Intensity', value: selected.intensityDisplay },
              { label: 'Pulses', value: selected.pulsesDisplay },
              { label: 'Duration', value: selected.duration },
            ].map(param => (
              <div key={param.label} className="bg-slate-900/60 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">{param.label}</p>
                <p className="text-[11px] font-bold text-white leading-tight">{param.value}</p>
              </div>
            ))}
          </div>

          {/* Sessions */}
          <div className="bg-violet-900/20 border border-violet-800/30 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70 mb-1">Treatment Schedule</p>
                <p className="text-sm font-semibold text-white">{selected.sessionsTotal} total sessions · {selected.sessionsPerDay}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70 mb-1">Indication</p>
                <p className="text-sm font-semibold text-white">{selected.indication}</p>
              </div>
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 mb-3 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Advantages
              </p>
              <ul className="space-y-2">
                {selected.pros.map(p => (
                  <li key={p} className="text-[11px] text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400/70 mb-3 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="#fb7185" strokeWidth="1.5" strokeLinecap="round"/></svg>
                Considerations
              </p>
              <ul className="space-y-2">
                {selected.cons.map(c => (
                  <li key={c} className="text-[11px] text-slate-300 flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5 shrink-0">−</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
