import { useState, useEffect } from 'react';

interface ClinicCompare {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
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

const MAX_COMPARE = 3;

export default function ComparisonTool() {
  const [clinicIds, setClinicIds] = useState<string[]>([]);
  const [clinicData, setClinicData] = useState<ClinicCompare[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClinicCompare[]>([]);
  const [searching, setSearching] = useState(false);

  // Load saved comparisons from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tms_compare');
    if (saved) {
      try {
        setClinicIds(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Sync IDs to localStorage
  useEffect(() => {
    if (clinicIds.length === 0) {
      localStorage.removeItem('tms_compare');
    } else {
      localStorage.setItem('tms_compare', JSON.stringify(clinicIds));
    }
  }, [clinicIds]);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/clinics/search?query=${encodeURIComponent(q)}&verified=true&limit=5`);
      if (res.ok) {
        const { data } = await res.json();
        setSearchResults(data.filter((c: ClinicCompare) => !clinicIds.includes(c.id)));
      }
    } catch {}
    setSearching(false);
  }

  function addClinic(clinic: ClinicCompare) {
    if (clinicIds.length >= MAX_COMPARE) return;
    setClinicIds(prev => [...prev, clinic.id]);
    setClinicData(prev => [...prev, clinic]);
    setSearchQuery('');
    setSearchResults([]);
  }

  function removeClinic(id: string) {
    setClinicIds(prev => prev.filter(i => i !== id));
    setClinicData(prev => prev.filter(c => c.id !== id));
  }

  function clearAll() {
    setClinicIds([]);
    setClinicData([]);
    localStorage.removeItem('tms_compare');
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Compare Clinics</h2>
        {clinicData.length > 0 && (
          <button onClick={clearAll} className="text-sm text-gray-500 hover:text-red-600">
            Clear All
          </button>
        )}
      </div>

      {/* Search to add */}
      {clinicData.length < MAX_COMPARE && (
        <div className="mb-8 relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={`Add a clinic to compare (${clinicData.length}/${MAX_COMPARE})...`}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          {searchResults.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {searchResults.map((clinic) => (
                <li key={clinic.id}>
                  <button
                    onClick={() => addClinic(clinic)}
                    className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{clinic.name}</p>
                      <p className="text-sm text-gray-500">{clinic.city}, {clinic.state}</p>
                    </div>
                    <span className="text-indigo-600 text-sm font-medium">+ Add</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Comparison Table */}
      {clinicData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 bg-gray-50 rounded-tl-xl w-40 text-sm font-medium text-gray-500">Feature</th>
                {clinicData.map((clinic) => (
                  <th key={clinic.id} className="p-4 bg-gray-50 text-center min-w-[250px]">
                    <div className="flex flex-col items-center gap-2">
                      <p className="font-semibold text-gray-900">{clinic.name}</p>
                      <p className="text-sm text-gray-500">{clinic.city}, {clinic.state}</p>
                      <button onClick={() => removeClinic(clinic.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <CompareRow label="Rating" values={clinicData.map(c =>
                Number(c.ratingAvg) > 0 ? `${Number(c.ratingAvg).toFixed(1)} ★ (${c.reviewCount} reviews)` : 'No reviews'
              )} />
              <CompareRow label="Verified" values={clinicData.map(c =>
                c.verified ? '✓ Verified' : 'Not verified'
              )} highlight="verified" data={clinicData} />
              <CompareRow label="TMS Devices" values={clinicData.map(c =>
                c.machines?.join(', ') || 'Not specified'
              )} />
              <CompareRow label="Treatments" values={clinicData.map(c =>
                c.specialties?.slice(0, 5).join(', ') || 'Not specified'
              )} />
              <CompareRow label="Insurance" values={clinicData.map(c =>
                c.insurances?.slice(0, 5).join(', ') || 'Not specified'
              )} />
              <CompareRow label="Consultation" values={clinicData.map(c =>
                c.pricing?.free_consultation ? 'Free consultation' : 'Contact for pricing'
              )} />
              <CompareRow label="Telehealth" values={clinicData.map(c =>
                c.availability?.telehealth_consults ? '✓ Available' : 'In-person only'
              )} />
              <CompareRow label="Accepting Patients" values={clinicData.map(c =>
                c.availability?.accepting_new_patients !== false ? '✓ Yes' : 'Waitlist'
              )} />
              <CompareRow label="Phone" values={clinicData.map(c => c.phone || '—')} />
              <tr>
                <td className="p-4 text-sm font-medium text-gray-500">Action</td>
                {clinicData.map((clinic) => (
                  <td key={clinic.id} className="p-4 text-center">
                    <a
                      href={`/clinic/${clinic.slug}`}
                      className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
                    >
                      View Clinic
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500">Search and add up to 3 clinics to compare side-by-side.</p>
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, values, highlight, data }: {
  label: string;
  values: string[];
  highlight?: string;
  data?: ClinicCompare[];
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="p-4 text-sm font-medium text-gray-500">{label}</td>
      {values.map((val, i) => (
        <td key={i} className="p-4 text-sm text-center text-gray-700">
          {val}
        </td>
      ))}
    </tr>
  );
}
