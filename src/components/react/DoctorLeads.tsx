import { useState, useEffect } from 'react';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  type: string;
  doctorName: string | null;
  clinicName: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
  followUpAt?: string | null;
  status?: string;
}

interface DoctorLeadsProps {
  doctorId?: string;
  clinicId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  specialist_enquiry: 'Specialist Enquiry',
  lead_magnet: 'Lead Magnet',
  newsletter: 'Newsletter',
  appointment_request: 'Appointment Request',
  callback_request: 'Callback Request',
  contact: 'Contact',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  converted: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function DoctorLeads({ doctorId, clinicId }: DoctorLeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [replyLead, setReplyLead] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');

  useEffect(() => {
    if (!doctorId && !clinicId) { setLoading(false); return; }
    fetch(`/api/doctor/leads?clinicId=${clinicId || ''}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setLeads(d.leads || []); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [doctorId, clinicId]);

  const setFollowUp = async (leadId: string) => {
    try {
      const res = await fetch('/api/doctor/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, followUpAt: followUpDate }),
      });
      if (res.ok) setLeads(prev => prev.map(l => l.id === leadId ? { ...l, followUpAt: followUpDate } : l));
    } catch {
      setError('Failed to set reminder');
    }
  };

  // Source breakdown
  const sourceCounts: Record<string, number> = {};
  leads.forEach(l => {
    const src = String(l.type || 'unknown');
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const totalSources = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
  const pieData = Object.entries(sourceCounts).map(([key, count]) => ({
    key, count, pct: totalSources > 0 ? Math.round((count / totalSources) * 100) : 0,
  }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Source breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Lead Sources</h2>
          {pieData.length === 0 ? <p className="text-sm text-gray-500">No data</p> : (
            <>
              {/* SVG Pie Chart */}
              <svg viewBox="0 0 100 100" className="w-36 h-36 mx-auto mb-4">
                {(() => {
                  let startAngle = 0;
                  return pieData.map((slice, i) => {
                    const angle = (slice.count / totalSources) * 360;
                    const endAngle = startAngle + angle;
                    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                    const largeArc = angle > 180 ? 1 : 0;
                    startAngle = endAngle;
                    return (
                      <path key={slice.key} d={`M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={COLORS[i % COLORS.length]} />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="20" fill="white" />
              </svg>
              <div className="space-y-2">
                {pieData.map((slice, i) => (
                  <div key={slice.key} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 flex-1">{TYPE_LABELS[slice.key] || slice.key}</span>
                    <span className="text-xs font-medium text-gray-900">{slice.count} ({slice.pct}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Leads list */}
        <div className="lg:col-span-2 space-y-3">
          {leads.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500 text-sm">No leads yet</p>
            </div>
          ) : leads.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{lead.name || 'Anonymous'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{TYPE_LABELS[lead.type] || lead.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[lead.status || 'new']}`}>{lead.status || 'new'}</span>
                  </div>
                  {lead.email && <p className="text-sm text-gray-500">{lead.email}</p>}
                  {lead.phone && <p className="text-sm text-gray-500">{lead.phone}</p>}
                  {lead.message && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{lead.message}</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(lead.createdAt).toLocaleString()}</p>
                  {lead.followUpAt && <p className="text-xs text-blue-600 mt-1">Follow-up: {new Date(lead.followUpAt).toLocaleString()}</p>}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button onClick={() => setReplyLead(replyLead === lead.id ? null : lead.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap">Reply</button>
                  <button onClick={() => setReplyLead(lead.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 whitespace-nowrap">Remind</button>
                </div>
              </div>
              {replyLead === lead.id && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs font-medium text-gray-600 mb-2">Set follow-up reminder</p>
                  <input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2" />
                  <button onClick={() => setFollowUp(lead.id)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Save Reminder</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
