'use client';

import { useState } from 'react';

interface Protocol {
  name: string;
  fullName: string;
  type: 'rTMS' | 'dTMS' | 'iTBS' | 'cTBS' | 'Accelerated' | 'SNT';
  frequency: string;
  intensity: string;
  pulses: string;
  duration: string;
  sessionsTotal: number;
  sessionsPerDay: number;
  fdaCleared: string;
  evidence: 'Strong' | 'Moderate' | 'Emerging';
  indication: string;
  pros: string[];
  cons: string[];
  badge?: string;
}

const protocols: Protocol[] = [
  {
    name: 'Standard rTMS',
    fullName: 'High-Frequency rTMS (10Hz)',
    type: 'rTMS',
    frequency: '10 Hz',
    intensity: '120% MT',
    pulses: '3,000 per session',
    duration: '37 min/session',
    sessionsTotal: 36,
    sessionsPerDay: 1,
    fdaCleared: '2008 (MDD)',
    evidence: 'Strong',
    indication: 'Major Depression',
    pros: ['Most studied protocol', 'Wide insurance coverage', 'Well-understood safety profile'],
    cons: ['Daily visits for 6+ weeks', 'Moderate dropout rate (~20%)'],
  },
  {
    name: 'Theta Burst (iTBS)',
    fullName: 'Intermittent Theta Burst Stimulation',
    type: 'iTBS',
    frequency: '50 Hz bursts',
    intensity: '80% MT',
    pulses: '600 pulses',
    duration: '3 min/session',
    sessionsTotal: 30,
    sessionsPerDay: 1,
    fdaCleared: '2018 (MDD)',
    evidence: 'Strong',
    indication: 'MDD (treatment-resistant)',
    pros: ['3-minute sessions', 'Non-inferior to 10Hz in clinical trials', 'FDA-cleared equivalent efficacy'],
    cons: ['80% MT threshold must be precisely set', 'Still requires daily visits'],
    badge: 'Popular',
  },
  {
    name: 'Deep TMS (BrainsWay)',
    fullName: 'High-Frequency Deep TMS (H1 Coil)',
    type: 'dTMS',
    frequency: '10 Hz',
    intensity: '120% MT',
    pulses: '1,980 pulses',
    duration: '20 min/session',
    sessionsTotal: 36,
    sessionsPerDay: 1,
    fdaCleared: '2013 (MDD), 2020 (OCD)',
    evidence: 'Strong',
    indication: 'MDD, OCD',
    pros: ['Reaches deeper brain structures (DLPFC)', 'Broader network activation', 'FDA-cleared for OCD'],
    cons: ['Higher cost per session', 'Requires specialized H1 coil device'],
  },
  {
    name: 'SNT (Stanford Protocol)',
    fullName: 'Stanford Accelerated Intelligent Neuromodulation Therapy (SAINT)',
    type: 'Accelerated',
    frequency: '10 Hz',
    intensity: '90% MT',
    pulses: '1,800 per session',
    duration: '10 min/session',
    sessionsTotal: 50,
    sessionsPerDay: '10 (5 days/week)',
    fdaCleared: 'Not yet cleared',
    evidence: 'Emerging',
    indication: 'Treatment-resistant MDD',
    pros: ['~90% remission rate in SAINT trials', 'Completed in ~2 weeks', 'Works on patients who failed 5+ meds'],
    cons: ['Not FDA-cleared (off-label)', 'Intensive: 10 sessions/day', 'Limited availability', 'Insurance typically does not cover'],
    badge: 'High Efficacy',
  },
  {
    name: 'Low-Frequency (1Hz)',
    fullName: 'Low-Frequency rTMS Right DLPFC',
    type: 'rTMS',
    frequency: '1 Hz',
    intensity: '100% MT',
    pulses: '1,200 pulses',
    duration: '20 min/session',
    sessionsTotal: 30,
    sessionsPerDay: 1,
    fdaCleared: '2012 (MDD)',
    evidence: 'Moderate',
    indication: 'MDD (especially with anxiety)',
    pros: ['Right-sided (avoidsomania risk)', 'May be safer for bipolar patients', 'Good for anxious depression'],
    cons: ['Less robust efficacy data than 10Hz', 'Longer session than iTBS'],
  },
  {
    name: 'cTBS (Ldtn)',
    fullName: 'Continuous Theta Burst / Left DLPFC',
    type: 'cTBS',
    frequency: '50 Hz bursts',
    intensity: '100% MT',
    pulses: '600 pulses',
    duration: '3.5 min/session',
    sessionsTotal: 30,
    sessionsPerDay: 1,
    fdaCleared: 'Research only',
    evidence: 'Emerging',
    indication: 'MDD (investigational)',
    pros: ['Fast application', 'Right-sided inhibitory approach', 'Emerging evidence for working memory'],
    cons: ['Not FDA-cleared', 'Less clinical data than iTBS', 'Variable response rates'],
  },
];

