import { useState, useEffect, useCallback } from 'react';

interface PushNotification {
  id: string;
  title: string;
  body: string;
  segment: string;
  scheduledAt: string | null;
  sentAt: string | null;
  openCount: number;
  clickCount: number;
  status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
  createdBy: string;
}

const SEGMENT_OPTIONS = [
  { key: 'all', label: 'All Users' },
  { key: 'admins', label: 'Admins' },
  { key: 'editors', label: 'Editors' },
  { key: 'clinics', label: 'Clinic Owners' },
  { key: 'patients', label: 'Patients' },
  { key: 'location:new_york', label: 'New York Area' },
  { key: 'location:los_angeles', label: 'Los Angeles Area' },
  { key: 'location:chicago', label: 'Chicago Area' },
  { key: 'location:houston', label: 'Houston Area' },
  { key: 'active_last_30d', label: 'Active (30 days)' },
  { key: 'new_signup', label: 'New Signups' },
];

const MAX_TITLE = 50;
const MAX_BODY = 120;

function TitleCount({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs font-medium text-[var(--ink2)]">Title</span>
      <span className={`text-[11px] ${count > MAX_TITLE ? 'text-red-500' : 'text-[var(--muted)]'}`}>
        {count}/{MAX_TITLE}
      </span>
    </div>
  );
}

function BodyCount({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs font-medium text-[var(--ink2)]">Message</span>
      <span className={`text-[11px] ${count > MAX_BODY ? 'text-red-500' : 'text-[var(--muted)]'}`}>
        {count}/{MAX_BODY}
      </span>
    </div>
  );
}

