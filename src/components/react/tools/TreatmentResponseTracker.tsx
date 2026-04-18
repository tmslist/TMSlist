'use client';

import { useState } from 'react';
import { SeedlingIcon, TrendingUpIcon, TrophyIcon, SparkleIcon, RocketIcon, ChartIcon, AlertCircleIcon } from '../Icons';

// Expected PHQ-9 benchmarks based on clinical literature (NeuroStar, TMS+Med studies)
const BENCHMARK_WEEKS = [
  { week: 0, phq9: 19, label: 'Baseline' },
  { week: 1, phq9: 17, label: 'Week 1' },
  { week: 2, phq9: 14, label: 'Week 2' },
  { week: 3, phq9: 11, label: 'Week 3' },
  { week: 4, phq9: 9, label: 'Week 4' },
  { week: 5, phq9: 7, label: 'Week 5' },
  { week: 6, phq9: 5, label: 'Week 6' },
];

const HAM_D_BENCHMARK = [
  { week: 0, hamd: 24 }, { week: 1, hamd: 21 },
  { week: 2, hamd: 17 }, { week: 3, hamd: 14 },
  { week: 4, hamd: 11 }, { week: 5, hamd: 8 },
  { week: 6, hamd: 6 },
];

const GAD7_BENCHMARK = [
  { week: 0, gad7: 15 }, { week: 1, gad7: 13 },
  { week: 2, gad7: 10 }, { week: 3, gad7: 8 },
  { week: 4, gad7: 6 }, { week: 5, gad7: 5 },
  { week: 6, gad7: 4 },
];

type Scale = 'PHQ-9' | 'HAM-D' | 'GAD-7';
type Phase = 'early' | 'mid' | 'late' | 'complete';

function getPhase(week: number): Phase {
  if (week <= 2) return 'early';
  if (week <= 4) return 'mid';
  if (week < 6) return 'late';
  return 'complete';
}

