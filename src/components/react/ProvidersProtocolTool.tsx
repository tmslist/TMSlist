'use client';

import { useState, useMemo } from 'react';
import { protocols, TMSProtocol, protocolTypeColors, evidenceColors } from '../../data/tmsProtocols';

type IndicationFilter = 'all' | 'Depression' | 'OCD' | 'Anxiety' | 'PTSD';
type EvidenceFilter = 'all' | 'Strong' | 'Moderate' | 'Emerging';
type SortKey = 'duration' | 'sessions' | 'evidence';

const indicationMap: Record<string, string[]> = {
  'Standard rTMS': ['Depression'],
  'Theta Burst (iTBS)': ['Depression'],
  'Deep TMS (BrainsWay)': ['Depression', 'OCD'],
  'SNT (Stanford Protocol)': ['Depression'],
  'Low-Frequency (1Hz)': ['Depression', 'Anxiety'],
  'cTBS (Ldtn)': ['Depression'],
};

const insuranceMap: Record<string, string> = {
  'Standard rTMS': 'Most Likely',
  'Theta Burst (iTBS)': 'Most Likely',
  'Deep TMS (BrainsWay)': 'Likely',
  'SNT (Stanford Protocol)': 'Variable',
  'Low-Frequency (1Hz)': 'Likely',
  'cTBS (Ldtn)': 'Variable',
};

const indicationBadgeColors: Record<string, string> = {
  'Depression': 'bg-emerald-100 text-emerald-700',
  'OCD': 'bg-violet-100 text-violet-700',
  'Anxiety': 'bg-amber-100 text-amber-700',
  'PTSD': 'bg-rose-100 text-rose-700',
};

const indicationMatchIcons: Record<string, string> = {
  'Depression': 'text-emerald-500',
  'OCD': 'text-violet-500',
  'Anxiety': 'text-amber-500',
  'PTSD': 'text-rose-500',
};

