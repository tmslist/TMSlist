import { useState, useEffect } from 'react';
import { JOB_ROLE_CATEGORIES, EMPLOYMENT_TYPES } from './JobCard';
import PortalJobEditor from './PortalJobEditor';
import PortalJobApplications from './PortalJobApplications';

interface Job {
  id: string;
  title: string;
  roleCategory: string;
  employmentType: string;
  location: string;
  remote?: boolean;
  salaryDisplay?: string | null;
  status: string;
  viewCount?: number;
  applicationCount?: number;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  clinicId: string;
  clinicName?: string;
}

function getCategoryLabel(value: string) {
  return JOB_ROLE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  paused: { label: 'Paused', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  filled: { label: 'Filled', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  closed: { label: 'Closed', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function PortalJobsDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'applications'>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [clinicEmail, setClinicEmail] = useState('');

  useEffect(() => {
    fetch('/api/portal/jobs')
      .then((r) => r.json())
      .then((d) => {
        setJobs(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function loadJobs() {
    const res = await fetch('/api/portal/jobs');
    const d = await res.json();
    setJobs(d.data ?? []);
  }

  async function handleSave(data: Record<string, unknown>) {
    const url = selectedJob?.id ? `/api/portal/jobs/${selectedJob.id}` : '/api/portal/jobs';
    const method = selectedJob?.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await loadJobs();
      setView('list');
      setSelectedJob(null);
    } else {
      const d = await res.json();
      alert(d.error || 'Failed to save job');
    }
  }

  async function toggleStatus(job: Job) {
    const next = job.status === 'active' ? 'paused' : 'active';
    const res = await fetch(`/api/portal/jobs/${job.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) await loadJobs();
  }

  async function deleteJob(job: Job) {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/portal/jobs/${job.id}`, { method: 'DELETE' });
    if (res.ok) await loadJobs();
  }

  function editJob(job: Job) {
    setSelectedJob(job);
    setView('edit');
  }

  // List view
  if (view === 'list') {
    return (
      <div>
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">Job Postings</h2>
            <p class="text-sm text-slate-500 mt-1">Manage job listings for your clinic</p>
          </div>
          <button
            onClick={() => { setSelectedJob(null); setView('create'); }}
            class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Post a Job
          </button>
        </div>

        {loading ? (
          <div class="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} class="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div class="h-5 bg-slate-200 rounded w-1/3 mb-3" />
                <div class="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">No jobs posted yet</h3>
            <p class="text-slate-500 text-sm max-w-xs mx-auto mb-6">
              Reach TMS professionals in your area by posting a job at your clinic.
            </p>
            <button
              onClick={() => { setSelectedJob(null); setView('create'); }}
              class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div class="space-y-3">
            {jobs.map((job) => {
              const meta = STATUS_META[job.status] ?? STATUS_META.closed;
              return (
                <div key={job.id} class="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-base font-bold text-slate-900 truncate">{job.title}</h3>
                        <span class={`shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{getCategoryLabel(job.roleCategory)}</span>
                        <span>·</span>
                        <span>{job.location}</span>
                        {job.remote && <><span>·</span><span class="text-emerald-600 font-medium">Remote</span></>}
                        <span>·</span>
                        <span>{EMPLOYMENT_TYPES[job.employmentType] ?? job.employmentType}</span>
                        {job.salaryDisplay && <><span>·</span><span>{job.salaryDisplay}</span></>}
                      </div>
                      <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span>{job.viewCount ?? 0} views</span>
                        <span>·</span>
                        <span>{job.applicationCount ?? 0} applications</span>
                        <span>·</span>
                        <span>Posted {timeAgo(job.createdAt)}</span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      {(job.applicationCount ?? 0) > 0 && (
                        <button
                          onClick={() => { setSelectedJob(job); setView('applications'); }}
                          class="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors border border-violet-100"
                        >
                          {(job.applicationCount ?? 0)} applicant{(job.applicationCount ?? 0) !== 1 ? 's' : ''}
                        </button>
                      )}
                      <button
                        onClick={() => editJob(job)}
                        class="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Edit"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button
                        onClick={() => toggleStatus(job)}
                        class="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        title={job.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {job.status === 'active' ? (
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        ) : (
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        )}
                      </button>
                      <button
                        onClick={() => deleteJob(job)}
                        class="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Applications view
  if (view === 'applications' && selectedJob) {
    return (
      <PortalJobApplications
        client:load
        jobId={selectedJob.id}
        jobTitle={selectedJob.title}
        onBack={() => setView('list')}
      />
    );
  }

  // Create / Edit view
  return (
    <div>
      <div class="flex items-center gap-3 mb-6">
        <button
          onClick={() => { setView('list'); setSelectedJob(null); }}
          class="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h2 class="text-2xl font-bold text-slate-900">
          {selectedJob ? 'Edit Job Posting' : 'Post a New Job'}
        </h2>
      </div>
      <div class="bg-white rounded-2xl border border-slate-200 p-6">
        <PortalJobEditor
          client:load
          job={selectedJob ?? undefined}
          clinicEmail={clinicEmail}
          onSave={handleSave}
          onCancel={() => setView('list')}
        />
      </div>
    </div>
  );
}
