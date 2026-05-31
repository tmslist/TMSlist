import { useState, useEffect } from 'react';

interface Suggestion {
  text: string;
  action: string;
  ctaLabel: string;
  ctaUrl: string;
  type: string;
}

interface HealthAlert {
  alert: boolean;
  score: number;
  previousScore: number;
  scoreChange: number;
  grade: string;
  suggestions: Suggestion[];
  upgradeNudge?: {
    title: string;
    body: string;
    ctaLabel: string;
    ctaUrl: string;
  };
}

function TrendArrow({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center text-emerald-600 text-sm font-medium">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        +{change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center text-red-600 text-sm font-medium">
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        {change}
      </span>
    );
  }
  return <span className="text-gray-500 text-sm">No change</span>;
}

function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const colorMap: Record<string, string> = {
    'A+': 'bg-emerald-100 text-emerald-800',
    'A': 'bg-emerald-100 text-emerald-800',
    'B+': 'bg-blue-100 text-blue-800',
    'B': 'bg-blue-100 text-blue-800',
    'C+': 'bg-amber-100 text-amber-800',
    'C': 'bg-amber-100 text-amber-800',
    'D': 'bg-red-100 text-red-800',
    'F': 'bg-red-100 text-red-800',
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${colorMap[grade] || 'bg-gray-100 text-gray-800'}`}>
      {score}/100 ({grade})
    </div>
  );
}

function SuggestionCard({ suggestion, onClick }: { suggestion: Suggestion; onClick: () => void }) {
  const iconMap: Record<string, JSX.Element> = {
    phone: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
    hours: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    verify: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    photos: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    reviews: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    default: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  return (
    <div className="bg-white rounded-lg border border-[var(--line)] p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-gray-400 mt-0.5">
          {iconMap[suggestion.type] || iconMap.default}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--ink)]">{suggestion.text}</p>
          <button
            onClick={onClick}
            className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            {suggestion.ctaLabel}
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortalHealthAlerts() {
  const [alert, setAlert] = useState<HealthAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    // Check if dismissed
    const stored = localStorage.getItem('health_alerts_dismissed');
    if (stored) {
      const { timestamp, score } = JSON.parse(stored);
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        // Dismissed within 24h, skip
        setLoading(false);
        return;
      }
    }

    fetch('/api/portal/health-alerts')
      .then((r) => r.ok ? r.json() : Promise.resolve(null))
      .then((data) => {
        setAlert(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleDismiss() {
    if (!alert) return;
    localStorage.setItem('health_alerts_dismissed', JSON.stringify({
      timestamp: Date.now(),
      score: alert.score,
    }));
    setDismissed(true);
  }

  async function handleSuggestionClick(suggestion: Suggestion) {
    setDismissing(suggestion.text);
    try {
      await fetch('/api/portal/health-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: 'current', // Will be resolved from session
          suggestionText: suggestion.text,
        }),
      });
    } catch {}
    setDismissing(null);
    // Navigate to the CTA URL
    window.location.href = suggestion.ctaUrl;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--line)] p-6 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!alert || dismissed || (!alert.alert && alert.suggestions.length === 0)) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--ink)] flex items-center gap-2">
            Health Score
            {alert.alert && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                !
              </span>
            )}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <ScoreBadge score={alert.score} grade={alert.grade} />
            <TrendArrow change={alert.scoreChange} />
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="Dismiss for 24 hours"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Upgrade Nudge */}
      {alert.upgradeNudge && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">{alert.upgradeNudge.title}</p>
              <p className="text-xs text-blue-700 mt-1">{alert.upgradeNudge.body}</p>
              <a
                href={alert.upgradeNudge.ctaUrl}
                className="inline-flex items-center mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                {alert.upgradeNudge.ctaLabel}
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {alert.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Actions to improve
          </p>
          {alert.suggestions.slice(0, 3).map((suggestion, idx) => (
            <SuggestionCard
              key={idx}
              suggestion={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
            />
          ))}
        </div>
      )}
    </div>
  );
}