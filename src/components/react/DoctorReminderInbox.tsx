import { useEffect, useState } from 'react';

interface Reminder {
  id: string;
  leadId: string;
  reminderAt: string;
  message: string | null;
  isCompleted: boolean;
  leadName: string | null;
  leadEmail: string | null;
  leadPhone: string | null;
}

function isReviewRequest(r: Reminder) {
  return /review request/i.test(r.message || '');
}

function ago(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export default function DoctorReminderInbox() {
  const [tab, setTab] = useState<'due' | 'upcoming'>('due');
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch(`/api/doctor/reminders?filter=${tab}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setItems(d.reminders || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [tab]);

  const [sending, setSending] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function complete(id: string) {
    await fetch(`/api/doctor/reminders?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: true }),
    });
    setItems(prev => prev.filter(r => r.id !== id));
  }

  async function sendReviewRequest(r: Reminder) {
    if (!r.leadEmail) return;
    setSending(r.id);
    setToast(null);
    try {
      const res = await fetch(`/api/doctor/reminders?id=${r.id}&action=send-review`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Send failed');
      setItems(prev => prev.filter(x => x.id !== r.id));
      setToast({ type: 'ok', text: `Review request sent to ${j.sentTo}` });
    } catch (e: any) {
      setToast({ type: 'err', text: e.message || 'Send failed' });
    } finally {
      setSending(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

  const due = items.filter(r => new Date(r.reminderAt).getTime() <= Date.now());
  const reviewCount = items.filter(isReviewRequest).length;

  return (
    <section className="bg-white rounded-xl border border-[var(--line)] shadow-sm p-5 mb-6 relative">
      {toast && (
        <div
          className={`absolute top-3 right-3 px-3 py-2 rounded-md text-xs font-semibold shadow-md ${
            toast.type === 'ok' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">Reminders</p>
          <h2 className="text-lg font-semibold text-[var(--ink)] mt-0.5">
            {tab === 'due' ? `${due.length} due now` : `${items.length} upcoming`}
            {reviewCount > 0 && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                {reviewCount} review request{reviewCount === 1 ? '' : 's'}
              </span>
            )}
          </h2>
        </div>
        <div className="flex gap-1.5 bg-[var(--paper2)] rounded-lg p-1">
          {(['due', 'upcoming'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors capitalize ${
                tab === t ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-[var(--muted)] py-4">Loading…</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-4 text-center">
          {tab === 'due' ? 'Nothing due. Nice work staying on top of follow-ups.' : 'No upcoming reminders.'}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {items.map(r => {
            const isReview = isReviewRequest(r);
            const isPast = new Date(r.reminderAt).getTime() <= Date.now();
            return (
              <li key={r.id} className="py-3 flex items-start gap-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                    isReview ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isReview ? 'Review' : 'Reminder'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--ink)] truncate">
                    {r.leadName || r.leadEmail || 'Patient lead'}
                  </div>
                  {r.message && <p className="text-xs text-[var(--muted)] truncate">{r.message}</p>}
                  <p className={`text-[11px] mt-0.5 ${isPast ? 'text-rose-600 font-semibold' : 'text-[var(--muted)]'}`}>
                    {isPast ? `Due · ${ago(r.reminderAt)} ago` : `In ${ago(r.reminderAt)}`}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {isReview && r.leadEmail && (
                    <button
                      onClick={() => sendReviewRequest(r)}
                      disabled={sending === r.id}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {sending === r.id ? 'Sending…' : 'Send via Resend'}
                    </button>
                  )}
                  <button
                    onClick={() => complete(r.id)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--paper2)]"
                  >
                    Mark done
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
