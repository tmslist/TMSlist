'use client';

import { useState } from 'react';

type Severity = 'none' | 'mild' | 'moderate' | 'severe';
type SideEffect = {
  name: string;
  description: string;
  severity: Severity;
  notes: string;
  prevalence: string;
};

const SIDE_EFFECTS: Omit<SideEffect, 'severity' | 'notes'>[] = [
  { name: 'Headache', description: 'Scalp or temple pain during or after treatment', prevalence: '~37% of patients' },
  { name: 'Scalp Discomfort', description: 'Tingling, warmth, or soreness at the treatment site', prevalence: '~28% of patients' },
  { name: 'Facial Twitching', description: 'Involuntary muscle contractions in the face during pulses', prevalence: '~15% of patients' },
  { name: 'Fatigue', description: 'Tiredness or grogginess after treatment sessions', prevalence: '~20% of patients' },
  { name: 'Dizziness', description: 'Lightheadedness or unsteadiness during/after treatment', prevalence: '~10% of patients' },
  { name: 'Nausea', description: 'Stomach queasiness during or after sessions', prevalence: '~5% of patients' },
  { name: 'Insomnia', description: 'Difficulty sleeping, usually temporary', prevalence: '~8% of patients' },
  { name: 'Mood Changes', description: 'Brief irritability or emotional sensitivity', prevalence: '~6% of patients' },
];

const severityOptions: { value: Severity; label: string; color: string; bg: string }[] = [
  { value: 'none', label: 'None', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  { value: 'mild', label: 'Mild', color: 'text-amber-700', bg: 'bg-amber-100' },
  { value: 'moderate', label: 'Moderate', color: 'text-orange-700', bg: 'bg-orange-100' },
  { value: 'severe', label: 'Severe', color: 'text-rose-700', bg: 'bg-rose-100' },
];

interface SessionEntry {
  session: number;
  date: string;
  effects: Record<string, Severity>;
  overallNotes: string;
}

export default function SideEffectsTracker() {
  const [entries, setEntries] = useState<SessionEntry[]>([
    { session: 1, date: new Date().toISOString().split('T')[0], effects: {}, overallNotes: '' },
  ]);
  const [activeSession, setActiveSession] = useState(1);
  const [showPrint, setShowPrint] = useState(false);

  const currentEntry = entries.find(e => e.session === activeSession) || entries[0];

  const updateSeverity = (effect: string, severity: Severity) => {
    setEntries(prev => prev.map(e =>
      e.session === activeSession
        ? { ...e, effects: { ...e.effects, [effect]: severity } }
        : e
    ));
  };

  const addSession = () => {
    const next = entries.length + 1;
    setEntries(prev => [...prev, {
      session: next,
      date: new Date().toISOString().split('T')[0],
      effects: {},
      overallNotes: '',
    }]);
    setActiveSession(next);
  };

  const activeEffects = SIDE_EFFECTS.filter(se => (currentEntry.effects[se.name] || 'none') !== 'none');

  return (
    <div className="space-y-6">
      {/* Session Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {entries.map(e => (
          <button
            key={e.session}
            onClick={() => setActiveSession(e.session)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSession === e.session
                ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Session {e.session}
          </button>
        ))}
        <button
          onClick={addSession}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
        >
          + Add Session
        </button>
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Session Date</label>
        <input
          type="date"
          value={currentEntry.date}
          onChange={e => setEntries(prev => prev.map(entry =>
            entry.session === activeSession ? { ...entry, date: e.target.value } : entry
          ))}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none w-auto"
        />
      </div>

      {/* Side Effects Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Rate Each Side Effect</h3>
        {SIDE_EFFECTS.map(effect => {
          const current = currentEntry.effects[effect.name] || 'none';
          return (
            <div key={effect.name} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">{effect.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{effect.description}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Reported by {effect.prevalence}</p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-3">
                {severityOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateSeverity(effect.name, opt.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      current === opt.value
                        ? `${opt.color} ${opt.bg} ring-1 ring-current`
                        : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Session Notes</label>
        <textarea
          placeholder="Overall feeling, mood, sleep, any other observations..."
          rows={3}
          value={currentEntry.overallNotes}
          onChange={e => setEntries(prev => prev.map(entry =>
            entry.session === activeSession ? { ...entry, overallNotes: e.target.value } : entry
          ))}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none text-sm"
        />
      </div>

      {/* Active Effects Summary */}
      {activeEffects.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-xs font-bold text-amber-700 mb-2">Reported Side Effects This Session</p>
          <div className="flex flex-wrap gap-1.5">
            {activeEffects.map(e => {
              const sev = currentEntry.effects[e.name] || 'none';
              const opt = severityOptions.find(o => o.value === sev);
              return (
                <span key={e.name} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${opt?.bg} ${opt?.color}`}>
                  {e.name} ({sev})
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => setShowPrint(true)}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
        >
          Print Report
        </button>
        <a
          href="/downloads/insurance-checklist.pdf"
          className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:border-slate-300 transition-colors"
          download
        >
          Export PDF
        </a>
      </div>

      {/* Print View */}
      {showPrint && (
        <div className="border border-slate-200 rounded-2xl p-6 bg-white">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">TMS Side Effects Tracker</h2>
            <p className="text-sm text-slate-500">Generated from TMSList.com/tools/side-effects-tracker/</p>
          </div>
          {entries.map(entry => {
            const effects = SIDE_EFFECTS.filter(se => (entry.effects[se.name] || 'none') !== 'none');
            return (
              <div key={entry.session} className="mb-6 pb-4 border-b border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-slate-800">Session {entry.session} — {entry.date}</p>
                </div>
                {effects.length === 0 ? (
                  <p className="text-sm text-slate-400">No side effects reported.</p>
                ) : (
                  <ul className="space-y-1">
                    {effects.map(se => (
                      <li key={se.name} className="text-sm text-slate-700">
                        <span className="font-semibold">{se.name}:</span> {entry.effects[se.name]} — {se.description}
                      </li>
                    ))}
                  </ul>
                )}
                {entry.overallNotes && (
                  <p className="text-sm text-slate-500 mt-2 italic">Notes: {entry.overallNotes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}