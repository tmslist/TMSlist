import { useState, useEffect, useRef, useMemo } from 'react';

interface ClinicCompare {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country: string;
  ratingAvg: string;
  reviewCount: number;
  machines: string[];
  specialties: string[];
  insurances: string[];
  phone: string;
  website: string;
  verified: boolean;
  isFeatured: boolean;
  pricing: { session_price_min?: number; session_price_max?: number; free_consultation?: boolean } | null;
  availability: { accepting_new_patients?: boolean; telehealth_consults?: boolean; wait_time_weeks?: number } | null;
}

interface Props {
  allClinics?: ClinicCompare[];
}

const MAX_COMPARE = 3;

const POPULAR_COMPARISONS = [
  {
    title: 'Top-Rated NYC Clinics',
    description: 'Compare leading TMS providers in New York City',
    state: 'NY',
    city: 'New York',
  },
  {
    title: 'Los Angeles TMS Centers',
    description: 'Side-by-side comparison of LA clinics',
    state: 'CA',
    city: 'Los Angeles',
  },
  {
    title: 'Chicago Area Providers',
    description: 'Compare TMS clinics in the Chicago metro',
    state: 'IL',
    city: 'Chicago',
  },
  {
    title: 'Houston TMS Clinics',
    description: 'Top Houston-area TMS providers compared',
    state: 'TX',
    city: 'Houston',
  },
  {
    title: 'Miami & South Florida',
    description: 'Compare South Florida TMS centers',
    state: 'FL',
    city: 'Miami',
  },
  {
    title: 'NeuroStar vs BrainsWay Clinics',
    description: 'Compare clinics using different TMS devices',
    machine: 'NeuroStar',
  },
];

