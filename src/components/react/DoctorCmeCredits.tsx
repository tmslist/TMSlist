'use client';
import { useState, useCallback } from 'react';

interface CmeCredit {
  id: string;
  creditsEarned: number;
  creditType: string;
  activityName: string;
  completionDate: string;
  expirationDate?: string;
  status: 'active' | 'expiring_soon' | 'expired';
  certificateUrl?: string;
}

interface DoctorCmeCreditsProps {
  initialCredits?: CmeCredit[];
  doctorId?: string;
}

export default function DoctorCmeCredits({ initialCredits = [], doctorId }: DoctorCmeCreditsProps) {
  const [credits, setCredits] = useState<CmeCredit[]>(initialCredits.length > 0 ? initialCredits : [
    { id: '1', creditsEarned: 25, creditType: 'Category 1', activityName: 'TMS Fundamentals and Safety Protocols', completionDate: '2024-01-15', expirationDate: '2026-01-15', status: 'active' },
    { id: '2', creditsEarned: 12, creditType: 'Category 1', activityName: 'Neuroplasticity in Depression Treatment', completionDate: '2024-02-20', expirationDate: '2025-02-20', status: 'expiring_soon' },
    { id: '3', creditsEarned: 8, creditType: 'Category 2', activityName: 'Patient Communication in TMS', completionDate: '2024-03-10', expirationDate: '2027-03-10', status: 'active' },
    { id: '4', creditsEarned: 20, creditType: 'Category 1', activityName: 'Advanced TMS Protocols Workshop', completionDate: '2023-11-05', expirationDate: '2024-11-05', status: 'expired' },
    { id: '5', creditsEarned: 15, creditType: 'Category 1', activityName: 'Clinical Research Methods in TMS', completionDate: '2024-04-01', status: 'active' },
  ]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired'>('all');

  const totalCredits = credits.reduce((sum, c) => sum + c.creditsEarned, 0);
  const activeCredits = credits.filter(c => c.status === 'active' || c.status === 'expiring_soon').reduce((sum, c) => sum + c.creditsEarned, 0);
  const expiringCredits = credits.filter(c => c.status === 'expiring_soon').reduce((sum, c) => sum + c.creditsEarned, 0);

  const filteredCredits = filter === 'all' ? credits : credits.filter(c => c.status === filter);

  const handleUpload = useCallback((credit: CmeCredit) => {
    setCredits(prev => [...prev, { ...credit, id: Date.now().toString() }]);
    setShowUploadModal(false);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setCredits(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">CME Credits</h2>
          <p className="text-sm text-gray-500 mt-1">Track continuing medical education hours</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Add Certificate
        </button>
      </div>

      {/* Credits Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 shadow-sm text-white">
          <p className="text-xs font-medium text-blue-200 uppercase tracking-wider">Total Credits</p>
          <p className="text-3xl font-bold mt-1">{totalCredits}</p>
          <p className="text-xs text-blue-200 mt-1">All time earned</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Credits</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCredits}</p>
          <p className="text-xs text-gray-400 mt-1">Currently valid</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Expiring Soon</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{expiringCredits}</p>
          <p className="text-xs text-gray-400 mt-1">Within 90 days</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Records</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{credits.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total certificates</p>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3">CME Requirements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-blue-600">50</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Required per cycle</p>
              <div className="mt-1.5 bg-gray-200 rounded-full h-2 w-48 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(activeCredits / 50) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{activeCredits} / 50 credits completed</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-purple-600">40</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Category 1 Required</p>
              <div className="mt-1.5 bg-gray-200 rounded-full h-2 w-48 overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${(credits.filter(c => c.creditType === 'Category 1').reduce((s, c) => s + c.creditsEarned, 0) / 40) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1">{credits.filter(c => c.creditType === 'Category 1').reduce((s, c) => s + c.creditsEarned, 0)} / 40 credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Credits List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Credit History</h3>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'expiring_soon', 'expired'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filter === f ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'expiring_soon' ? 'Expiring' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {filteredCredits.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-sm">No credits match this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredCredits.map((credit) => (
              <div key={credit.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  credit.status === 'expired' ? 'bg-gray-100' :
                  credit.status === 'expiring_soon' ? 'bg-amber-100' :
                  'bg-emerald-100'
                }`}>
                  <span className={`text-sm font-bold ${
                    credit.status === 'expired' ? 'text-gray-400' :
                    credit.status === 'expiring_soon' ? 'text-amber-600' :
                    'text-emerald-600'
                  }`}>{credit.creditsEarned}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{credit.activityName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{credit.creditType}</span>
                    <span className="text-xs text-gray-400">Completed {new Date(credit.completionDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    credit.status === 'expired' ? 'bg-gray-100 text-gray-500' :
                    credit.status === 'expiring_soon' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {credit.status === 'expiring_soon' ? 'Expiring Soon' : credit.status.charAt(0).toUpperCase() + credit.status.slice(1)}
                  </span>
                  {credit.certificateUrl && (
                    <a
                      href={credit.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Cert
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(credit.id)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadCertificateModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}

function UploadCertificateModal({ onClose, onUpload }: { onClose: () => void; onUpload: (credit: CmeCredit) => void }) {
  const [activityName, setActivityName] = useState('');
  const [creditType, setCreditType] = useState('Category 1');
  const [creditsEarned, setCreditsEarned] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName || !creditsEarned || !completionDate) return;
    onUpload({
      id: '',
      activityName,
      creditType,
      creditsEarned: parseInt(creditsEarned),
      completionDate,
      expirationDate: expirationDate || undefined,
      status: expirationDate && new Date(expirationDate) < new Date() ? 'expired' : 'active',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CME Certificate</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Name</label>
            <input type="text" value={activityName} onChange={(e) => setActivityName(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
              <input type="number" value={creditsEarned} onChange={(e) => setCreditsEarned(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={creditType} onChange={(e) => setCreditType(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500">
                <option>Category 1</option>
                <option>Category 2</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
              <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration (opt.)</label>
              <input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}