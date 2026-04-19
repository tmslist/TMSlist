import { useState, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  body: string;
  isStaffReply: boolean;
  isInternal: boolean;
  createdAt: string;
}

interface Ticket {
  id: string;
  userId: string | null;
  subject: string;
  body: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt: string | null;
  submitterEmail: string | null;
  submitterName: string | null;
  category: string | null;
  slaDeadline: string | null;
}

interface StaffMember {
  id: string;
  email: string;
  name: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatFullTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const PRIORITY_SORT = { urgent: 0, high: 1, medium: 2, low: 3 };

function getSlaClass(deadline: string | null): string {
  if (!deadline) return '';
  const msLeft = new Date(deadline).getTime() - Date.now();
  if (msLeft < 0) return 'text-red-600 font-bold';
  if (msLeft < 3600000) return 'text-amber-600 font-semibold';
  return 'text-gray-600';
}

// ── Toast ──────────────────────────────────────────────────────────────────────

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

function ToastBar({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in ${
          t.type === 'success' ? 'bg-emerald-600 text-white' :
          t.type === 'error' ? 'bg-red-600 text-white' :
          'bg-indigo-600 text-white'
        }`}>
          {t.type === 'success' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          {t.type === 'error' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Ticket Detail Panel ─────────────────────────────────────────────────────────

function TicketDetailPanel({
  ticket, onClose, onUpdate, staffList,
}: {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Ticket>) => void;
  staffList: StaffMember[];
}) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [newPriority, setNewPriority] = useState(ticket.priority);
  const [newAssignee, setNewAssignee] = useState(ticket.assignedTo || '');
  const [internalNote, setInternalNote] = useState('');

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ticket-queue?ticketId=${ticket.id}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages || []);
      }
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  }, [ticket.id]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/ticket-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, body: replyText.trim(), isStaffReply: true, isInternal }),
      });
      if (res.ok) { setReplyText(''); setIsInternal(false); fetchMessages(); }
    } finally { setSending(false); }
  };

  const handleStatusChange = (s: string) => {
    setNewStatus(s as Ticket['status']);
    onUpdate(ticket.id, { status: s as Ticket['status'] });
  };

  const handlePriorityChange = (p: string) => {
    setNewPriority(p as Ticket['priority']);
    onUpdate(ticket.id, { priority: p as Ticket['priority'] });
  };

  const handleAssign = (email: string) => {
    setNewAssignee(email);
    onUpdate(ticket.id, { assignedTo: email || null });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-base font-semibold text-gray-900 truncate">{ticket.subject}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              #{ticket.id.slice(0, 8)} &middot; {ticket.submitterEmail || 'Unknown'}
              {ticket.slaDeadline && (
                <span className={`ml-2 ${getSlaClass(ticket.slaDeadline)}`}>
                  SLA: {formatRelativeTime(ticket.slaDeadline)}
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-3 px-6 py-3 border-b border-gray-100 bg-white shrink-0">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select value={newStatus} onChange={e => handleStatusChange(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
            <select value={newPriority} onChange={e => handlePriorityChange(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Assign To</label>
            <select value={newAssignee} onChange={e => handleAssign(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">Unassigned</option>
              {staffList.map(s => <option key={s.id} value={s.email}>{s.name || s.email}</option>)}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No messages yet</div>
          ) : (
            messages.map(msg => {
              const isAgent = msg.isStaffReply;
              return (
                <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${isAgent ? 'order-2' : 'order-1'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.isInternal
                        ? 'bg-amber-50 border border-amber-200 text-amber-900'
                        : isAgent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      {msg.body}
                    </div>
                    <div className={`flex items-center gap-2 mt-1 text-xs ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <span className={`font-medium ${msg.isInternal ? 'text-amber-600' : 'text-gray-600'}`}>
                        {msg.userName || msg.userEmail || 'Unknown'}
                      </span>
                      <span className="text-gray-300">&middot;</span>
                      <span className="text-gray-400" title={formatFullTime(msg.createdAt)}>{formatRelativeTime(msg.createdAt)}</span>
                      {msg.isInternal && <span className="text-amber-600 font-medium ml-1">Internal Note</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply bar */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white shrink-0 space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsInternal(!isInternal)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isInternal ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-600'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Internal Note
            </button>
            {isInternal && <span className="text-xs text-amber-600 font-medium">Note visible to staff only</span>}
          </div>
          <div className="flex gap-2">
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(); }}
              placeholder={isInternal ? 'Add an internal note...' : 'Type your reply... (Cmd+Enter to send)'}
              rows={3}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            <div className="flex flex-col justify-end">
              <button onClick={handleReply} disabled={sending || !replyText.trim()}
                className="px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slide-in-right 0.25s ease-out; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </>
  );
}

