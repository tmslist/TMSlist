'use client';
import { useState, useEffect } from 'react';

interface DuplicatePair {
  id1: string; name1: string; slug1: string; city1: string; state1: string;
  address1: string | null; phone1: string | null; website1: string | null;
  id2: string; name2: string; slug2: string; city2: string; state2: string;
  address2: string | null; phone2: string | null; website2: string | null;
  score: number;
}

interface Props {
  onClose: () => void;
  onMerged: () => void;
}

export default function AdminDuplicateMergeModal({ onClose, onMerged }: Props) {
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [selectedPair, setSelectedPair] = useState<DuplicatePair | null>(null);
  const [targetId, setTargetId] = useState('');
  const [step, setStep] = useState<'list' | 'merge'>('list');

  useEffect(() => {
    fetch('/api/admin/clinics/duplicates')
      .then(r => r.json())
      .then(data => {
        setDuplicates(data.duplicates || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const scoreLabel = (s: number) => {
    if (s >= 7) return { label: 'High confidence', color: 'bg-red-100 text-red-700' };
    if (s >= 4) return { label: 'Possible duplicate', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Low confidence', color: 'bg-[var(--paper2)] text-[var(--ink2)]' };
  };

  const handleMerge = async () => {
    if (!selectedPair || !targetId) return;
    setMerging(true);
    try {
      const keepId = targetId === selectedPair.id1 ? selectedPair.id1 : selectedPair.id2;
      const res = await fetch(`/api/admin/clinics/${keepId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mergeIntoId: targetId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDuplicates(prev => prev.filter(d => d.id1 !== selectedPair.id1 && d.id2 !== selectedPair.id2));
      setStep('list');
      setSelectedPair(null);
      setTargetId('');
      onMerged();
    } catch (err: any) {
      alert(err.message || 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  const startMerge = (pair: DuplicatePair) => {
    setSelectedPair(pair);
    setTargetId(pair.id1);
    setStep('merge');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Duplicate Clinic Detection</h2>
            <p className="text-xs text-[var(--muted)]">{duplicates.length} potential duplicates found</p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <div className="w-5 h-5 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[var(--muted)] text-sm">Scanning for duplicates...</span>
            </div>
          ) : duplicates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-[var(--ink)] mb-1">No duplicates found</p>
              <p className="text-sm text-[var(--muted)]">Your clinic database looks clean.</p>
            </div>
          ) : step === 'list' ? (
            <div className="space-y-3">
              {duplicates.map((pair, i) => {
                const sl = scoreLabel(pair.score);
                return (
                  <div key={i} className="border border-[var(--line)] rounded-xl p-4 hover:border-[rgba(10,22,40,0.15)] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sl.color}`}>
                            {sl.label} ({pair.score})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-[var(--muted)] mb-0.5">Clinic A</p>
                            <p className="font-medium text-[var(--ink)] text-sm truncate">{pair.name1}</p>
                            <p className="text-xs text-[var(--muted)]">{pair.city1}, {pair.state1}</p>
                            {pair.phone1 && <p className="text-xs text-[var(--muted)] mt-0.5">{pair.phone1}</p>}
                          </div>
                          <div>
                            <p className="text-xs text-[var(--muted)] mb-0.5">Clinic B</p>
                            <p className="font-medium text-[var(--ink)] text-sm truncate">{pair.name2}</p>
                            <p className="text-xs text-[var(--muted)]">{pair.city2}, {pair.state2}</p>
                            {pair.phone2 && <p className="text-xs text-[var(--muted)] mt-0.5">{pair.phone2}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => startMerge(pair)}
                          className="px-3 py-1.5 text-xs font-medium bg-[var(--ink)] text-white rounded-lg hover:bg-[var(--ink)] transition-colors"
                        >
                          Merge
                        </button>
                        <button
                          onClick={() => setDuplicates(prev => prev.filter((_, idx) => idx !== i))}
                          className="px-3 py-1.5 text-xs text-[var(--muted)] border border-[var(--line)] rounded-lg hover:bg-[var(--paper2)] transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : selectedPair ? (
            <div>
              <button onClick={() => setStep('list')} className="flex items-center gap-1 text-xs text-[var(--ink)] hover:underline mb-4">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to list
              </button>
              <h3 className="font-semibold text-[var(--ink)] mb-3">Select which clinic to keep</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{
                  id: selectedPair.id1, name: selectedPair.name1, city: selectedPair.city1,
                  state: selectedPair.state1, phone: selectedPair.phone1, address: selectedPair.address1,
                  slug: selectedPair.slug1,
                }, {
                  id: selectedPair.id2, name: selectedPair.name2, city: selectedPair.city2,
                  state: selectedPair.state2, phone: selectedPair.phone2, address: selectedPair.address2,
                  slug: selectedPair.slug2,
                }].map(clinic => (
                  <div
                    key={clinic.id}
                    onClick={() => setTargetId(clinic.id)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      targetId === clinic.id ? 'border-[var(--ink2)] bg-[rgba(10,22,40,0.08)]' : 'border-[var(--line)] hover:border-[rgba(10,22,40,0.15)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        targetId === clinic.id ? 'border-[var(--ink)] bg-[var(--ink)]' : 'border-[var(--line)]'
                      }`}>
                        {targetId === clinic.id && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="font-semibold text-[var(--ink)] text-sm">{clinic.name}</span>
                    </div>
                    <p className="text-xs text-[var(--muted)] ml-6">{clinic.city}, {clinic.state}</p>
                    {clinic.address && <p className="text-xs text-[var(--muted)] ml-6">{clinic.address}</p>}
                    {clinic.phone && <p className="text-xs text-[var(--muted)] ml-6">{clinic.phone}</p>}
                    <p className="text-xs text-[var(--muted)] ml-6 mt-1">/clinic/{clinic.slug}/</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <strong>Warning:</strong> Merging will transfer all reviews and pending takeover requests from the discarded clinic. This cannot be undone.
              </p>
              <button
                onClick={handleMerge}
                disabled={merging || !targetId}
                className="mt-3 w-full px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {merging ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Merging...
                  </>
                ) : (
                  'Confirm Merge'
                )}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}