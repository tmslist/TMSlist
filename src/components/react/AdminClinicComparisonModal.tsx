'use client';
import { useState, useEffect } from 'react';

interface ClinicData {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  ratingAvg: string | null;
  reviewCount: number;
  verified: boolean;
  isFeatured: boolean;
  description: string | null;
  phone: string | null;
  website: string | null;
  createdAt: string;
}

interface Props {
  clinicIds: string[];
  onClose: () => void;
  onMerge: () => void;
}

export default function AdminClinicComparisonModal({ clinicIds, onClose, onMerge }: Props) {
  const [clinics, setClinics] = useState<ClinicData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      clinicIds.map(id =>
        fetch(`/api/admin/clinics/${id}`).then(r => r.json())
      )
    ).then(results => {
      setClinics(results.filter((r: any) => !r.error));
      setLoading(false);
    });
  }, [clinicIds]);

  function completeness(c: ClinicData) {
    const fields = [c.name, c.city, c.state, c.ratingAvg, c.reviewCount, c.description, c.phone, c.website];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--ink2)] text-sm">Loading clinics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Clinic Comparison</h2>
            <p className="text-xs text-[var(--muted)]">{clinics.length} clinics selected</p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Clinic Headers */}
        <div
          className="grid p-6 gap-4"
          style={{ gridTemplateColumns: `100px repeat(${clinics.length}, 1fr)` }}
        >
          <div />
          {clinics.map((clinic) => (
            <div key={clinic.id} className="text-center">
              <div className="w-14 h-14 bg-[rgba(10,22,40,0.08)] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-[var(--ink)] font-bold text-lg">
                  {clinic.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-[var(--ink)] text-sm">{clinic.name}</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">{clinic.city}, {clinic.state}</p>
              <div className="mt-2 flex justify-center gap-1.5 flex-wrap">
                {clinic.verified && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Verified</span>
                )}
                {clinic.isFeatured && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Featured</span>
                )}
              </div>
              <a
                href={`/clinic/${clinic.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-[var(--ink)] hover:text-[var(--ink)]"
              >
                View Live
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        {/* Metrics Table */}
        <div className="px-6 pb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--line)]">
                <th className="text-left py-3 pr-4 text-[var(--muted)] font-semibold text-xs uppercase tracking-wide">Metric</th>
                {clinics.map(c => (
                  <th key={c.id} className="text-center py-3 px-2 text-[var(--ink)] font-semibold">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Rating', clinics.map(c => c.ratingAvg ? `${Number(c.ratingAvg).toFixed(1)} / 5` : '—')],
                ['Reviews', clinics.map(c => String(c.reviewCount))],
                ['Phone', clinics.map(c => c.phone || '—')],
                ['Website', clinics.map(c => c.website ? 'Yes' : 'No')],
                ['Description', clinics.map(c => c.description ? `${c.description.length} chars` : '—')],
                ['Completeness', clinics.map(c => `${completeness(c)}%`)],
              ].map(([label, values]) => (
                <tr key={label as string} className="border-b border-[var(--line)]">
                  <td className="py-3 pr-4 text-[var(--muted)] font-medium">{label as string}</td>
                  {values.map((v, i) => (
                    <td key={i} className="py-3 px-2 text-center font-medium text-[var(--ink)]">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--ink2)] border border-[var(--line)] rounded-lg hover:bg-[var(--paper2)] transition-colors"
          >
            Close
          </button>
          {clinics.length === 2 && (
            <button
              onClick={onMerge}
              className="px-4 py-2 text-sm font-medium bg-[var(--ink)] text-white rounded-lg hover:bg-[var(--ink)] transition-colors"
            >
              Merge These Clinics
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
