'use client';
import { useState, useEffect } from 'react';

interface ClinicNpiEntry {
  id: string;
  name: string;
  city: string;
  state: string;
  npi: string | null;
}

interface Props {
  onClose: () => void;
}

export default function AdminNPIValidationPanel({ onClose }: Props) {
  const [withoutNpi, setWithoutNpi] = useState<ClinicNpiEntry[]>([]);
  const [withUnverified, setWithUnverified] = useState<ClinicNpiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [inputNpi, setInputNpi] = useState<Record<string, string>>({});
  const [totalWithoutNpi, setTotalWithoutNpi] = useState(0);
  const [totalUnverified, setTotalUnverified] = useState(0);
  const [filter, setFilter] = useState<'missing' | 'unverified' | 'all'>('missing');

  useEffect(() => {
    fetch('/api/admin/clinics/npi-validate')
      .then(r => r.json())
      .then(data => {
        setWithoutNpi(data.withoutNpi || []);
        setWithUnverified(data.withUnverifiedNpi || []);
        setTotalWithoutNpi(data.totalWithoutNpi || 0);
        setTotalUnverified(data.totalUnverified || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const verifyNpi = async (clinicId: string, npi: string) => {
    setVerifying(clinicId);
    try {
      const res = await fetch('/api/admin/clinics/npi-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, npi }),
      });
      const data = await res.json();
      if (data.valid) {
        setWithUnverified(prev => prev.filter(c => c.id !== clinicId));
        setTotalUnverified(prev => Math.max(0, prev - 1));
      } else {
        alert(`NPI validation failed: ${data.error}`);
      }
    } finally {
      setVerifying(null);
    }
  };

  const validateNewNpi = async (npi: string) => {
    const res = await fetch('/api/admin/clinics/npi-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ npi }),
    });
    return res.json();
  };

  const displayed = filter === 'missing' ? withoutNpi
    : filter === 'unverified' ? withUnverified
    : [...withoutNpi, ...withUnverified];

  const formatNpi = (val: string) => val.replace(/\D/g, '').slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">NPI Validation</h2>
            <p className="text-xs text-[var(--muted)]">
              {totalWithoutNpi} missing &middot; {totalUnverified} unverified
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {([['missing', `Missing NPI (${totalWithoutNpi})`], ['unverified', `Unverified (${totalUnverified})`], ['all', 'All']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === val ? 'bg-[rgba(10,22,40,0.08)] text-[var(--ink)]' : 'text-[var(--muted)] hover:bg-[var(--paper2)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="w-5 h-5 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[var(--muted)] text-sm">Loading NPI queue...</span>
            </div>
          ) : displayed.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--muted)]">No clinics in this category.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayed.map(clinic => (
                <div key={clinic.id} className="border border-[var(--line)] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--ink)] text-sm truncate">{clinic.name}</p>
                      <p className="text-xs text-[var(--muted)]">{clinic.city}, {clinic.state}</p>
                    </div>
                    {!clinic.npi ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          value={inputNpi[clinic.id] ?? ''}
                          onChange={e => setInputNpi(prev => ({
                            ...prev, [clinic.id]: formatNpi(e.target.value)
                          }))}
                          placeholder="10-digit NPI"
                          maxLength={10}
                          className="w-32 text-xs border border-[var(--line)] rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none font-mono"
                        />
                        <button
                          onClick={() => verifyNpi(clinic.id, inputNpi[clinic.id])}
                          disabled={!inputNpi[clinic.id] || inputNpi[clinic.id].length !== 10}
                          className="px-3 py-1.5 text-xs font-medium bg-[var(--ink)] text-white rounded-lg hover:bg-[var(--ink)] disabled:opacity-50 transition-colors"
                        >
                          Add & Verify
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono text-[var(--muted)] bg-[var(--paper2)] px-2 py-1 rounded">
                          {clinic.npi}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                          Unverified
                        </span>
                        <button
                          onClick={() => verifyNpi(clinic.id, clinic.npi!)}
                          disabled={verifying === clinic.id}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {verifying === clinic.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Verifying...
                            </>
                          ) : 'Verify'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-4 shrink-0">
          <p className="text-xs text-[var(--muted)] text-center">
            NPI validation uses the{" "}
            <a href="https://npiregistry.cms.hhs.gov/" target="_blank" rel="noopener noreferrer" className="text-[var(--ink)] hover:underline">
              CMS NPI Registry API
            </a>{" "}
            — no API key required.
          </p>
        </div>
      </div>
    </div>
  );
}