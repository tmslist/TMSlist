import { useState, useCallback, useEffect } from 'react';

interface Clinic {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  ratingAvg: string;
  reviewCount: number;
  verified: boolean;
  machines: string[] | null;
  specialties: string[] | null;
  insurances: string[] | null;
  phone: string | null;
  availability: { accepting_new_patients?: boolean; evening_hours?: boolean; weekend_hours?: boolean; telehealth_consults?: boolean } | null;
}

const TREATMENTS = ['Depression', 'OCD', 'Anxiety', 'PTSD', 'Bipolar Depression', 'Smoking Cessation', 'Chronic Pain', 'Migraine', 'ADHD', 'Tinnitus'];
const MACHINES = ['NeuroStar', 'BrainsWay', 'MagVenture', 'CloudTMS', 'Magstim', 'Nexstim'];
const INSURANCES = ['Medicare', 'Medicaid', 'Blue Cross Blue Shield', 'Aetna', 'Cigna', 'UnitedHealthcare', 'Humana', 'Tricare', 'Kaiser Permanente'];
const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

export default function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating');
  const [results, setResults] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = useCallback(async (resetPage = true) => {
    setLoading(true);
    if (resetPage) setPage(0);
    const offset = resetPage ? 0 : page * 20;

    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (state) params.set('state', state);
    if (selectedMachines.length) params.set('machines', selectedMachines.join(','));
    if (selectedInsurances.length) params.set('insurances', selectedInsurances.join(','));
    if (selectedTreatments.length) params.set('specialties', selectedTreatments.join(','));
    if (verifiedOnly) params.set('verified', 'true');
    params.set('limit', '20');
    params.set('offset', String(offset));

    try {
      const res = await fetch(`/api/clinics/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        let filtered = data.data || [];

        // Client-side filtering for rating
        if (minRating > 0) {
          filtered = filtered.filter((c: Clinic) => Number(c.ratingAvg) >= minRating);
        }

        // Client-side sorting
        if (sortBy === 'rating') filtered.sort((a: Clinic, b: Clinic) => Number(b.ratingAvg) - Number(a.ratingAvg));
        else if (sortBy === 'reviews') filtered.sort((a: Clinic, b: Clinic) => b.reviewCount - a.reviewCount);
        else if (sortBy === 'name') filtered.sort((a: Clinic, b: Clinic) => a.name.localeCompare(b.name));

        setResults(filtered);
        setTotal(data.count || filtered.length);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [query, state, selectedMachines, selectedInsurances, selectedTreatments, verifiedOnly, minRating, sortBy, page]);

  useEffect(() => { search(); }, []);

  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const activeFilterCount = selectedTreatments.length + selectedMachines.length + selectedInsurances.length + (verifiedOnly ? 1 : 0) + (minRating > 0 ? 1 : 0);

  return (
    <div>
      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search by name, city, or keyword..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <select value={state} onChange={(e) => setState(e.target.value)} className="px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium">
          <option value="">All States</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => search()} className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm">
          Search
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter sidebar */}
        <div className="lg:w-72 shrink-0">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold mb-4"
          >
            Filters {activeFilterCount > 0 && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{activeFilterCount}</span>}
            <svg className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>

          <div className={`space-y-6 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
            {/* Sort */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sort By</h3>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as any); search(); }} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Verified */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm font-semibold text-slate-700">Verified Clinics Only</span>
              </label>
            </div>

            {/* Min Rating */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Minimum Rating</h3>
              <div className="flex gap-1">
                {[0, 3, 3.5, 4, 4.5].map(r => (
                  <button key={r} onClick={() => setMinRating(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${minRating === r ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:border-slate-200'}`}>
                    {r === 0 ? 'Any' : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Conditions Treated</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {TREATMENTS.map(t => (
                  <label key={t} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={selectedTreatments.includes(t)} onChange={() => toggleFilter(selectedTreatments, setSelectedTreatments, t)} className="w-3.5 h-3.5 rounded text-blue-600" />
                    <span className="text-sm text-slate-600">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* TMS Devices */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">TMS Device</h3>
              <div className="space-y-2">
                {MACHINES.map(m => (
                  <label key={m} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={selectedMachines.includes(m)} onChange={() => toggleFilter(selectedMachines, setSelectedMachines, m)} className="w-3.5 h-3.5 rounded text-blue-600" />
                    <span className="text-sm text-slate-600">{m}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Insurance */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Insurance Accepted</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {INSURANCES.map(i => (
                  <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={selectedInsurances.includes(i)} onChange={() => toggleFilter(selectedInsurances, setSelectedInsurances, i)} className="w-3.5 h-3.5 rounded text-blue-600" />
                    <span className="text-sm text-slate-600">{i}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Apply button */}
            <button onClick={() => search()} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all">
              Apply Filters
            </button>

            {activeFilterCount > 0 && (
              <button onClick={() => { setSelectedTreatments([]); setSelectedMachines([]); setSelectedInsurances([]); setVerifiedOnly(false); setMinRating(0); }} className="w-full py-2 text-sm text-slate-500 hover:text-red-600 font-medium transition-colors">
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500 font-medium">
              {loading ? 'Searching...' : `${total} clinic${total !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-slate-500 font-medium">No clinics match your criteria</p>
              <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search terms</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!loading && results.map(clinic => {
              const rating = Number(clinic.ratingAvg || 0);
              return (
                <a key={clinic.id} href={`/clinic/${clinic.slug}`} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all block">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-tight">{clinic.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{clinic.city}, {clinic.state}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {clinic.verified && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">Verified</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-semibold text-amber-600">{rating.toFixed(1)} ★</span>
                    <span className="text-xs text-slate-400">({clinic.reviewCount} reviews)</span>
                  </div>

                  {(clinic.machines?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {clinic.machines!.slice(0, 3).map(m => (
                        <span key={m} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium">{m}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <span className="text-xs font-semibold text-blue-600">View Profile →</span>
                    {clinic.phone && (
                      <span className="text-xs text-slate-400">{clinic.phone}</span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>

          {/* Pagination */}
          {total > 20 && !loading && (
            <div className="flex justify-center gap-2 mt-8">
              <button disabled={page === 0} onClick={() => { setPage(p => p - 1); search(false); }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-all">
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-slate-500">Page {page + 1}</span>
              <button disabled={results.length < 20} onClick={() => { setPage(p => p + 1); search(false); }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-slate-50 transition-all">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
