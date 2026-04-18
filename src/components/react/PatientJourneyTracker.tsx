'use client';

import { useState, useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type SessionStatus = 'pending' | 'completed' | 'current' | 'missed';

interface SessionData {
  session: number;
  date: string;
  duration: number;
  pulses: number;
  status: SessionStatus;
  notes: string;
  phq9?: number;
  sideEffects: Record<string, number>;
}

interface SideEffectDef {
  name: string;
  description: string;
  prevalence: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIDE_EFFECT_DEFS: SideEffectDef[] = [
  { name: 'headache', description: 'Scalp or temple pain during or after treatment', prevalence: '~37% of patients' },
  { name: 'scalpPain', description: 'Tingling, warmth, or soreness at the treatment site', prevalence: '~28% of patients' },
  { name: 'facialTwitching', description: 'Involuntary muscle contractions during pulses', prevalence: '~15% of patients' },
  { name: 'dizziness', description: 'Lightheadedness during or after sessions', prevalence: '~10% of patients' },
  { name: 'nausea', description: 'Stomach queasiness during or after sessions', prevalence: '~5% of patients' },
  { name: 'fatigue', description: 'Tiredness or grogginess after sessions', prevalence: '~20% of patients' },
  { name: 'moodChanges', description: 'Brief irritability or emotional sensitivity', prevalence: '~6% of patients' },
  { name: 'sleepChanges', description: 'Difficulty sleeping or unusual vivid dreams', prevalence: '~8% of patients' },
];

const MILESTONES = [
  { session: 10, label: 'Session 10', color: 'bg-rose-500', ringColor: 'ring-rose-400' },
  { session: 20, label: 'Session 20', color: 'bg-blue-500', ringColor: 'ring-blue-400' },
  { session: 36, label: 'Session 36', color: 'bg-amber-400', ringColor: 'ring-amber-300' },
];

// ─── Generate realistic session data ─────────────────────────────────────────

function generateSessions(currentSession: number): SessionData[] {
  const baseDate = new Date('2026-03-02');

  return Array.from({ length: 36 }, (_, i) => {
    const sessionNum = i + 1;
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);

    let status: SessionStatus = 'pending';
    if (sessionNum < currentSession) status = 'completed';
    else if (sessionNum === currentSession) status = 'current';
    else if (Math.random() < 0.03) status = 'missed';

    let notes = '';
    let phq9: number | undefined;
    let sideEffects: Record<string, number> = {};

    if (sessionNum <= 5) {
      notes = 'Tolerating well. No side effects. Patient reports slight scalp tenderness.';
      if (sessionNum <= 2) {
        sideEffects = { scalpPain: 1, headache: 1 };
      }
    } else if (sessionNum <= 10) {
      notes = 'Mood improvement noticed. Sleep quality improving. Gentle headache after session 7.';
      sideEffects = { headache: 1, fatigue: 1, scalpPain: 1 };
      if (sessionNum === 10) phq9 = 15;
    } else if (sessionNum <= 20) {
      notes = 'PHQ-9 score improved from 18 to 12. Energy levels up. No headaches.';
      sideEffects = { fatigue: 1, moodChanges: 1 };
      if (sessionNum === 15) phq9 = 12;
      if (sessionNum === 20) phq9 = 10;
    } else if (sessionNum <= 30) {
      notes = 'Significant improvement in concentration. PHQ-9: 8. Going well.';
      sideEffects = { fatigue: 0, headache: 0 };
      if (sessionNum === 25) phq9 = 8;
    } else {
      notes = 'Near remission. PHQ-9: 5. Treatment complete.';
      sideEffects = {};
      if (sessionNum === 30) phq9 = 5;
      if (sessionNum === 36) phq9 = 4;
    }

    return {
      session: sessionNum,
      date: date.toISOString().split('T')[0],
      duration: 19 + Math.floor(Math.random() * 6),
      pulses: 1980 + Math.floor(Math.random() * 200),
      status,
      notes,
      phq9,
      sideEffects,
    };
  });
}

// ─── PHQ-9 Chart Component ────────────────────────────────────────────────────

function PHQ9Chart({ sessions }: { sessions: SessionData[] }) {
  const phqData = sessions
    .filter(s => s.phq9 !== undefined)
    .map(s => ({ session: s.session, score: s.phq9! }));

  if (phqData.length < 2) return null;

  const max = 27;
  const height = 60;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">PHQ-9 Score Trend</p>
      <div className="flex items-end gap-1 h-[60px]">
        {phqData.map((d, i) => {
          const barH = (d.score / max) * height;
          const isLast = i === phqData.length - 1;
          return (
            <div key={d.session} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-sm transition-all ${isLast ? 'bg-emerald-500' : 'bg-violet-500/60'}`}
                style={{ height: `${barH}px`, minHeight: '4px' }}
              />
              <span className="text-[9px] text-slate-500">{d.score}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-500 text-center">Session {phqData[0].session} → {phqData[phqData.length - 1].session}</p>
    </div>
  );
}

// ─── Side Effects Trend Component ─────────────────────────────────────────────

function SideEffectsTrend({ sessions }: { sessions: SessionData[] }) {
  const completedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'current');

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Side Effect Severity</p>
      <div className="flex items-center gap-1 h-[60px]">
        {completedSessions.slice(-8).map((s, i) => {
          const total = Object.values(s.sideEffects).reduce((a, b) => a + b, 0);
          const dotH = total === 0 ? 4 : 8 + total * 4;
          return (
            <div key={s.session} className="flex-1 flex flex-col items-center gap-0.5 justify-end">
              <div
                className="w-full rounded-sm bg-cyan-500/50"
                style={{ height: `${dotH}px`, minHeight: '4px' }}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-slate-500 text-center">Last 8 sessions</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PatientJourneyTracker() {
  const [currentSession, setCurrentSession] = useState(12);
  const [sessions, setSessions] = useState<SessionData[]>(() => generateSessions(12));
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [zoomStart, setZoomStart] = useState(0);
  const [windowSize, setWindowSize] = useState(36);
  const [clinicalNote, setClinicalNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tms_clinical_note');
    if (saved) setClinicalNote(saved);
  }, []);

  const completedCount = sessions.filter(s => s.status === 'completed').length;
  const completionPct = Math.round((completedCount / 36) * 100);
  const weeksRemaining = Math.max(0, Math.ceil(((36 - currentSession) / 5) * 7));

  const visibleSessions = sessions.slice(zoomStart, zoomStart + windowSize);

  const handleSessionClick = (s: SessionData) => {
    setSelectedSession(s);
  };

  const saveNote = () => {
    localStorage.setItem('tms_clinical_note', clinicalNote);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto text-white">

      {/* ── Progress Metrics Bar ─────────────────────────────────────── */}
      <div className="mb-6 glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Treatment Progress</p>
            <p className="text-sm font-bold mt-0.5">
              <span className="text-emerald-400">{completedCount}</span>
              <span className="text-slate-400">/36 sessions completed</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Completion</p>
            <p className="text-lg font-bold text-violet-400">{completionPct}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400 transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-slate-800/40 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Weeks Remaining</p>
            <p className="text-sm font-bold text-cyan-400">~{weeksRemaining} weeks</p>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Current PHQ-9</p>
            <p className="text-sm font-bold text-emerald-400">8 / 27</p>
          </div>
        </div>

        {/* Mini charts */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-slate-800/40 rounded-xl p-3">
            <PHQ9Chart sessions={sessions} />
          </div>
          <div className="bg-slate-800/40 rounded-xl p-3">
            <SideEffectsTrend sessions={sessions} />
          </div>
        </div>
      </div>

      {/* ── Visual Timeline ─────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">Session Timeline</h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span className="text-slate-400">Pending</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Done</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-cyan-400/40" />
              <span className="text-slate-400">Now</span>
            </span>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-3 mb-4">
          <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Zoom:</label>
          {[5, 10, 18, 36].map(size => (
            <button
              key={size}
              onClick={() => {
                setWindowSize(size);
                setZoomStart(Math.max(0, Math.min(36 - size, zoomStart)));
              }}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                windowSize === size
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600/60'
              }`}
            >
              {size === 36 ? 'All' : `${size}s`}
            </button>
          ))}
          {windowSize < 36 && (
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => setZoomStart(Math.max(0, zoomStart - 1))}
                className="w-5 h-5 rounded bg-slate-700/60 flex items-center justify-center text-slate-400 hover:bg-slate-600/60 transition-colors"
                disabled={zoomStart === 0}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-[9px] text-slate-500 px-1">
                {zoomStart + 1}–{Math.min(zoomStart + windowSize, 36)}
              </span>
              <button
                onClick={() => setZoomStart(Math.min(36 - windowSize, zoomStart + 1))}
                className="w-5 h-5 rounded bg-slate-700/60 flex items-center justify-center text-slate-400 hover:bg-slate-600/60 transition-colors"
                disabled={zoomStart >= 36 - windowSize}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Session dots */}
        <div className="relative">
          <div className="flex gap-1 flex-wrap">
            {visibleSessions.map(s => {
              const isMilestone = MILESTONES.some(m => m.session === s.session);
              const milestone = MILESTONES.find(m => m.session === s.session);
              const isSelected = selectedSession?.session === s.session;

              let dotClass = 'bg-slate-600 hover:bg-slate-500';
              if (s.status === 'completed') dotClass = 'bg-emerald-500 hover:bg-emerald-400';
              if (s.status === 'current') dotClass = 'bg-cyan-400 pulse-glow';
              if (s.status === 'missed') dotClass = 'bg-rose-500 hover:bg-rose-400';

              return (
                <button
                  key={s.session}
                  onClick={() => handleSessionClick(s)}
                  title={`Session ${s.session}${s.status === 'current' ? ' (current)' : ''}`}
                  className={`
                    relative w-5 h-5 rounded-full transition-all duration-200 flex items-center justify-center
                    ${dotClass}
                    ${isSelected ? 'ring-2 ring-white/50 scale-110' : ''}
                    ${s.status === 'current' ? 'ring-[3px] ring-cyan-400/30 scale-125' : ''}
                    ${isMilestone && s.status !== 'current' ? `ring-2 ${milestone?.ringColor} ring-offset-1 ring-offset-slate-900` : ''}
                  `}
                >
                  {isMilestone && s.status !== 'current' && (
                    <span className={`absolute -top-5 text-[8px] font-bold px-1 rounded ${milestone?.color} text-white whitespace-nowrap`}>
                      {milestone?.label}
                    </span>
                  )}
                  {s.status === 'current' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Milestone legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-700/40">
            {MILESTONES.map(m => (
              <div key={m.session} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                <span className="text-[10px] text-slate-400">Session {m.session}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Session Details Panel ──────────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">
            {selectedSession ? `Session ${selectedSession.session} Details` : 'Select a Session'}
          </h3>

          {selectedSession ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Date</p>
                  <p className="text-[11px] text-slate-200 font-medium">
                    {new Date(selectedSession.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Duration</p>
                  <p className="text-[11px] text-slate-200 font-medium">{selectedSession.duration} min</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Pulses</p>
                  <p className="text-[11px] text-slate-200 font-medium">{selectedSession.pulses.toLocaleString()}</p>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Status</p>
                  <p className={`text-[11px] font-semibold ${
                    selectedSession.status === 'completed' ? 'text-emerald-400' :
                    selectedSession.status === 'current' ? 'text-cyan-400' :
                    selectedSession.status === 'missed' ? 'text-rose-400' : 'text-slate-400'
                  }`}>
                    {selectedSession.status.charAt(0).toUpperCase() + selectedSession.status.slice(1)}
                  </p>
                </div>
              </div>

              {selectedSession.phq9 !== undefined && (
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">PHQ-9 Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          selectedSession.phq9 <= 5 ? 'bg-emerald-500' :
                          selectedSession.phq9 <= 10 ? 'bg-cyan-500' :
                          selectedSession.phq9 <= 20 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${(selectedSession.phq9 / 27) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-200">{selectedSession.phq9}/27</span>
                  </div>
                </div>
              )}

              <div className="bg-slate-800/40 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Session Notes</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">{selectedSession.notes}</p>
              </div>

              {Object.keys(selectedSession.sideEffects).length > 0 && (
                <div className="bg-slate-800/40 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Side Effects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SIDE_EFFECT_DEFS
                      .filter(se => (selectedSession.sideEffects[se.name] ?? 0) > 0)
                      .map(se => {
                        const sev = selectedSession.sideEffects[se.name] ?? 1;
                        return (
                          <span key={se.name} className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${
                            sev >= 3 ? 'bg-rose-500/20 text-rose-400' :
                            sev >= 2 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-700/60 text-slate-400'
                          }`}>
                            {se.name.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-10 h-10 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <p className="text-[11px] text-slate-500">Click any session dot above to view details</p>
            </div>
          )}
        </div>

        {/* ── Side Effects Log ─────────────────────────────────────────── */}
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Side Effects Log</h3>

          <div className="space-y-2">
            {SIDE_EFFECT_DEFS.map(se => {
              const severity = selectedSession?.sideEffects[se.name] ?? 0;
              return (
                <div key={se.name} className="bg-slate-800/40 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-200">{se.name.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">{se.description}</p>
                    </div>
                    {severity > 0 && (
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        severity >= 3 ? 'bg-rose-500/20 text-rose-400' :
                        severity >= 2 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-700/60 text-slate-400'
                      }`}>
                        {severity}/4
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`flex-1 h-1.5 rounded-full transition-all ${
                          level === 0 ? 'bg-slate-600' :
                          level <= severity ? (
                            severity >= 3 ? 'bg-rose-500' :
                            severity >= 2 ? 'bg-amber-500' :
                            'bg-violet-500'
                          ) : 'bg-slate-700/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Clinical Notes ─────────────────────────────────────────── */}
      <div className="glass-panel rounded-2xl p-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Clinical Notes</h3>
          <span className="text-[10px] text-slate-500">{clinicalNote.length}/500</span>
        </div>
        <textarea
          ref={noteRef}
          value={clinicalNote}
          onChange={e => setClinicalNote(e.target.value.slice(0, 500))}
          placeholder="Add clinical observations, patient feedback, medication changes..."
          rows={4}
          className="w-full bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-3 text-[11px] text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all resize-none"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={saveNote}
            className={`px-4 py-2 rounded-xl text-[11px] font-semibold transition-all ${
              noteSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {noteSaved ? 'Saved!' : 'Save Note'}
          </button>
          <span className="text-[10px] text-slate-500">Stored locally on this device</span>
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={exportPDF}
          className="px-5 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-[11px] font-semibold text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
          Export as PDF
        </button>
        <button
          onClick={() => {
            setCurrentSession(Math.min(36, currentSession + 1));
            setSessions(generateSessions(Math.min(36, currentSession + 1)));
          }}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-[11px] font-semibold text-white transition-all"
        >
          Simulate Next Session
        </button>
      </div>

      {/* ── Print Styles ────────────────────────────────────────────── */}
      <style is:global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .glass-panel { background: white !important; border: 1px solid #e2e8f0 !important; backdrop-filter: none !important; box-shadow: none !important; }
          button, .pulse-glow, .flex.gap-1.flex-wrap > button { display: none !important; }
          .pulse-glow, .pulse-glow\\* { animation: none !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}