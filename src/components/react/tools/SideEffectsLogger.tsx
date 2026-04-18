'use client';

import { useState } from 'react';

type Severity = 0 | 1 | 2 | 3 | 4;
type SideEffect = {
  name: string;
  description: string;
  prevalence: string;
};

const SIDE_EFFECTS: SideEffect[] = [
  { name: 'Headache', description: 'Scalp or temple pain during or after treatment', prevalence: '~37%' },
  { name: 'Scalp Discomfort', description: 'Tingling, warmth, or soreness at treatment site', prevalence: '~28%' },
  { name: 'Facial Twitching', description: 'Involuntary muscle contractions during pulses', prevalence: '~15%' },
  { name: 'Fatigue', description: 'Tiredness or grogginess after sessions', prevalence: '~20%' },
  { name: 'Dizziness', description: 'Lightheadedness during or after treatment', prevalence: '~10%' },
  { name: 'Nausea', description: 'Stomach queasiness during or after sessions', prevalence: '~5%' },
  { name: 'Insomnia', description: 'Difficulty sleeping, usually temporary', prevalence: '~8%' },
  { name: 'Mood Changes', description: 'Brief irritability or emotional sensitivity', prevalence: '~6%' },
];

const severityLabels: Record<Severity, string> = {
  0: 'None',
  1: 'Mild',
  2: 'Moderate',
  3: 'Significant',
  4: 'Severe',
};

