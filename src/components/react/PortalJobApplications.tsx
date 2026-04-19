import { useState, useEffect } from 'react';

interface Application {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  linkedInUrl?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
}

interface ApplicationsProps {
  jobId: string;
  jobTitle: string;
  onBack: () => void;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  viewed: { label: 'Viewed', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  contacted: { label: 'Contacted', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' },
  hired: { label: 'Hired', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function PortalJobApplications({ jobId, jobTitle, onBack }: ApplicationsProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/jobs/${jobId}/applications`)
      .then((r) => r.json())
      .then((d) => { setApplications(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [jobId]);

  async function updateStatus(appId: string, status: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/portal/jobs/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setApplications((apps) =>
          apps.map((a) => (a.id === appId ? { ...a, status } : a))
        );
        if (selected?.id === appId) setSelected((s) => s ? { ...s, status } : null);
      }
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Applications</h3>
          <p className="text-sm text-slate-500">{jobTitle}</p>
        </div>
        <span className="ml-auto px-3 py-1 bg-violet-50 text-violet-700 text-sm font-semibold rounded-full">
          {applications.length} {applications.length === 1 ? 'applicant' : 'applicants'}
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <p className="text-slate-500 font-medium">No applications yet</p>
          <p className="text-slate-400 text-sm mt-1">Share your job posting to start receiving applications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* List */}
          <div className="space-y-3">
            {applications.map((app) => {
              const meta = STATUS_META[app.status] ?? STATUS_META.new;
              return (
                <button
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected?.id === app.id
                      ? 'border-violet-300 bg-violet-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{app.applicantName}</p>
                      <p className="text-xs text-slate-500 truncate">{app.applicantEmail}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 text-xs font-medium rounded-full border ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  {app.applicantPhone && (
                    <p className="text-xs text-slate-400">{app.applicantPhone}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(app.createdAt)}</p>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="lg:sticky lg:top-4">
            {selected ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                {/* Status controls */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {Object.entries(STATUS_META).map(([val, meta]) => (
                    <button
                      key={val}
                      onClick={() => updateStatus(selected.id, val)}
                      disabled={updating}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        selected.status === val
                          ? `${meta.bg} ${meta.color} border-current`
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Applicant</p>
                    <p className="text-base font-bold text-slate-900">{selected.applicantName}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p>
                      <a href={`mailto:${selected.applicantEmail}`} className="text-sm text-emerald-600 hover:text-emerald-500">
                        {selected.applicantEmail}
                      </a>
                    </div>
                    {selected.applicantPhone && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone</p>
                        <a href={`tel:${selected.applicantPhone}`} className="text-sm text-slate-700">
                          {selected.applicantPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  {selected.linkedInUrl && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">LinkedIn</p>
                      <a href={selected.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:text-emerald-500">
                        {selected.linkedInUrl}
                      </a>
                    </div>
                  )}

                  {selected.resumeUrl && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Resume</p>
                      <a href={selected.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:text-emerald-500">
                        View Resume →
                      </a>
                    </div>
                  )}

                  {selected.coverLetter && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cover Letter</p>
                      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selected.coverLetter}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400">Received {timeAgo(selected.createdAt)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                Select an applicant to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
