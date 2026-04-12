import { useState, useEffect, useCallback } from 'react';
import JobCard from './JobCard';
import JobFilters from './JobFilters';

interface Job {
  id: string;
  title: string;
  roleCategory: string;
  employmentType: string;
  location: string;
  remote?: boolean;
  salaryDisplay?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
  status: string;
  applicationCount?: number;
  viewCount?: number;
  expiresAt?: string | null;
  createdAt: string;
  clinicId: string;
  clinicName: string;
  clinicCity?: string | null;
  clinicState?: string | null;
  clinicLogo?: any;
}

interface FiltersState {
  search: string;
  roleCategory: string;
  employmentType: string;
  remote: string;
  sort: string;
}

export default function ClinicJobsBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    roleCategory: '',
    employmentType: '',
    remote: '',
    sort: 'newest',
  });

  const fetchJobs = useCallback(async (f: FiltersState) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.search) params.set('search', f.search);
      if (f.roleCategory) params.set('roleCategory', f.roleCategory);
      if (f.employmentType) params.set('employmentType', f.employmentType);
      if (f.remote === 'true') params.set('remote', 'true');
      params.set('sort', f.sort);
      params.set('limit', '20');
      params.set('offset', '0');

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error('[ClinicJobsBoard]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(filters);
  }, [filters, fetchJobs]);

  return (
    <div>
      <JobFilters
        onFilter={(f) => setFilters(f)}
        initialFilters={filters}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="flex gap-2 mb-4">
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-6 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-8 w-16 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No jobs found</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            {filters.search || filters.roleCategory || filters.employmentType || filters.remote
              ? 'Try adjusting your filters or clearing the search.'
              : 'No clinics have posted jobs yet. Be the first to post a job at your clinic.'}
          </p>
          {(filters.search || filters.roleCategory || filters.employmentType || filters.remote) && (
            <button
              onClick={() => setFilters({ search: '', roleCategory: '', employmentType: '', remote: '', sort: 'newest' })}
              className="mt-4 text-sm text-violet-600 hover:text-violet-500 font-semibold"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{total} job{total !== 1 ? 's' : ''} found</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
