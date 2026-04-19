import { useState, useEffect, useCallback } from 'react';

interface SecondOpinion {
  id: string;
  doctorId: string;
  patientId: string | null;
  caseSummary: string;
  status: string;
  opinion: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface DoctorSecondOpinionsProps {
  doctorId?: string;
  clinicId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  requested: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  in_review: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  requested: 'Requested',
  accepted: 'Accepted',
  in_review: 'In Review',
  completed: 'Completed',
  rejected: 'Rejected',
};

export default function DoctorSecondOpinions({ doctorId, clinicId }: DoctorSecondOpinionsProps) {
  const [opinions, setOpinions] = useState<SecondOpinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const fetchOpinions = useCallback(async () => {
    if (!doctorId && !clinicId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/doctor/second-opinions?clinicId=${clinicId || ''}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setOpinions(data.opinions || []);
    } catch {
      setError('Failed to load second opinions');
    } finally {
      setLoading(false);
    }
  }, [doctorId, clinicId]);

  useEffect(() => {
    fetchOpinions();
  }, [fetchOpinions]);

  const updateStatus = async (id: string, action: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/doctor/second-opinions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) fetchOpinions();
    } catch {
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const submitResponse = async (id: string) => {
    setUpdating(true);
    try {
      const res = await fetch('/api/doctor/second-opinions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, response: responseText }),
      });
      if (res.ok) {
        setSelected(null);
        setResponseText('');
        fetchOpinions();
      }
    } catch {
      setError('Failed to submit response');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = opinions.filter(op => {
    if (filter === 'pending') return op.status !== 'completed' && op.status !== 'rejected';
    if (filter === 'completed') return op.status === 'completed';
    return true;
  });

  const stats = {
    total: opinions.length,
    pending: opinions.filter(o => o.status !== 'completed' && o.status !== 'rejected').length,
    completed: opinions.filter(o => o.status === 'completed').length,
  };

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Requests', count: stats.total, color: 'text-gray-900' },
          { label: 'Pending', count: stats.pending, color: 'text-amber-600' },
          { label: 'Completed', count: stats.completed, color: 'text-green-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {(['all', 'pending', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Opinions list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm">No second opinion requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(op => (
            <div key={op.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">Case Review</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[op.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[op.status] || op.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(op.createdAt).toLocaleDateString()}</p>
                </div>
                {op.completedAt && (
                  <p className="text-xs text-gray-400">Completed {new Date(op.completedAt).toLocaleDateString()}</p>
                )}
              </div>

              {/* Case summary */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Case Summary</p>
                <p className="text-sm text-gray-700">{op.caseSummary}</p>
              </div>

              {/* Opinion / response */}
              {op.opinion ? (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Your Opinion</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{op.opinion}</p>
                </div>
              ) : selected === op.id ? (
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Write Your Opinion</p>
                  <textarea
                    value={responseText}
                    onChange={e => setResponseText(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 mb-2"
                    placeholder="Provide your second opinion on this case..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitResponse(op.id)}
                      disabled={updating || !responseText.trim()}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      Submit Opinion
                    </button>
                    <button
                      onClick={() => { setSelected(null); setResponseText(''); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex gap-2">
                {op.status !== 'completed' && op.status !== 'rejected' && (
                  <>
                    {op.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(op.id, 'accept')}
                        disabled={updating}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      >
                        Accept
                      </button>
                    )}
                    {(op.status === 'accepted' || op.status === 'in_review') && (
                      <button
                        onClick={() => setSelected(selected === op.id ? null : op.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-700"
                      >
                        Write Opinion
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(op.id, 'complete')}
                      disabled={updating}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => updateStatus(op.id, 'reject')}
                      disabled={updating}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