export default function ProvidersProtocolTool() {
  const [indicationFilter, setIndicationFilter] = useState<IndicationFilter>('all');
  const [evidenceFilter, setEvidenceFilter] = useState<EvidenceFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('sessions');
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = protocols.filter(p => {
      const matchesIndication = indicationFilter === 'all' ||
        indicationMap[p.name]?.includes(indicationFilter);
      const matchesEvidence = evidenceFilter === 'all' || p.evidence === evidenceFilter;
      return matchesIndication && matchesEvidence;
    });

    result = [...result].sort((a, b) => {
      if (sortKey === 'sessions') return a.sessionsTotal - b.sessionsTotal;
      if (sortKey === 'duration') {
        const durA = parseInt(a.duration);
        const durB = parseInt(b.duration);
        return durA - durB;
      }
      const order = { Strong: 0, Moderate: 1, Emerging: 2 };
      return order[a.evidence] - order[b.evidence];
    });

    return result;
  }, [indicationFilter, evidenceFilter, sortKey]);

  const selectedProtocol = expandedProtocol
    ? protocols.find(p => p.name === expandedProtocol) ?? null
    : null;

  const evidenceOrder = (e: string) => ({ Strong: 0, Moderate: 1, Emerging: 2 }[e] ?? 3);

  return (
    <div className="space-y-8">
      {/* Filter Controls */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="flex flex-wrap gap-2 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2 self-center">Indication:</span>
            {(['all', 'Depression', 'OCD', 'Anxiety', 'PTSD'] as IndicationFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setIndicationFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  indicationFilter === f
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2 self-center">Evidence:</span>
            {(['all', 'Strong', 'Moderate', 'Emerging'] as EvidenceFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setEvidenceFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  evidenceFilter === f
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort by:</span>
          {([
            { key: 'sessions' as SortKey, label: 'Sessions' },
            { key: 'duration' as SortKey, label: 'Duration' },
            { key: 'evidence' as SortKey, label: 'Evidence Level' },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => setSortKey(s.key)}
              className={`text-[10px] font-semibold px-3 py-1 rounded-full transition-all ${
                sortKey === s.key
                  ? 'bg-slate-700 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-500">{filtered.length} protocols</span>
        </div>
      </div>

      {/* Protocol Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/60">
              {['Protocol', 'Frequency', 'Intensity', 'Sessions', 'Duration', 'Indication', 'Evidence', 'Insurance'].map((h, i) => (
                <th key={h} className={`text-left text-[10px] font-bold uppercase tracking-wider px-4 py-3 ${i === 0 ? 'pl-6' : ''}`}>
                  <span className="text-slate-400">{h}</span>
                </th>
              ))}
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(protocol => {
              const isExpanded = expandedProtocol === protocol.name;
              return (
                <tr
                  key={protocol.name}
                  className={`border-b border-slate-800/80 cursor-pointer transition-colors group ${
                    isExpanded ? 'bg-violet-900/20' : 'hover:bg-slate-800/40'
                  }`}
                  onClick={() => setExpandedProtocol(isExpanded ? null : protocol.name)}
                >
                  {/* Protocol name + badge */}
                  <td className="pl-6 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{protocol.name}</span>
                      {protocol.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-900/40 text-cyan-300 uppercase tracking-wider">
                          {protocol.badge}
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${protocolTypeColors[protocol.type]}`}>
                      {protocol.type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] text-slate-300">{protocol.frequencyDisplay}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] text-slate-300">{protocol.intensityDisplay}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] text-slate-300">{protocol.sessionsTotal}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] text-slate-300">{protocol.duration}</span>
                  </td>
                  {/* Indication matches */}
                  <td className="px-4 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {['Depression', 'OCD', 'Anxiety', 'PTSD'].map(ind => {
                        const has = indicationMap[protocol.name]?.includes(ind);
                        return (
                          <span
                            key={ind}
                            className="text-[10px] font-bold w-5 text-center"
                            title={ind}
                          >
                            <span className={has ? indicationMatchIcons[ind] : 'text-slate-600'}>
                              {has ? '✓' : '○'}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${evidenceColors[protocol.evidence]}`}>
                      {protocol.evidence}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[10px] text-slate-400">{insuranceMap[protocol.name]}</span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/simulation?protocol=${encodeURIComponent(protocol.name)}`;
                      }}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 border border-cyan-600/30 hover:border-cyan-400/50 rounded-lg px-3 py-1.5 transition-all bg-cyan-900/20 hover:bg-cyan-900/30 whitespace-nowrap"
                    >
                      Simulate
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedProtocol && (
        <div className="glass-panel rounded-2xl p-6 border border-violet-500/20">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">{selectedProtocol.fullName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${protocolTypeColors[selectedProtocol.type]}`}>
                  {selectedProtocol.type}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${evidenceColors[selectedProtocol.evidence]}`}>
                  {selectedProtocol.evidence} Evidence
                </span>
                <span className="text-[10px] text-slate-400 ml-2">
                  {selectedProtocol.fdaCleared}
                </span>
              </div>
            </div>
            <button
              onClick={() => setExpandedProtocol(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Key Parameters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Frequency', value: selectedProtocol.frequencyDisplay },
              { label: 'Intensity', value: selectedProtocol.intensityDisplay },
              { label: 'Sessions', value: String(selectedProtocol.sessionsTotal) },
              { label: 'Duration', value: selectedProtocol.duration },
            ].map(param => (
              <div key={param.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/30">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">{param.label}</p>
                <p className="text-sm font-bold text-cyan-400">{param.value}</p>
              </div>
            ))}
          </div>

          {/* Pros / Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">Clinical Advantages</p>
              <ul className="space-y-1.5">
                {selectedProtocol.pros.map(p => (
                  <li key={p} className="text-[11px] text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">+</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">Considerations</p>
              <ul className="space-y-1.5">
                {selectedProtocol.cons.map(c => (
                  <li key={c} className="text-[11px] text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">−</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Patient Selection Tips */}
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Clinical Tips</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-1">Best For</p>
                <p className="text-[11px] text-slate-300">
                  {selectedProtocol.type === 'Accelerated'
                    ? 'Treatment-resistant patients who have failed 5+ medications'
                    : selectedProtocol.type === 'iTBS'
                    ? 'Patients seeking faster treatment, working individuals'
                    : selectedProtocol.type === 'dTMS'
                    ? 'Patients with treatment-resistant depression, OCD'
                    : 'Standard depression cases, good insurance coverage'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-1">Side Effects</p>
                <p className="text-[11px] text-slate-300">
                  {selectedProtocol.type === 'cTBS' || selectedProtocol.type === 'iTBS'
                    ? 'Scalp discomfort at site, rare headache. Generally well tolerated.'
                    : selectedProtocol.type === 'Accelerated'
                    ? 'Fatigue common. Risk of mania in bipolar patients. Requires monitoring.'
                    : 'Mild scalp discomfort, occasional headache. Low seizure risk (~0.01%).'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mb-1">Billing Code</p>
                <p className="text-[11px] text-slate-300">
                  {selectedProtocol.type === 'iTBS' || selectedProtocol.type === 'cTBS'
                    ? 'CPT 90867 + 90868 (rTMS delivery, sessions 1-36)'
                    : selectedProtocol.name === 'SNT (Stanford Protocol)'
                    ? 'Off-label — may need 90899 with prior auth'
                    : 'CPT 90867 (initial), 90868 (delivery per session)'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={() => { window.location.href = `/simulation?protocol=${encodeURIComponent(selectedProtocol.name)}`; }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Open in Simulation
            </button>
            <button
              onClick={() => { setExpandedProtocol(null); }}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px] font-bold rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}