const evidenceColors: Record<string, string> = {
  'Strong': 'bg-emerald-50 text-emerald-700',
  'Moderate': 'bg-amber-50 text-amber-700',
  'Emerging': 'bg-blue-50 text-blue-700',
};

const typeColors: Record<string, string> = {
  'rTMS': 'bg-violet-50 text-violet-700',
  'dTMS': 'bg-cyan-50 text-cyan-700',
  'iTBS': 'bg-emerald-50 text-emerald-700',
  'cTBS': 'bg-amber-50 text-amber-700',
  'Accelerated': 'bg-fuchsia-50 text-fuchsia-700',
  'SNT': 'bg-rose-50 text-rose-700',
};

export default function ProtocolExplorer() {
  const [selected, setSelected] = useState<Protocol | null>(protocols[0]);
  const [filter, setFilter] = useState<string>('All');

  const types = ['All', ...Array.from(new Set(protocols.map(p => p.type)))];
  const filtered = filter === 'All' ? protocols : protocols.filter(p => p.type === filter);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === t
                ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(protocol => (
            <button
              key={protocol.name}
              onClick={() => setSelected(protocol)}
              className={`w-full text-left rounded-xl p-4 border transition-all ${
                selected?.name === protocol.name
                  ? 'bg-violet-50 border-violet-300 ring-1 ring-violet-200'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-bold text-slate-900">{protocol.fullName}</h4>
                {protocol.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 text-white px-1.5 py-0.5 rounded">{protocol.badge}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[protocol.type]}`}>{protocol.type}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${evidenceColors[protocol.evidence]}`}>{protocol.evidence} Evidence</span>
              </div>
              <div className="text-xs text-slate-400 mt-2">{protocol.sessionsTotal} sessions · {protocol.fdaCleared}</div>
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selected.fullName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeColors[selected.type]}`}>{selected.type}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${evidenceColors[selected.evidence]}`}>{selected.evidence} Evidence</span>
                    <span className="text-xs text-slate-500">· FDA: {selected.fdaCleared}</span>
                  </div>
                </div>
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'Frequency', value: selected.frequency },
                  { label: 'Intensity', value: selected.intensity },
                  { label: 'Pulses', value: selected.pulses },
                  { label: 'Duration', value: selected.duration },
                ].map(param => (
                  <div key={param.label} className="bg-slate-50 rounded-xl p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{param.label}</div>
                    <div className="text-sm font-bold text-slate-800">{param.value}</div>
                  </div>
                ))}
              </div>

              {/* Sessions */}
              <div className="bg-violet-50 rounded-xl p-4 mb-6">
                <div className="text-sm font-semibold text-violet-700 mb-1">Treatment Schedule</div>
                <div className="text-xs text-violet-600">{selected.sessionsTotal} total sessions · {selected.sessionsPerDay}</div>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Pros</p>
                  <ul className="space-y-1">
                    {selected.pros.map(p => (
                      <li key={p} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-emerald-500 mt-0.5">✓</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">Cons</p>
                  <ul className="space-y-1">
                    {selected.cons.map(c => (
                      <li key={c} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-rose-400 mt-0.5">−</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">Select a protocol to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}