export default function ComparisonTool({ allClinics = [] }: Props) {
  const [selected, setSelected] = useState<ClinicCompare[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved comparison from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tms_compare');
    if (saved && allClinics.length > 0) {
      try {
        const ids: string[] = JSON.parse(saved);
        const restored = ids
          .map(id => allClinics.find(c => c.id === id))
          .filter((c): c is ClinicCompare => c != null);
        if (restored.length > 0) {
          setSelected(restored);
        }
      } catch { /* invalid stored JSON */ }
    }
  }, [allClinics]);

  // Persist selected IDs to localStorage
  useEffect(() => {
    if (selected.length === 0) {
      localStorage.removeItem('tms_compare');
    } else {
      localStorage.setItem('tms_compare', JSON.stringify(selected.map(c => c.id)));
    }
  }, [selected]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Client-side filtering
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const selectedIds = new Set(selected.map(c => c.id));
    return allClinics
      .filter(c => {
        if (selectedIds.has(c.id)) return false;
        const haystack = `${c.name} ${c.city} ${c.state}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [searchQuery, allClinics, selected]);

  function addClinic(clinic: ClinicCompare) {
    if (selected.length >= MAX_COMPARE) return;
    setSelected(prev => [...prev, clinic]);
    setSearchQuery('');
    setShowResults(false);
  }

  function removeClinic(id: string) {
    setSelected(prev => prev.filter(c => c.id !== id));
  }

  function clearAll() {
    setSelected([]);
    localStorage.removeItem('tms_compare');
  }

  // Pre-fill with clinics from a popular comparison
  function loadPopularComparison(comp: typeof POPULAR_COMPARISONS[number]) {
    let matches: ClinicCompare[];
    if ('machine' in comp && comp.machine) {
      matches = allClinics.filter(c => c.machines.some(m => m.toLowerCase().includes(comp.machine!.toLowerCase())));
    } else {
      matches = allClinics.filter(c =>
        c.state === comp.state && c.city.toLowerCase() === comp.city!.toLowerCase()
      );
    }
    // Sort by rating desc, take top 3
    const top = matches
      .sort((a, b) => Number(b.ratingAvg) - Number(a.ratingAvg) || b.reviewCount - a.reviewCount)
      .slice(0, MAX_COMPARE);
    if (top.length > 0) {
      setSelected(top);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const ratingDisplay = (c: ClinicCompare) => {
    const r = Number(c.ratingAvg);
    if (r <= 0) return 'No reviews yet';
    return `${r.toFixed(1)} / 5.0 (${c.reviewCount} review${c.reviewCount !== 1 ? 's' : ''})`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search + Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        {selected.length < MAX_COMPARE ? (
          <div ref={searchRef} className="relative w-full sm:max-w-md">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder={`Search clinics to compare (${selected.length}/${MAX_COMPARE})...`}
                aria-label="Search for a clinic to compare"
                role="combobox"
                aria-expanded={showResults && searchResults.length > 0}
                aria-autocomplete="list"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            {showResults && searchResults.length > 0 && (
              <ul
                role="listbox"
                aria-label="Search results"
                className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-80 overflow-y-auto"
              >
                {searchResults.map((clinic) => (
                  <li key={clinic.id}>
                    <button
                      type="button"
                      onClick={() => addClinic(clinic)}
                      className="w-full px-4 py-3 text-left hover:bg-violet-50 flex justify-between items-center gap-3 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{clinic.name}</p>
                        <p className="text-sm text-slate-500">{clinic.city}, {clinic.state}</p>
                      </div>
                      <span className="shrink-0 text-violet-600 text-sm font-semibold bg-violet-50 px-2.5 py-1 rounded-lg">
                        + Add
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center text-sm text-slate-500">
                No clinics found matching "{searchQuery}"
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Maximum of {MAX_COMPARE} clinics selected.</p>
        )}

        {selected.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All
          </button>
        )}
      </div>

      {/* Selected Clinic Pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selected.map((clinic) => (
            <span
              key={clinic.id}
              className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-800 text-sm font-medium px-3 py-1.5 rounded-full"
            >
              {clinic.verified && (
                <svg className="w-3.5 h-3.5 text-violet-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-2.108-2.108 3 3 0 01-5.304 0 3 3 0 00-2.108 2.108 3 3 0 010 5.304 3 3 0 002.108 2.108 3 3 0 015.304 0 3 3 0 002.108-2.108zM9.293 12.707a1 1 0 001.414 0l3-3a1 1 0 10-1.414-1.414L10 10.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2z" clipRule="evenodd" />
                </svg>
              )}
              {clinic.name}
              <button
                type="button"
                onClick={() => removeClinic(clinic.id)}
                className="ml-1 text-violet-500 hover:text-red-600 transition-colors"
                aria-label={`Remove ${clinic.name} from comparison`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Comparison Table */}
      {selected.length >= 2 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm mb-16">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-4 w-44 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  Feature
                </th>
                {selected.map((clinic) => (
                  <th key={clinic.id} className="p-4 text-center min-w-[240px] border-b border-slate-200">
                    <div className="flex flex-col items-center gap-1">
                      <a href={`/clinic/${clinic.slug}`} className="font-bold text-slate-900 hover:text-violet-700 transition-colors text-base">
                        {clinic.name}
                      </a>
                      <p className="text-xs text-slate-500">{clinic.city}, {clinic.state}</p>
                      <button
                        type="button"
                        onClick={() => removeClinic(clinic.id)}
                        className="mt-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow
                label="Rating"
                values={selected.map(c => ratingDisplay(c))}
                bestIdx={getBestIndex(selected.map(c => Number(c.ratingAvg)))}
              />
              <CompareRow
                label="Verified"
                values={selected.map(c => c.verified ? 'Verified' : 'Not verified')}
                icons={selected.map(c => c.verified ? 'check' : 'x')}
              />
              <CompareRow
                label="TMS Devices"
                values={selected.map(c => c.machines.length > 0 ? c.machines.join(', ') : 'Not specified')}
                bestIdx={getBestIndex(selected.map(c => c.machines.length))}
              />
              <CompareRow
                label="Specialties"
                values={selected.map(c => c.specialties.length > 0 ? c.specialties.join(', ') : 'Not specified')}
                bestIdx={getBestIndex(selected.map(c => c.specialties.length))}
              />
              <CompareRow
                label="Insurance Accepted"
                values={selected.map(c => c.insurances.length > 0 ? c.insurances.join(', ') : 'Not specified')}
                bestIdx={getBestIndex(selected.map(c => c.insurances.length))}
              />
              <CompareRow
                label="Free Consultation"
                values={selected.map(c => c.pricing?.free_consultation ? 'Yes' : 'Contact for info')}
                icons={selected.map(c => c.pricing?.free_consultation ? 'check' : 'neutral')}
              />
              <CompareRow
                label="Telehealth"
                values={selected.map(c => c.availability?.telehealth_consults ? 'Available' : 'In-person only')}
                icons={selected.map(c => c.availability?.telehealth_consults ? 'check' : 'neutral')}
              />
              <CompareRow
                label="Accepting Patients"
                values={selected.map(c => c.availability?.accepting_new_patients !== false ? 'Yes' : 'Waitlist')}
                icons={selected.map(c => c.availability?.accepting_new_patients !== false ? 'check' : 'x')}
              />
              <CompareRow
                label="Phone"
                values={selected.map(c => c.phone || '--')}
              />
              <tr className="bg-slate-50/50">
                <td className="p-4 text-sm font-semibold text-slate-500"></td>
                {selected.map((clinic) => (
                  <td key={clinic.id} className="p-4 text-center">
                    <a
                      href={`/clinic/${clinic.slug}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                    >
                      View Full Profile
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : selected.length === 1 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mb-16">
          <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <p className="text-slate-600 font-medium">Add at least one more clinic to start comparing.</p>
          <p className="text-sm text-slate-400 mt-1">Use the search above to find another clinic.</p>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mb-16">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <p className="text-slate-600 font-medium text-lg mb-1">Search and add 2-3 clinics to compare</p>
          <p className="text-sm text-slate-400">See ratings, technology, insurance, and more side-by-side.</p>
        </div>
      )}

      {/* Popular Comparisons */}
      <div className="mt-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Popular Comparisons</h2>
        <p className="text-slate-500 mb-6">Quick-start comparisons for popular regions and technologies.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_COMPARISONS.map((comp) => {
            const hasData = 'machine' in comp
              ? allClinics.some(c => c.machines.some(m => m.toLowerCase().includes(comp.machine!.toLowerCase())))
              : allClinics.some(c => c.state === comp.state && c.city.toLowerCase() === comp.city!.toLowerCase());

            return (
              <button
                key={comp.title}
                type="button"
                onClick={() => loadPopularComparison(comp)}
                disabled={!hasData}
                className={`group text-left p-5 rounded-xl border transition-all duration-200 ${
                  hasData
                    ? 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-md hover:bg-violet-50/30 cursor-pointer'
                    : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className={`font-semibold mb-1 ${hasData ? 'text-slate-900 group-hover:text-violet-700' : 'text-slate-500'}`}>
                      {comp.title}
                    </h3>
                    <p className="text-sm text-slate-500">{comp.description}</p>
                  </div>
                  {hasData && (
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-500 shrink-0 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-16 mb-4">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">How Clinic Comparison Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
            <h3 className="font-semibold text-slate-900 mb-1">Search Clinics</h3>
            <p className="text-sm text-slate-500">Type a clinic name, city, or state to find providers in our directory.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
            <h3 className="font-semibold text-slate-900 mb-1">Select 2-3 Clinics</h3>
            <p className="text-sm text-slate-500">Add your top choices to see them compared in a detailed table.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
            <h3 className="font-semibold text-slate-900 mb-1">Compare & Decide</h3>
            <p className="text-sm text-slate-500">Review technology, insurance, ratings, and availability side-by-side.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Return index of the highest numeric value, or -1 if all are 0/equal */
function getBestIndex(values: number[]): number {
  if (values.length < 2) return -1;
  const max = Math.max(...values);
  if (max <= 0) return -1;
  const count = values.filter(v => v === max).length;
  if (count === values.length) return -1; // all equal
  return values.indexOf(max);
}

function CompareRow({ label, values, bestIdx = -1, icons }: {
  label: string;
  values: string[];
  bestIdx?: number;
  icons?: ('check' | 'x' | 'neutral')[];
}) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
      <td className="p-4 text-sm font-semibold text-slate-500">{label}</td>
      {values.map((val, i) => (
        <td
          key={i}
          className={`p-4 text-sm text-center ${
            bestIdx === i ? 'text-violet-700 font-semibold bg-violet-50/40' : 'text-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {icons?.[i] === 'check' && (
              <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {icons?.[i] === 'x' && (
              <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            <span>{val}</span>
          </div>
        </td>
      ))}
    </tr>
  );
}