function getPhaseColor(phase: Phase) {
  switch (phase) {
    case 'early': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Early Phase', icon: SeedlingIcon };
    case 'mid': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', label: 'Building Response', icon: TrendingUpIcon };
    case 'late': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Consolidation', icon: TrophyIcon };
    case 'complete': return { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', label: 'Treatment Complete', icon: SparkleIcon };
  }
}

export default function TreatmentResponseTracker() {
  const [scale, setScale] = useState<Scale>('PHQ-9');
  const [week, setWeek] = useState(0);
  const [actualScore, setActualScore] = useState<number>('');
  const [entries, setEntries] = useState<{ week: number; score: number }[]>([]);
  const [mood, setMood] = useState('unchanged');
  const [sleep, setSleep] = useState('unchanged');
  const [energy, setEnergy] = useState('unchanged');
  const [showNotes, setShowNotes] = useState(false);

  const benchmark = scale === 'PHQ-9' ? BENCHMARK_WEEKS : scale === 'HAM-D' ? HAM_D_BENCHMARK : GAD7_BENCHMARK;
  const maxScore = scale === 'PHQ-9' ? 27 : scale === 'HAM-D' ? 52 : 21;

  const currentBenchmark = benchmark.find(b => b.week === week) || benchmark[benchmark.length - 1];
  const phase = getPhase(week);
  const phaseInfo = getPhaseColor(phase);

  const progressPct = Math.round(((maxScore - currentBenchmark.phq9) / maxScore) * 100);
  const lastEntry = entries[entries.length - 1];
  const relativeToBenchmark = lastEntry
    ? lastEntry.score - currentBenchmark.phq9
    : null;

  const addEntry = () => {
    const score = Number(actualScore);
    if (isNaN(score) || score < 0 || score > maxScore) return;
    setEntries(prev => {
      const filtered = prev.filter(e => e.week !== week);
      return [...filtered, { week, score }].sort((a, b) => a.week - b.week);
    });
    setActualScore('');
  };

  const svgHeight = 200;
  const svgWidth = 600;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  const toX = (w: number) => padding.left + (w / 6) * chartW;
  const toY = (s: number) => padding.top + ((maxScore - s) / maxScore) * chartH;

  const benchmarkPath = benchmark.map((b, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(b.week)} ${toY(b.phq9)}`
  ).join(' ');

  const actualPath = entries.length > 0
    ? entries.map((e, i) => `${i === 0 ? 'M' : 'L'} ${toX(e.week)} ${toY(e.score)}`).join(' ')
    : '';

  const remissionLine = scale === 'PHQ-9' ? 5 : scale === 'HAM-D' ? 7 : 5;
  const remissionY = toY(remissionLine);

  return (
    <div className="space-y-8">
      {/* Scale Selector */}
      <div className="flex gap-2">
        {(['PHQ-9', 'HAM-D', 'GAD-7'] as Scale[]).map(s => (
          <button
            key={s}
            onClick={() => setScale(s)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              scale === s
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Progress Phase Banner */}
      <div className={`rounded-xl p-4 border ${phaseInfo.bg} ${phaseInfo.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl"><phaseInfo.icon className={phaseInfo.text} size={28} /></span>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${phaseInfo.text}`}>{phaseInfo.label}</p>
              <p className="text-sm text-slate-600 mt-0.5">
                {phase === 'early' && 'Neural pathways are beginning to rewire. Many patients feel minimal change this phase — this is normal.'}
                {phase === 'mid' && 'Most patients start noticing improved mood and energy between weeks 3-4. Your responses are building.'}
                {phase === 'late' && 'You are approaching or past typical response thresholds. Focus on consistency.'}
                {phase === 'complete' && 'Treatment course complete. Work with your provider on maintenance planning.'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-800">{Math.round(progressPct)}%</p>
            <p className="text-xs text-slate-500">expected improvement</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700">{scale} Progress Chart</h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-emerald-400 rounded inline-block"></span>
              <span className="text-slate-500">Expected curve</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-violet-600 rounded inline-block"></span>
              <span className="text-slate-500">Your scores</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border border-dashed border-amber-400 inline-block"></span>
              <span className="text-slate-500">Remission threshold</span>
            </span>
          </div>
        </div>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(pct => {
            const y = padding.top + (1 - pct) * chartH;
            return (
              <g key={pct}>
                <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y}
                  stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                  {Math.round(maxScore * (1 - pct))}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {benchmark.map(b => (
            <text key={b.week} x={toX(b.week)} y={svgHeight - 10} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {b.label}
            </text>
          ))}

          {/* Remission threshold line */}
          <line x1={padding.left} y1={remissionY} x2={svgWidth - padding.right} y2={remissionY}
            stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" />
          <text x={svgWidth - padding.right + 4} y={remissionY + 4} fontSize="9" fill="#f59e0b" fontWeight="600">
            Remission
          </text>

          {/* Benchmark area fill */}
          <path d={benchmarkPath + ` L ${toX(6)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`}
            fill="#10b981" opacity="0.08" />

          {/* Benchmark line */}
          <path d={benchmarkPath} fill="none" stroke="#10b981" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Actual data line */}
          {actualPath && (
            <path d={actualPath} fill="none" stroke="#7c3aed" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Data points */}
          {entries.map((e, i) => (
            <g key={i}>
              <circle cx={toX(e.week)} cy={toY(e.score)} r="5" fill="#7c3aed" stroke="white" strokeWidth="2" />
            </g>
          ))}

          {/* Current week indicator */}
          <line x1={toX(week)} y1={padding.top} x2={toX(week)} y2={svgHeight - padding.bottom}
            stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
        </svg>
      </div>

      {/* Week + Score Input */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-700">Record Your Score</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Treatment Week</label>
            <select
              value={week}
              onChange={e => setWeek(Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            >
              {benchmark.map(b => (
                <option key={b.week} value={b.week}>{b.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Your {scale} Score</label>
            <input
              type="number"
              min="0"
              max={maxScore}
              value={actualScore}
              onChange={e => setActualScore(e.target.value)}
              placeholder={`0–${maxScore}`}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
            />
          </div>
        </div>
        <button
          onClick={addEntry}
          disabled={actualScore === ''}
          className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Log Score
        </button>
      </div>

      {/* Functional improvement inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Mood', value: mood, setter: setMood },
          { label: 'Sleep', value: sleep, setter: setSleep },
          { label: 'Energy', value: energy, setter: setEnergy },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{item.label}</p>
            <div className="flex gap-1.5">
              {['worse', 'unchanged', 'better'].map(opt => (
                <button
                  key={opt}
                  onClick={() => item.setter(opt)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    item.value === opt
                      ? opt === 'better' ? 'bg-emerald-100 text-emerald-700'
                        : opt === 'worse' ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                      : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {opt === 'better' ? '↑' : opt === 'worse' ? '↓' : '—'} {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Benchmark comparison */}
      {relativeToBenchmark !== null && (
        <div className={`rounded-xl p-4 border ${
          relativeToBenchmark <= -3 ? 'bg-emerald-50 border-emerald-200'
          : relativeToBenchmark >= 3 ? 'bg-red-50 border-red-200'
          : 'bg-amber-50 border-amber-200'
        }`}>
          <p className="text-sm font-bold">
            {relativeToBenchmark <= -3
              ? <><RocketIcon className="inline-block" size={16} /> Ahead of expected! Your response is above the typical benchmark curve.</>
              : relativeToBenchmark >= 3
              ? <><AlertCircleIcon className="inline-block" size={16} /> Behind expected — this is common in treatment-resistant cases. Talk to your provider about intensifying or extending treatment.</>
              : <><ChartIcon className="inline-block" size={16} /> On track. Your scores are tracking close to the expected improvement curve.</>
            }
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Your score: {lastEntry.score} vs expected: {currentBenchmark.phq9} (difference: {relativeToBenchmark > 0 ? '+' : ''}{relativeToBenchmark})
          </p>
        </div>
      )}

      {/* Response guide */}
      <div className="bg-violet-50 rounded-xl p-5 border border-violet-100">
        <h4 className="text-sm font-bold text-violet-700 mb-3">Understanding Your {scale} Score</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {scale === 'PHQ-9' && (
            <>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-emerald-600">0–4</p>
                <p className="text-xs text-slate-500">Remission</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-amber-600">5–9</p>
                <p className="text-xs text-slate-500">Mild</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-orange-600">10–14</p>
                <p className="text-xs text-slate-500">Moderate</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-red-600">15–27</p>
                <p className="text-xs text-slate-500">Severe</p>
              </div>
            </>
          )}
          {scale === 'HAM-D' && (
            <>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-emerald-600">0–7</p>
                <p className="text-xs text-slate-500">Remission</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-amber-600">8–13</p>
                <p className="text-xs text-slate-500">Mild</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-orange-600">14–19</p>
                <p className="text-xs text-slate-500">Moderate</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-red-600">20–52</p>
                <p className="text-xs text-slate-500">Severe</p>
              </div>
            </>
          )}
          {scale === 'GAD-7' && (
            <>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-emerald-600">0–4</p>
                <p className="text-xs text-slate-500">Minimal</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-amber-600">5–9</p>
                <p className="text-xs text-slate-500">Mild</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-orange-600">10–14</p>
                <p className="text-xs text-slate-500">Moderate</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <p className="text-lg font-bold text-red-600">15–21</p>
                <p className="text-xs text-slate-500">Severe</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Print summary */}
      {entries.length > 0 && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Print Progress Report
          </button>
        </div>
      )}
    </div>
  );
}