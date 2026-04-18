'use client';

import { useState } from 'react';
import { MoonIcon, CoffeeIcon, PillIcon, BanIcon, BoltIcon, SkullIcon, WaterIcon, CalendarIcon, BrainIcon, QuestionIcon, CheckIcon, WarningIcon } from '../Icons';

const CHECKLIST_ITEMS = [
  {
    id: 'sleep',
    category: 'sleep',
    label: 'I slept at least 6 hours last night',
    detail: 'Adequate sleep helps reduce seizure risk and improves TMS tolerance.',
    icon: <MoonIcon size={16} />,
  },
  {
    id: 'caffeine',
    category: 'caffeine',
    label: 'No more than 2 cups of caffeine today',
    detail: 'High caffeine intake may lower seizure threshold during TMS.',
    icon: <CoffeeIcon size={16} />,
  },
  {
    id: 'medications',
    category: 'medications',
    label: 'I took my regular medications as prescribed',
    detail: 'Do not skip or alter your TMS-relevant medications (antidepressants, anticonvulsants) before treatment.',
    icon: <PillIcon size={16} />,
  },
  {
    id: 'alcohol',
    category: 'alcohol',
    label: 'No alcohol in the past 12 hours',
    detail: 'Alcohol can lower seizure threshold and interact with TMS effects.',
    icon: <BanIcon size={16} />,
  },
  {
    id: 'metal',
    category: 'metal',
    label: 'No new metal objects near my head',
    detail: 'Remove all jewelry, hairpins, glasses (if possible), and confirm no new dental work or implants since last session.',
    icon: <BoltIcon size={16} />,
  },
  {
    id: 'headache',
    category: 'pain',
    label: 'No existing headache or significant pain',
    detail: 'If you have a moderate-to-severe headache, discuss with your provider before proceeding.',
    icon: <SkullIcon size={16} />,
  },
  {
    id: 'hydration',
    category: 'hydration',
    label: 'I am well-hydrated (water or non-caffeinated beverage)',
    detail: 'Dehydration can increase scalp discomfort and reduce treatment tolerance.',
    icon: <WaterIcon size={16} />,
  },
  {
    id: 'schedule',
    category: 'schedule',
    label: 'I have 30-60 minutes of availability post-session',
    detail: 'Some patients feel fatigued after treatment. Plan accordingly.',
    icon: <CalendarIcon size={16} />,
  },
  {
    id: 'mood',
    category: 'mood',
    label: 'I feel mentally and emotionally ready',
    detail: 'TMS works best when you can relax during the session. Avoid sessions during high-stress periods if possible.',
    icon: <BrainIcon size={16} />,
  },
  {
    id: 'questions',
    category: 'questions',
    label: 'I have no new questions or concerns for my provider',
    detail: 'Write down any changes in symptoms, medications, or concerns before the session.',
    icon: <QuestionIcon size={16} />,
  },
];

const CATEGORIES = {
  sleep: { label: 'Sleep & Rest', icon: <MoonIcon size={16} />, color: '#6366f1' },
  caffeine: { label: 'Caffeine', icon: <CoffeeIcon size={16} />, color: '#f59e0b' },
  medications: { label: 'Medications', icon: <PillIcon size={16} />, color: '#10b981' },
  alcohol: { label: 'Alcohol', icon: <BanIcon size={16} />, color: '#ef4444' },
  metal: { label: 'Metal / Devices', icon: <BoltIcon size={16} />, color: '#64748b' },
  pain: { label: 'Physical State', icon: <SkullIcon size={16} />, color: '#f97316' },
  hydration: { label: 'Hydration', icon: <WaterIcon size={16} />, color: '#0ea5e9' },
  schedule: { label: 'Schedule', icon: <CalendarIcon size={16} />, color: '#8b5cf6' },
  mood: { label: 'Mental State', icon: <BrainIcon size={16} />, color: '#ec4899' },
  questions: { label: 'Questions', icon: <QuestionIcon size={16} />, color: '#84cc16' },
};

export default function SessionReadinessChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [sessionNum, setSessionNum] = useState(1);
  const [showTip, setShowTip] = useState<string | null>(null);

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const complete = CHECKLIST_ITEMS.filter(item => checked[item.id]);
  const total = CHECKLIST_ITEMS.length;
  const pct = Math.round((complete.length / total) * 100);

  const getCategory = (cat: string) => CATEGORIES[cat as keyof typeof CATEGORIES] || CATEGORIES.sleep;

  return (
    <div className="space-y-8">
      {/* Session number */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Session</label>
        <input
          type="number"
          min="1"
          max="50"
          value={sessionNum}
          onChange={e => setSessionNum(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-slate-800 text-center font-bold focus:ring-2 focus:ring-violet-500 outline-none"
        />
        <span className="text-sm text-slate-400">/ 36+ treatment sessions</span>
      </div>

      {/* Progress bar */}
      <div className="bg-slate-950 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Readiness Score</p>
            <p className="text-3xl font-bold text-white mt-1">{pct}%</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">{complete.length}/{total}</p>
            <p className="text-xs text-slate-400">items checked</p>
          </div>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                : pct >= 70
                ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                : 'linear-gradient(90deg, #ef4444, #f97316)',
            }}
          />
        </div>
        {pct === 100 && (
          <p className="text-emerald-400 text-sm font-semibold mt-3 flex items-center gap-2">
            <CheckIcon size={16} className="shrink-0" /> You're cleared for today's session
          </p>
        )}
        {pct < 100 && pct >= 70 && (
          <p className="text-amber-400 text-sm font-semibold mt-3 flex items-center gap-2">
            <WarningIcon size={16} className="shrink-0" /> Review flagged items with your provider
          </p>
        )}
        {pct < 70 && (
          <p className="text-red-400 text-sm font-semibold mt-3 flex items-center gap-2">
            <WarningIcon size={16} className="shrink-0" /> Please address marked items before treatment
          </p>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {CHECKLIST_ITEMS.map(item => {
          const cat = getCategory(item.category);
          const isChecked = !!checked[item.id];
          return (
            <div
              key={item.id}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                isChecked
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <button
                onClick={() => toggle(item.id)}
                className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                  isChecked
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-200 hover:border-violet-400'
                }`}
              >
                {isChecked && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: cat.color + '15', color: cat.color }}>
                    {cat.label}
                  </span>
                </div>
                <p className={`text-sm font-medium ${isChecked ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                  {item.label}
                </p>
                <button
                  onClick={() => setShowTip(showTip === item.id ? null : item.id)}
                  className="text-xs text-slate-400 hover:text-violet-600 mt-0.5 transition-colors"
                >
                  {showTip === item.id ? 'hide detail' : 'why this matters'}
                </button>
                {showTip === item.id && (
                  <p className="text-xs text-slate-500 mt-1 bg-slate-50 rounded-lg p-3 border border-slate-100">
                    {item.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reset */}
      <div className="flex gap-3">
        <button
          onClick={() => setChecked({})}
          className="text-sm text-slate-400 hover:text-slate-600 font-semibold transition-colors"
        >
          Reset checklist
        </button>
      </div>

      {/* Session notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pre-session notes</label>
        <textarea
          rows={2}
          placeholder="Any symptoms, mood, or observations before this session..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none text-sm"
        />
      </div>
    </div>
  );
}