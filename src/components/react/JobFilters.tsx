import { useState, useCallback } from 'react';
import { JOB_ROLE_CATEGORIES, EMPLOYMENT_TYPES } from './JobCard';

interface FiltersState {
  search: string;
  roleCategory: string;
  employmentType: string;
  remote: string;
  sort: string;
}

interface JobFiltersProps {
  onFilter: (filters: FiltersState) => void;
  initialFilters?: Partial<FiltersState>;
}

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

export default function JobFilters({ onFilter, initialFilters }: JobFiltersProps) {
  const [search, setSearch] = useState(initialFilters?.search ?? '');
  const [roleCategory, setRoleCategory] = useState(initialFilters?.roleCategory ?? '');
  const [employmentType, setEmploymentType] = useState(initialFilters?.employmentType ?? '');
  const [remote, setRemote] = useState(initialFilters?.remote ?? '');
  const [sort, setSort] = useState(initialFilters?.sort ?? 'newest');

  const apply = useCallback(() => {
    onFilter({ search, roleCategory, employmentType, remote, sort });
  }, [search, roleCategory, employmentType, remote, sort, onFilter]);

  const reset = () => {
    setSearch('');
    setRoleCategory('');
    setEmploymentType('');
    setRemote('');
    setSort('newest');
    onFilter({ search: '', roleCategory: '', employmentType: '', remote: '', sort: 'newest' });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
      {/* Search row */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search jobs, clinics, or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
          />
        </div>
        <button
          onClick={apply}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          Search
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        <select
          value={roleCategory}
          onChange={(e) => { setRoleCategory(e.target.value); }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 text-slate-600 bg-white"
        >
          <option value="">All Roles</option>
          {JOB_ROLE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          value={employmentType}
          onChange={(e) => { setEmploymentType(e.target.value); }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 text-slate-600 bg-white"
        >
          <option value="">Any Type</option>
          {Object.entries(EMPLOYMENT_TYPES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={remote}
          onChange={(e) => setRemote(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 text-slate-600 bg-white"
        >
          <option value="">Any Location</option>
          <option value="true">Remote OK</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-violet-400 text-slate-600 bg-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        {(search || roleCategory || employmentType || remote) && (
          <button
            onClick={reset}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
