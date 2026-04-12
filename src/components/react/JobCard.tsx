import { useState } from 'react';

export const JOB_ROLE_CATEGORIES = [
  { value: 'tms_technician', label: 'TMS Technician', color: 'bg-violet-50 text-violet-700', bgColor: 'bg-violet-500' },
  { value: 'tms_physician', label: 'TMS Physician', color: 'bg-blue-50 text-blue-700', bgColor: 'bg-blue-500' },
  { value: 'nurse_tms', label: 'TMS Nurse', color: 'bg-cyan-50 text-cyan-700', bgColor: 'bg-cyan-500' },
  { value: 'psychologist', label: 'Psychologist', color: 'bg-indigo-50 text-indigo-700', bgColor: 'bg-indigo-500' },
  { value: 'front_desk', label: 'Front Desk', color: 'bg-amber-50 text-amber-700', bgColor: 'bg-amber-500' },
  { value: 'office_manager', label: 'Office Manager', color: 'bg-orange-50 text-orange-700', bgColor: 'bg-orange-500' },
  { value: 'billing', label: 'Billing / Insurance', color: 'bg-green-50 text-green-700', bgColor: 'bg-green-500' },
  { value: 'marketing_coordinator', label: 'Marketing Coordinator', color: 'bg-pink-50 text-pink-700', bgColor: 'bg-pink-500' },
  { value: 'community_outreach', label: 'Community Outreach', color: 'bg-rose-50 text-rose-700', bgColor: 'bg-rose-500' },
  { value: 'social_media', label: 'Social Media', color: 'bg-fuchsia-50 text-fuchsia-700', bgColor: 'bg-fuchsia-500' },
  { value: 'data_researcher', label: 'Data / Research', color: 'bg-teal-50 text-teal-700', bgColor: 'bg-teal-500' },
  { value: 'it_support', label: 'IT Support', color: 'bg-slate-50 text-slate-700', bgColor: 'bg-slate-500' },
  { value: 'other', label: 'Other', color: 'bg-gray-50 text-gray-700', bgColor: 'bg-gray-500' },
] as const;

export const EMPLOYMENT_TYPES: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

function getCategoryMeta(value: string) {
  return JOB_ROLE_CATEGORIES.find((c) => c.value === value) ?? {
    label: value,
    color: 'bg-gray-50 text-gray-700',
    bgColor: 'bg-gray-500',
  };
}

function formatSalary(min?: number | null, max?: number | null, display?: string | null) {
  if (display) return display;
  if (!min && !max) return 'Competitive';
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

interface JobCardProps {
  job: {
    id: string;
    title: string;
    roleCategory: string;
    employmentType: string;
    location: string;
    remote?: boolean;
    salaryDisplay?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    applicationCount?: number;
    viewCount?: number;
    createdAt: string;
    clinicId: string;
    clinicName: string;
    clinicCity?: string | null;
    clinicState?: string | null;
    clinicLogo?: any;
  };
  compact?: boolean;
}

export default function JobCard({ job, compact = false }: JobCardProps) {
  const cat = getCategoryMeta(job.roleCategory);
  const clinicLogo = job.clinicLogo as { logo_url?: string } | null;
  const logoUrl = clinicLogo?.logo_url;

  return (
    <a
      href={`/careers/${job.id}/`}
      className="group block bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-200 hover:shadow-md transition-all"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Clinic logo + name */}
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={job.clinicName}
              className="w-10 h-10 rounded-xl object-cover shrink-0 bg-slate-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
              {job.clinicName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs text-slate-500 truncate">{job.clinicName}</p>
            <p className="text-xs text-slate-400 truncate">
              {[job.clinicCity, job.clinicState].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        {/* Time */}
        <span className="text-xs text-slate-400 shrink-0">{timeAgo(job.createdAt)}</span>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-violet-700 transition-colors line-clamp-2">
        {job.title}
      </h3>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${cat.color}`}>
          {cat.label}
        </span>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
          {EMPLOYMENT_TYPES[job.employmentType] ?? job.employmentType}
        </span>
        {job.remote && (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
            Remote OK
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {job.location}
          </span>
          {(job.salaryDisplay || job.salaryMin || job.salaryMax) && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {formatSalary(job.salaryMin, job.salaryMax, job.salaryDisplay)}
            </span>
          )}
          {typeof job.applicationCount === 'number' && (
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {job.applicationCount} {job.applicationCount === 1 ? 'applicant' : 'applicants'}
            </span>
          )}
        </div>

        <span className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition-colors">
          Apply
        </span>
      </div>
    </a>
  );
}
