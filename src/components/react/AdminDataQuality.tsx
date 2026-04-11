import { useState, useEffect } from 'react';

interface IssueData {
  missingPhone: number;
  missingEmail: number;
  missingDescription: number;
  missingHours: number;
  missingMachines: number;
  noDoctors: number;
  noReviews: number;
  doctorsMissingBio: number;
  doctorsMissingImage: number;
  staleListings: number;
}

interface DuplicateEntry {
  name: string;
  cnt: number;
}

interface QualityData {
  total: number;
  verified: number;
  issues: IssueData;
  duplicates: DuplicateEntry[];
}

const ISSUE_LABELS: Record<keyof IssueData, { label: string; link: string }> = {
  missingPhone: { label: 'Missing Phone', link: '/admin/clinics?filter=no-phone' },
  missingEmail: { label: 'Missing Email', link: '/admin/clinics?filter=no-email' },
  missingDescription: { label: 'Missing Description', link: '/admin/clinics?filter=no-description' },
  missingHours: { label: 'Missing Hours', link: '/admin/clinics?filter=no-hours' },
  missingMachines: { label: 'Missing Machines', link: '/admin/clinics?filter=no-machines' },
  noDoctors: { label: 'No Doctors Listed', link: '/admin/doctors' },
  noReviews: { label: 'No Reviews', link: '/admin/reviews' },
  doctorsMissingBio: { label: 'Doctors Missing Bio', link: '/admin/doctors?filter=no-bio' },
  doctorsMissingImage: { label: 'Doctors Missing Image', link: '/admin/doctors?filter=no-image' },
  staleListings: { label: 'Stale Listings (6mo+)', link: '/admin/clinics?filter=stale' },
};

function getSeverity(count: number, total: number): 'green' | 'amber' | 'red' {
  if (total === 0) return 'green';
  const pct = (count / total) * 100;
  if (pct > 50) return 'red';
  if (pct > 20) return 'amber';
  return 'green';
}

const SEVERITY_STYLES = {
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
};

export default function AdminDataQuality() {
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dupesExpanded, setDupesExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/data-quality')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        Failed to load data quality metrics. {error}
      </div>
    );
  }

  const issueEntries = Object.entries(data.issues) as [keyof IssueData, number][];
  const totalIssues = issueEntries.reduce((sum, [, v]) => sum + v, 0);
  const maxPossible = data.total * issueEntries.length;
  const healthScore = maxPossible > 0 ? Math.round(((maxPossible - totalIssues) / maxPossible) * 100) : 100;

  const scoreColor = healthScore >= 80 ? 'text-emerald-600' : healthScore >= 50 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = healthScore >= 80 ? 'bg-emerald-50 border-emerald-200' : healthScore >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-8">
      {/* Health Score + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-xl border p-6 ${scoreBg} flex flex-col items-center justify-center`}>
          <p className="text-sm font-medium text-gray-500 mb-1">Health Score</p>
          <p className={`text-5xl font-bold ${scoreColor}`}>{healthScore}%</p>
          <p className="text-xs text-gray-500 mt-2">Based on {data.total} clinics</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Clinics</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">{data.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Verified</p>
          <p className="text-3xl font-semibold text-emerald-600 mt-2">{data.verified.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">
            {data.total > 0 ? Math.round((data.verified / data.total) * 100) : 0}% of total
          </p>
        </div>
      </div>

      {/* Issue Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Issues</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {issueEntries.map(([key, count]) => {
            const severity = getSeverity(count, data.total);
            const styles = SEVERITY_STYLES[severity];
            const meta = ISSUE_LABELS[key];
            const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0;

            return (
              <div key={key} className={`rounded-xl border p-5 ${styles.bg} ${styles.border}`}>
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-2xl font-bold ${styles.text}`}>{count.toLocaleString()}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}>{pct}%</span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-3">{meta.label}</p>
                <a
                  href={meta.link}
                  className="text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                >
                  View &rarr;
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Duplicates Section */}
      {data.duplicates.length > 0 && (
        <div>
          <button
            onClick={() => setDupesExpanded(!dupesExpanded)}
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4 hover:text-violet-600 transition-colors"
          >
            <svg
              className={`w-5 h-5 transition-transform ${dupesExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Duplicate Clinic Names ({data.duplicates.length})
          </button>

          {dupesExpanded && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clinic Name</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.duplicates.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{d.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right font-medium">{d.cnt}</td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/admin/clinics?search=${encodeURIComponent(d.name)}`}
                          className="text-xs font-medium text-violet-600 hover:text-violet-800"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
