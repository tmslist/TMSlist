import { useState } from 'react';

interface ClinicResult {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
}

export default function PortalClaimClinic({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClinicResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<ClinicResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'claimed' | 'pending' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setSelectedClinic(null);

    try {
      const res = await fetch(`/api/portal/claim?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.clinics || []);
    } catch {
      setError('Failed to search clinics');
    } finally {
      setSearching(false);
    }
  }

  async function handleClaim() {
    if (!selectedClinic) return;
    setClaiming(true);
    setError('');

    try {
      const res = await fetch('/api/portal/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: selectedClinic.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to claim clinic');
      }

      if (data.directClaim) {
        setStatus('claimed');
      } else {
        setStatus('pending');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to claim clinic');
    } finally {
      setClaiming(false);
    }
  }

  if (status === 'claimed') {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Clinic Claimed!</h2>
          <p className="text-gray-500 mb-6">Your account has been linked to <strong>{selectedClinic?.name}</strong>. You can now manage your listing.</p>
          <a
            href="/portal/dashboard"
            className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Claim Submitted</h2>
          <p className="text-gray-500 mb-6">Your claim for <strong>{selectedClinic?.name}</strong> has been submitted for review. We'll verify your ownership and notify you by email.</p>
          <a
            href="/portal/dashboard"
            className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <a href="/portal/dashboard" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-2 inline-block">
          &larr; Back to Dashboard
        </a>
        <h1 className="text-2xl font-semibold text-gray-900">Claim Your Clinic</h1>
        <p className="text-gray-500 text-sm mt-1">Search for your clinic and claim ownership to manage its listing.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by clinic name..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">{results.length} clinic{results.length !== 1 ? 's' : ''} found</p>
          {results.map((clinic) => (
            <button
              key={clinic.id}
              onClick={() => setSelectedClinic(clinic)}
              className={`w-full text-left bg-white rounded-xl border p-4 shadow-sm transition-all ${
                selectedClinic?.id === clinic.id
                  ? 'border-emerald-500 ring-2 ring-emerald-100'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-medium text-gray-900">{clinic.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {clinic.address ? `${clinic.address}, ` : ''}{clinic.city}, {clinic.state}
              </p>
            </button>
          ))}
        </div>
      )}

      {results.length === 0 && query && !searching && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center mb-6">
          <p className="text-gray-500">No clinics found matching "{query}"</p>
          <p className="text-sm text-gray-400 mt-1">Try a different name or contact us to add your clinic.</p>
        </div>
      )}

      {/* Claim Button */}
      {selectedClinic && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6">
          <p className="text-sm text-gray-700 mb-4">
            You are claiming <strong>{selectedClinic.name}</strong> in {selectedClinic.city}, {selectedClinic.state}.
            {' '}If the clinic email matches your account email (<strong>{userEmail}</strong>), you'll be linked immediately.
            Otherwise, your claim will be reviewed by our team.
          </p>
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {claiming ? 'Submitting Claim...' : 'Claim This Clinic'}
          </button>
        </div>
      )}
    </div>
  );
}
