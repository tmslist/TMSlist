import { useState, useEffect } from 'react';

interface Props {
  clinicId: string;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

interface ScoreData {
  total: number;
  grade: string;
  breakdown: {
    reviewQuality: number;
    profileCompleteness: number;
    technology: number;
    insuranceBreadth: number;
    responsiveness: number;
    verification: number;
  };
  suggestions: string[];
}

const gradeColors: Record<string, string> = {
  'A+': '#059669', A: '#059669',
  'B+': '#2563eb', B: '#2563eb',
  'C+': '#d97706', C: '#d97706',
  D: '#dc2626', F: '#dc2626',
};

export default function HealthScoreBadge({ clinicId, size = 'sm', showBreakdown = false }: Props) {
  const [score, setScore] = useState<ScoreData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/clinics/health-score?clinicId=${clinicId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setScore(d))
      .catch(() => {});
  }, [clinicId]);

  if (!score) return null;

  const color = gradeColors[score.grade] || '#64748b';

  if (size === 'sm') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border"
        style={{ color, borderColor: `${color}30`, backgroundColor: `${color}10` }}
        title={`Health Score: ${score.total}/100`}
      >
        {score.grade}
      </span>
    );
  }

  if (size === 'md') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
        <div className="text-lg font-bold" style={{ color }}>{score.grade}</div>
        <div>
          <div className="text-xs font-semibold text-slate-700">Health Score</div>
          <div className="text-[10px] text-slate-400">{score.total}/100</div>
        </div>
      </div>
    );
  }

  // Large with optional breakdown
  const breakdownItems = [
    { label: 'Reviews', value: score.breakdown.reviewQuality, max: 25 },
    { label: 'Profile', value: score.breakdown.profileCompleteness, max: 20 },
    { label: 'Technology', value: score.breakdown.technology, max: 15 },
    { label: 'Insurance', value: score.breakdown.insuranceBreadth, max: 15 },
    { label: 'Responsiveness', value: score.breakdown.responsiveness, max: 15 },
    { label: 'Verification', value: score.breakdown.verification, max: 10 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: color }}>
            {score.grade}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">Clinic Health Score</div>
            <div className="text-xs text-slate-400">{score.total} out of 100</div>
          </div>
        </div>
        {showBreakdown && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 font-semibold hover:text-blue-700">
            {expanded ? 'Hide' : 'Details'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score.total}%`, backgroundColor: color }} />
      </div>

      {expanded && (
        <>
          <div className="space-y-3 mb-4">
            {breakdownItems.map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className="text-slate-700 font-semibold">{item.value}/{item.max}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>

          {score.suggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Improve Your Score</h4>
              <ul className="space-y-1.5">
                {score.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">&#8226;</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
