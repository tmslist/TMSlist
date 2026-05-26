import { useEffect, useMemo, useState } from 'react';

interface LeadMetadata {
  status?: string;
  firstResponseAt?: string;
  lastContactedAt?: string;
  lastNote?: string;
  lastNoteAt?: string;
  doctorId?: string;
}

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
  metadata?: LeadMetadata;
}

interface Props {
  doctorId?: string;
  clinicId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  specialist_enquiry: 'Specialist Enquiry',
  lead_magnet: 'Lead Magnet',
  newsletter: 'Newsletter',
  appointment_request: 'Appointment',
  callback_request: 'Callback',
  contact: 'Contact',
};

const STATUS_OPTIONS: { key: string; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { key: 'contacted', label: 'Contacted', color: 'bg-amber-100 text-amber-700' },
  { key: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-700' },
  { key: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-600' },
  { key: 'spam', label: 'Spam', color: 'bg-rose-100 text-rose-700' },
];

const STATUS_LOOKUP = Object.fromEntries(STATUS_OPTIONS.map(s => [s.key, s]));

const SLA_TARGET_MINUTES = 60;        // ideal first-response window
const SLA_OVERDUE_MINUTES = 24 * 60;  // beyond this: overdue red

function statusOf(lead: Lead): string {
  return lead.metadata?.status || 'new';
}

function ageMinutes(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function formatAge(mins: number): string {
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function slaState(lead: Lead): { tone: 'success' | 'warn' | 'danger' | 'neutral'; label: string } {
  const status = statusOf(lead);
  if (status === 'converted') return { tone: 'success', label: 'Won' };
  if (status === 'closed' || status === 'spam') return { tone: 'neutral', label: 'Closed' };

  const meta = lead.metadata;
  if (meta?.firstResponseAt) {
    // measure response time
    const respMin = Math.floor(
      (new Date(meta.firstResponseAt).getTime() - new Date(lead.createdAt).getTime()) / 60000
    );
    if (respMin <= SLA_TARGET_MINUTES) return { tone: 'success', label: `Replied in ${formatDuration(respMin)}` };
    return { tone: 'warn', label: `Replied in ${formatDuration(respMin)}` };
  }

  // not yet replied
  const age = ageMinutes(lead.createdAt);
  if (age <= SLA_TARGET_MINUTES) return { tone: 'success', label: `${SLA_TARGET_MINUTES - age}m to SLA` };
  if (age <= SLA_OVERDUE_MINUTES) return { tone: 'warn', label: `${formatDuration(age)} pending` };
  return { tone: 'danger', label: `Overdue · ${formatDuration(age)}` };
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TONE_CLASS: Record<'success' | 'warn' | 'danger' | 'neutral', string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function DoctorLeads({ doctorId, clinicId }: Props) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'overdue' | 'new' | 'contacted' | 'converted'>('open');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId && !clinicId) { setLoading(false); return; }
    fetch(`/api/doctor/leads?clinicId=${clinicId || ''}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setLeads(d.leads || []); setLoading(false); })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [doctorId, clinicId]);

  // Live SLA — re-render every 60s so timers tick.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  async function patchLead(id: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/doctor/leads?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setLeads(prev => prev.map(l => (l.id === id ? { ...l, metadata: updated.metadata } : l)));
    } catch {
      setError('Failed to update lead');
    }
  }

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const thisWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let todayN = 0, weekN = 0, awaiting = 0, overdue = 0, won = 0;
    for (const l of leads) {
      const created = new Date(l.createdAt).getTime();
      if (new Date(l.createdAt).toDateString() === today) todayN++;
      if (created >= thisWeek) weekN++;
      const status = statusOf(l);
      const responded = !!l.metadata?.firstResponseAt;
      if (!responded && status !== 'closed' && status !== 'spam' && status !== 'converted') {
        awaiting++;
        if (ageMinutes(l.createdAt) > SLA_OVERDUE_MINUTES) overdue++;
      }
      if (status === 'converted') won++;
    }
    return { todayN, weekN, awaiting, overdue, won, total: leads.length };
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads
      .filter(l => {
        const status = statusOf(l);
        if (filter === 'all') return true;
        if (filter === 'open') return status !== 'closed' && status !== 'spam' && status !== 'converted';
        if (filter === 'overdue') {
          return !l.metadata?.firstResponseAt && ageMinutes(l.createdAt) > SLA_OVERDUE_MINUTES && status !== 'closed' && status !== 'spam';
        }
        return status === filter;
      })
      .filter(l => {
        if (!q) return true;
        return (
          (l.name || '').toLowerCase().includes(q) ||
          (l.email || '').toLowerCase().includes(q) ||
          (l.phone || '').toLowerCase().includes(q) ||
          (l.message || '').toLowerCase().includes(q)
        );
      });
  }, [leads, filter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-[var(--line)] border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Today" value={stats.todayN} />
        <Stat label="This week" value={stats.weekN} />
        <Stat label="Awaiting reply" value={stats.awaiting} tone={stats.awaiting > 0 ? 'warn' : 'neutral'} />
        <Stat label="Overdue (>24h)" value={stats.overdue} tone={stats.overdue > 0 ? 'danger' : 'neutral'} />
        <Stat label="Converted" value={stats.won} tone="success" />
      </div>

      {/* Filter + search */}
      <div className="flex items-center gap-2 flex-wrap">
        {(
          [
            ['open', 'Open'],
            ['overdue', 'Overdue'],
            ['new', 'New'],
            ['contacted', 'Contacted'],
            ['converted', 'Won'],
            ['all', 'All'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              filter === key
                ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                : 'bg-white text-[var(--ink2)] border-[var(--line)] hover:bg-[var(--paper2)]'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-white border border-[var(--line)] rounded-lg px-3 py-1.5 w-full md:w-72">
          <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, message…"
            className="flex-1 bg-transparent outline-none text-sm text-[var(--ink)]"
          />
        </div>
      </div>

      {/* Lead list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--line)] p-10 text-center">
          <p className="text-sm text-[var(--muted)]">No leads match this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => {
            const sla = slaState(lead);
            const status = statusOf(lead);
            const statusOpt = STATUS_LOOKUP[status] || STATUS_LOOKUP.new;
            const isOpen = expanded === lead.id;
            return (
              <div key={lead.id} className="bg-white rounded-xl border border-[var(--line)] shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[var(--ink)]">{lead.name || 'Anonymous'}</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--paper2)] text-[var(--ink2)] font-semibold">
                          {TYPE_LABELS[lead.type] || lead.type}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusOpt.color}`}>
                          {statusOpt.label}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TONE_CLASS[sla.tone]}`}>
                          {sla.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[var(--muted)] flex-wrap">
                        {lead.email && <span>{lead.email}</span>}
                        {lead.phone && <span>· {lead.phone}</span>}
                        <span>· {formatAge(ageMinutes(lead.createdAt))}</span>
                      </div>
                      {lead.message && (
                        <p className="text-sm text-[var(--ink2)] mt-2 line-clamp-2">{lead.message}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}?subject=${encodeURIComponent('Re: TMS enquiry')}`}
                          onClick={() => patchLead(lead.id, { markFirstResponse: true, status: status === 'new' ? 'contacted' : status })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[var(--ink)] hover:opacity-90 text-center"
                        >
                          Email
                        </a>
                      )}
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={() => patchLead(lead.id, { markFirstResponse: true, status: status === 'new' ? 'contacted' : status })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--paper2)] text-center"
                        >
                          Call
                        </a>
                      )}
                      <button
                        onClick={() => setExpanded(isOpen ? null : lead.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] border border-transparent hover:border-[var(--line)]"
                      >
                        {isOpen ? 'Hide' : 'Details'}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-[var(--line)] space-y-3">
                      {lead.message && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-1">Message</p>
                          <p className="text-sm text-[var(--ink2)] whitespace-pre-wrap">{lead.message}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-[var(--muted)] mb-2">Update status</p>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUS_OPTIONS.map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => patchLead(lead.id, { status: opt.key })}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                status === opt.key
                                  ? `${opt.color} border-transparent`
                                  : 'bg-white text-[var(--ink2)] border-[var(--line)] hover:bg-[var(--paper2)]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {lead.metadata?.firstResponseAt && (
                        <p className="text-xs text-[var(--muted)]">
                          First response: {new Date(lead.metadata.firstResponseAt).toLocaleString()}
                        </p>
                      )}
                      {lead.metadata?.lastContactedAt && (
                        <p className="text-xs text-[var(--muted)]">
                          Last contact: {new Date(lead.metadata.lastContactedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'warn' | 'danger' | 'success';
}) {
  const colorMap: Record<string, string> = {
    neutral: 'text-[var(--ink)]',
    warn: 'text-amber-700',
    danger: 'text-rose-700',
    success: 'text-emerald-700',
  };
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-4 shadow-sm">
      <div className={`text-2xl font-bold ${colorMap[tone]}`}>{value}</div>
      <div className="text-xs text-[var(--muted)] mt-0.5">{label}</div>
    </div>
  );
}