const severityColors: Record<Severity, { bg: string; text: string; dot: string }> = {
  0: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  1: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  2: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  3: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  4: { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
};

interface SessionEntry {
  session: number;
  date: string;
  effects: Record<string, Severity>;
  notes: string;
}

export default function SideEffectsLogger() {
  const [sessions, setSessions] = useState<SessionEntry[]>([
    { session: 1, date: new Date().toISOString().split('T')[0], effects: {}, notes: '' },
  ]);
  const [activeSession, setActiveSession] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const current = sessions.find(s => s.session === activeSession) || sessions[0];

  const setSeverity = (name: string, sev: Severity) => {
    setSessions(prev => prev.map(s =>
      s.session === activeSession
        ? { ...s, effects: { ...s.effects, [name]: sev } }
        : s
    ));
  };

  const addSession = () => {
    const next = sessions.length + 1;
    setSessions(prev => [...prev, {
      session: next,
      date: new Date().toISOString().split('T')[0],
      effects: {},
      notes: '',
    }]);
    setActiveSession(next);
  };

  // Compute trend data
  const trendData = sessions.map(s => {
    const severities = Object.values(s.effects) as Severity[];
    const avg = severities.length > 0
      ? severities.reduce((a, b) => a + b, 0) / severities.length
      : 0;
    return { session: s.session, avg };
  });

  const activeEffects = SIDE_EFFECTS.filter(
    se => (current.effects[se.name] ?? 0) > 0
  );

  // SVG trend chart
  const chartH = 120;
  const chartW = 400;
  const pad = { top: 10, right: 10, bottom: 20, left: 30 };
  const cW = chartW - pad.left - pad.right;
  const cH = chartH - pad.top - pad.bottom;

  if (trendData.length > 0) {
    const maxS = sessions.length;
    const maxSev = 4;
    const toX = (i: number) => pad.left + (i / Math.max(maxS - 1, 1)) * cW;
    const toY = (v: number) => pad.top + ((maxSev - v) / maxSev) * cH;

    const polylinePoints = trendData
      .filter(d => d.avg > 0)
      .map((d, i) => `${toX(d.session - 1)},${toY(d.avg)}`)
      .join(' ');

    const barW = Math.max(cW / (maxS + 1), 8);
    const barGap = (cW - barW * sessions.length) / (sessions.length + 1);

    return (
      <div className="space-y-6">
        {/* Session tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {sessions.map(s => {
            const hasAny = Object.values(s.effects).some(v => v > 0);
            return (
              <button
                key={s.session}
                onClick={() => setActiveSession(s.session)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSession === s.session
                    ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                S{s.session}
                {hasAny && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
          <button onClick={addSession} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
            + Session
          </button>
        </div>

        {/* Trend chart */}
        {trendData.some(d => d.avg > 0) && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Side Effect Severity Trend</p>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
              {/* Grid */}
              {[0, 1, 2, 3, 4].map(v => {
                const y = toY(v);
                return (
                  <g key={v}>
                    <line x1={pad.left} y1={y} x2={chartW - pad.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={pad.left - 6} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{v}</text>
                  </g>
                );
              })}
              {/* Bars */}
              {sessions.map((s, i) => {
                const severities = Object.values(s.effects) as Severity[];
                const avg = severities.length > 0 ? severities.reduce((a, b) => a + b, 0) / severities.length : 0;
                const h = avg > 0 ? (avg / 4) * cH : 2;
                const x = pad.left + barGap + i * (barW + barGap);
                return (
                  <rect
                    key={s.session}
                    x={x}
                    y={pad.top + cH - h}
                    width={barW}
                    height={h}
                    rx="2"
                    fill={avg === 0 ? '#e2e8f0' : avg < 2 ? '#f59e0b' : avg < 3 ? '#f97316' : '#ef4444'}
                    opacity={activeSession === s.session ? 1 : 0.5}
                  />
                );
              })}
              {/* Polyline */}
              {polylinePoints && (
                <polyline points={polylinePoints} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {/* X labels */}
              {sessions.filter((_, i) => i % Math.ceil(sessions.length / 8) === 0).map(s => (
                <text
                  key={s.session}
                  x={pad.left + barGap + (s.session - 1) * (barW + barGap) + barW / 2}
                  y={chartH - 4}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#94a3b8"
                >
                  S{s.session}
                </text>
              ))}
            </svg>
          </div>
        )}

        {/* Session date */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Session Date</label>
          <input
            type="date"
            value={current.date}
            onChange={e => setSessions(prev => prev.map(s =>
              s.session === activeSession ? { ...s, date: e.target.value } : s
            ))}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none w-auto"
          />
        </div>

        {/* Side effect sliders */}
        <div className={expanded ? '' : 'max-h-0 overflow-hidden'}>
          <div className="space-y-3">
            {SIDE_EFFECTS.map(effect => {
              const sev = (current.effects[effect.name] ?? 0) as Severity;
              return (
                <div key={effect.name} className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{effect.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{effect.description}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{effect.prevalence}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 w-16">None</span>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      value={sev}
                      onChange={e => setSeverity(effect.name, parseInt(e.target.value) as Severity)}
                      className="flex-1 accent-violet-600"
                    />
                    <span className="text-xs text-slate-400 w-16 text-right">Severe</span>
                    <span className={`w-14 text-center text-xs font-bold px-2 py-1 rounded-lg ${severityColors[sev].bg} ${severityColors[sev].text}`}>
                      {severityLabels[sev]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
        >
          {expanded ? 'Show less' : 'Show all side effects →'}
        </button>

        {/* Session notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Session Notes</label>
          <textarea
            rows={2}
            value={current.notes}
            onChange={e => setSessions(prev => prev.map(s =>
              s.session === activeSession ? { ...s, notes: e.target.value } : s
            ))}
            placeholder="Mood, sleep, other observations..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none text-sm"
          />
        </div>

        {/* Active effects */}
        {activeEffects.length > 0 && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-xs font-bold text-amber-700 mb-2">Reported Side Effects</p>
            <div className="flex flex-wrap gap-2">
              {activeEffects.map(e => {
                const sev = current.effects[e.name] ?? 0;
                return (
                  <span key={e.name} className={`text-xs font-semibold px-3 py-1.5 rounded-full ${severityColors[sev as Severity].bg} ${severityColors[sev as Severity].text}`}>
                    {e.name}: {severityLabels[sev as Severity]}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Sessions Logged', value: sessions.length },
            { label: 'Avg Severity', value: trendData[trendData.length - 1]?.avg?.toFixed(1) ?? '0.0' },
            { label: 'Active Effects', value: activeEffects.length },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Print */}
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Print / Export Report
        </button>
      </div>
    );
  }

  return null; // fallback
}