export default function AdminNotificationCenter() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PushNotification | null>(null);
  const [draft, setDraft] = useState({ title: '', body: '', segment: 'all', scheduleType: 'now', scheduleDate: '', scheduleTime: '' });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/push-notifications');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (res.ok) setNotifications(json.notifications ?? []);
      else setNotifications([]);
    } catch {
      showToast('error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  function startNew() {
    setEditing(null);
    setDraft({ title: '', body: '', segment: 'all', scheduleType: 'now', scheduleDate: '', scheduleTime: '' });
    setShowForm(true);
  }

  function startEdit(n: PushNotification) {
    setEditing(n);
    const schedDate = n.scheduledAt ? new Date(n.scheduledAt) : null;
    setDraft({
      title: n.title,
      body: n.body,
      segment: n.segment,
      scheduleType: n.scheduledAt ? 'scheduled' : 'now',
      scheduleDate: schedDate ? schedDate.toISOString().split('T')[0] : '',
      scheduleTime: schedDate ? `${String(schedDate.getHours()).padStart(2, '0')}:${String(schedDate.getMinutes()).padStart(2, '0')}` : '',
    });
    setShowForm(true);
  }

  async function handleSend() {
    if (!draft.title.trim() || !draft.body.trim()) {
      showToast('error', 'Title and message are required');
      return;
    }
    setSending(true);
    try {
      let scheduledAt: string | null = null;
      if (draft.scheduleType === 'scheduled' && draft.scheduleDate) {
        const d = new Date(`${draft.scheduleDate}T${draft.scheduleTime || '09:00'}`);
        scheduledAt = d.toISOString();
      }
      const payload = {
        title: draft.title,
        body: draft.body,
        segment: draft.segment,
        scheduledAt,
        status: draft.scheduleType === 'scheduled' ? 'scheduled' : 'sent',
      };
      const method = editing?.id ? 'PUT' : 'POST';
      const url = editing?.id ? `/api/admin/push-notifications/${editing.id}` : '/api/admin/push-notifications';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        showToast('success', editing?.id
          ? 'Notification updated'
          : draft.scheduleType === 'scheduled' ? 'Notification scheduled' : 'Notification sent');
        setShowForm(false);
        setEditing(null);
        fetchNotifications();
      } else {
        showToast('error', 'Failed to save notification');
      }
    } catch {
      showToast('error', 'Failed to save notification');
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(id: string) {
    try {
      const res = await fetch(`/api/admin/push-notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        showToast('success', 'Notification cancelled');
        fetchNotifications();
      }
    } catch {
      showToast('error', 'Failed to cancel');
    }
  }

  const stats = {
    total: notifications.length,
    scheduled: notifications.filter((n) => n.status === 'scheduled').length,
    sent: notifications.filter((n) => n.status === 'sent').length,
    totalOpens: notifications.reduce((sum, n) => sum + (n.openCount ?? 0), 0),
    totalClicks: notifications.reduce((sum, n) => sum + (n.clickCount ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Push Notifications</h2>
          <p className="text-sm text-[var(--muted)] mt-0.5">Send and schedule notifications</p>
        </div>
        <button
          onClick={startNew}
          className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + New Notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-[var(--ink)]' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-[var(--ink)]' },
          { label: 'Sent', value: stats.sent, color: 'text-emerald-600' },
          { label: 'Opens', value: stats.totalOpens, color: 'text-[var(--warm)]' },
          { label: 'Clicks', value: stats.totalClicks, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[var(--line)] px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Compose form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[rgba(10,22,40,0.15)] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-[rgba(10,22,40,0.08)] border-b border-[rgba(10,22,40,0.15)]">
            <span className="text-sm font-semibold text-[var(--ink)]">
              {editing?.id ? 'Edit Notification' : 'Compose Notification'}
            </span>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="text-[var(--ink2)] hover:text-[var(--ink)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <TitleCount count={draft.title.length} />
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft((v) => ({ ...v, title: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
                placeholder="Notification title..."
                maxLength={MAX_TITLE + 20}
              />
            </div>
            <div>
              <BodyCount count={draft.body.length} />
              <textarea
                value={draft.body}
                onChange={(e) => setDraft((v) => ({ ...v, body: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)] resize-y"
                placeholder="Notification message..."
                maxLength={MAX_BODY + 40}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Segment</label>
              <select
                value={draft.segment}
                onChange={(e) => setDraft((v) => ({ ...v, segment: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)] focus:ring-1 focus:ring-[rgba(10,22,40,0.15)]"
              >
                {SEGMENT_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Delivery</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={draft.scheduleType === 'now'}
                    onChange={() => setDraft((v) => ({ ...v, scheduleType: 'now' }))}
                    className="w-4 h-4 text-[var(--ink)]"
                  />
                  <span className="text-sm text-[var(--ink2)]">Send Now</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scheduleType"
                    checked={draft.scheduleType === 'scheduled'}
                    onChange={() => setDraft((v) => ({ ...v, scheduleType: 'scheduled' }))}
                    className="w-4 h-4 text-[var(--ink)]"
                  />
                  <span className="text-sm text-[var(--ink2)]">Schedule</span>
                </label>
              </div>
              {draft.scheduleType === 'scheduled' && (
                <div className="flex gap-3 mt-2">
                  <input
                    type="date"
                    value={draft.scheduleDate}
                    onChange={(e) => setDraft((v) => ({ ...v, scheduleDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)]"
                  />
                  <input
                    type="time"
                    value={draft.scheduleTime}
                    onChange={(e) => setDraft((v) => ({ ...v, scheduleTime: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:border-[var(--ink2)]"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 bg-[var(--paper2)] border-t border-[var(--line)]">
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-4 py-2 bg-[var(--paper2)] text-[var(--ink2)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-5 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : draft.scheduleType === 'scheduled' ? 'Schedule' : 'Send Now'}
            </button>
          </div>
        </div>
      )}

      {/* Notifications list */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-5 h-5 border-2 border-[var(--line)] border-t-[#0A1628] rounded-full animate-spin mb-2" />
          <p className="text-[var(--muted)] text-sm">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
          <div className="divide-y divide-[var(--line)]">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-[var(--muted)]">No notifications yet</p>
                <button onClick={startNew} className="mt-4 px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors">
                  + Create Notification
                </button>
              </div>
            ) : notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[var(--paper2)] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      n.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                      n.status === 'scheduled' ? 'bg-[var(--paper2)] text-[var(--ink)]' :
                      n.status === 'cancelled' ? 'bg-[var(--paper2)] text-[var(--muted)]' :
                      'bg-[var(--paper2)] text-[var(--ink2)]'
                    }`}>{n.status}</span>
                    <span className="px-2 py-0.5 bg-[var(--paper2)] text-[var(--ink2)] text-[10px] font-semibold rounded uppercase">
                      {n.segment}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--ink)]">{n.title}</h4>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{n.body}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--muted)]">
                    {n.scheduledAt && <span>Scheduled: {new Date(n.scheduledAt).toLocaleString()}</span>}
                    {n.sentAt && <span>Sent: {new Date(n.sentAt).toLocaleString()}</span>}
                    {n.status === 'sent' && (
                      <>
                        <span>Opens: {n.openCount}</span>
                        <span>Clicks: {n.clickCount}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {n.status === 'scheduled' && (
                    <button
                      onClick={() => handleCancel(n.id)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(n)}
                    className="px-3 py-1.5 bg-[rgba(10,22,40,0.08)] text-[var(--ink)] text-xs font-medium rounded-lg hover:bg-[rgba(10,22,40,0.08)] transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