// ── New Ticket Modal ────────────────────────────────────────────────────────────

function NewTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !subject || !body) { setError('All fields are required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ticket-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, priority, body, submitterEmail: email }),
      });
      const json = await res.json();
      if (res.ok) { onCreated(); onClose(); }
      else { setError(json.error || 'Failed to create ticket'); }
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Create Support Ticket</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requester Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of the issue"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 bg-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Message *</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Describe the issue in detail..."
                rows={4}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Create Ticket
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-scale-in { animation: scale-in 0.2s ease-out; }`}</style>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminTicketQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'createdAt' | 'updatedAt'>('priority');

  // State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      params.set('limit', '100');
      const [ticketsRes, staffRes] = await Promise.all([
        fetch(`/api/admin/ticket-queue?${params}`),
        fetch('/api/admin/ticket-queue?type=staff'),
      ]);
      if (ticketsRes.ok) {
        const json = await ticketsRes.json();
        setTickets(json.data || []);
      }
      if (staffRes.ok) {
        const json = await staffRes.json();
        setStaffList(json.staff || []);
      }
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTicketUpdate = async (ticketId: string, updates: Partial<Ticket>) => {
    try {
      const res = await fetch('/api/admin/ticket-queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, ...updates }),
      });
      if (res.ok) {
        setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...updates } : t));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(prev => prev ? { ...prev, ...updates } : null);
        }
        showToast('Ticket updated');
      }
    } catch { showToast('Failed to update ticket', 'error'); }
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    if (sortBy === 'priority') return (PRIORITY_SORT[a.priority] ?? 99) - (PRIORITY_SORT[b.priority] ?? 99);
    if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filteredTickets = sortedTickets.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        (t.submitterEmail || '').toLowerCase().includes(q) ||
        (t.submitterName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <ToastBar toasts={toasts} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ticket Queue</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {openCount} open &middot; {inProgressCount} in progress &middot; {tickets.length} total
          </p>
        </div>
        <button onClick={() => setShowNewTicket(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="priority">Sort: Priority</option>
          <option value="createdAt">Sort: Created</option>
          <option value="updatedAt">Sort: Updated</option>
        </select>
        <button onClick={fetchData} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="Refresh">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-gray-500 font-medium">No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requester</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SLA</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} onClick={() => setSelectedTicket(ticket)}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors">
                    <td className="px-5 py-4 text-xs font-mono text-gray-400">#{ticket.id.slice(0, 8)}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                      {ticket.category && <span className="text-xs text-gray-400">{ticket.category}</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-900">{ticket.submitterName || ticket.submitterEmail}</div>
                      <div className="text-xs text-gray-400">{ticket.submitterEmail}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {ticket.assignedTo ? (
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{ticket.assignedTo}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {ticket.slaDeadline ? (
                        <span className={getSlaClass(ticket.slaDeadline)} title={formatFullTime(ticket.slaDeadline)}>
                          {formatRelativeTime(ticket.slaDeadline)}
                        </span>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(ticket.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleTicketUpdate}
          staffList={staffList}
        />
      )}
      {showNewTicket && (
        <NewTicketModal onClose={() => setShowNewTicket(false)} onCreated={() => { fetchData(); showToast('Ticket created'); }} />
      )}
    </div>
  );
}