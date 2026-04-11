import { useState, useEffect } from 'react';

interface HealthItem {
  name: string;
  completed: boolean;
  points: number;
  tip: string;
}

interface HealthData {
  score: number;
  maxScore: number;
  items: HealthItem[];
}

function CircularProgress({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  let color = 'text-red-500';
  if (pct >= 80) color = 'text-emerald-500';
  else if (pct >= 50) color = 'text-amber-500';
  else if (pct >= 30) color = 'text-orange-500';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-100"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900">{pct}%</span>
        <span className="text-xs text-gray-500 font-medium">{score}/{maxScore} pts</span>
      </div>
    </div>
  );
}

export default function PortalHealthScore() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/portal/health-score')
      .then((res) => res.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load health score');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const completedCount = data.items.filter((i) => i.completed).length;
  const incompleteItems = data.items.filter((i) => !i.completed);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile Health Score</h1>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <CircularProgress score={data.score} maxScore={data.maxScore} />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {data.score === data.maxScore
                ? 'Your profile is complete!'
                : data.score >= data.maxScore * 0.7
                  ? 'Almost there!'
                  : 'Room for improvement'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {completedCount} of {data.items.length} items completed.
              {incompleteItems.length > 0 &&
                ` Complete ${incompleteItems.length} more to reach 100%.`}
            </p>
            {data.score < data.maxScore && (
              <a
                href="/portal/clinic/"
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                Edit Clinic Profile
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Profile Checklist</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {data.items.map((item, idx) => (
            <div key={idx} className="px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {item.completed ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${item.completed ? 'text-gray-700' : 'text-gray-900'}`}>
                      {item.name}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{item.points} pts</span>
                  </div>
                  {!item.completed && (
                    <p className="text-xs text-gray-500 mt-1">{item.tip}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
