import { useState, useEffect, useCallback, useRef } from 'react';

interface Message {
  id: string;
  doctorId: string;
  senderId: string | null;
  userId: string | null;
  patientEmail: string | null;
  subject: string | null;
  body: string;
  direction: string;
  isRead: boolean;
  status: string;
  createdAt: string;
}

interface Conversation {
  patientEmail: string;
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
}

interface DoctorMessagesProps {
  doctorId?: string;
  clinicId?: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const DIRECTION_LABELS: Record<string, string> = {
  inbound: 'Received',
  outbound: 'Sent',
};

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-gray-100 text-gray-600',
  delivered: 'bg-blue-100 text-blue-700',
  read: 'bg-emerald-100 text-emerald-700',
};

export default function DoctorMessages({ doctorId, clinicId }: DoctorMessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [showCompose, setShowCompose] = useState(false);
  const [composeEmail, setComposeEmail] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingError, setSendingError] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!doctorId) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await fetch('/api/doctor/messages');
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load messages'); setLoading(false); return; }

      const msgs: Message[] = data.messages || [];

      // Group by patientEmail (for inbound) or conversation thread
      const convMap = new Map<string, Message[]>();
      msgs.forEach(msg => {
        const key = msg.patientEmail || msg.senderId || 'unknown';
        if (!convMap.has(key)) convMap.set(key, []);
        convMap.get(key)!.push(msg);
      });

      const convs: Conversation[] = [];
      convMap.forEach((msgsArr) => {
        const sorted = msgsArr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const lastMsg = sorted[sorted.length - 1];
        const unread = msgsArr.filter(m => !m.isRead && m.direction === 'inbound').length;
        convs.push({
          patientEmail: msgsArr[0].patientEmail || lastMsg.senderId || 'Unknown',
          messages: sorted,
          lastMessage: lastMsg,
          unreadCount: unread,
        });
      });

      // Sort by last message date descending
      convs.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
      setConversations(convs);

      // Auto-select first conversation if none selected
      if (!selectedEmail && convs.length > 0) {
        setSelectedEmail(convs[0].patientEmail);
        setMessages(convs[0].messages);
      } else if (selectedEmail) {
        const found = convs.find(c => c.patientEmail === selectedEmail);
        setMessages(found?.messages || []);
      }
    } catch {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [doctorId, selectedEmail]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (email: string) => {
    setSelectedEmail(email);
    const conv = conversations.find(c => c.patientEmail === email);
    if (conv) {
      setMessages(conv.messages);
      // Mark unread as read
      conv.messages.filter(m => !m.isRead && m.direction === 'inbound').forEach(m => markRead(m.id));
    }
  };

  const markRead = async (id: string) => {
    if (markingId === id) return;
    try {
      setMarkingId(id);
      await fetch('/api/doctor/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
      setConversations(prev => prev.map(c => {
        if (c.patientEmail === selectedEmail) {
          return { ...c, unreadCount: c.messages.filter(m => !m.isRead && m.direction === 'inbound').length - 1 };
        }
        return c;
      }));
    } catch {
      // silent
    } finally {
      setMarkingId(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeEmail.trim() || !composeBody.trim()) return;
    try {
      setSending(true);
      setSendingError('');
      const res = await fetch('/api/doctor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEmail: composeEmail, subject: composeSubject, body: composeBody }),
      });
      const data = await res.json();
      if (!res.ok) { setSendingError(data.error || 'Failed to send'); return; }
      setComposeEmail('');
      setComposeSubject('');
      setComposeBody('');
      setShowCompose(false);
      await fetchMessages();
    } catch {
      setSendingError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c =>
    filterType === 'unread' ? c.unreadCount > 0 : true
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Unread ({totalUnread})
          </button>
        </div>
        <button
          onClick={() => { setShowCompose(true); setSelectedEmail(null); setMessages([]); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Message
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversation list */}
          <div className="w-72 border-r border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                  <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm text-gray-400">No conversations</p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <button
                    key={conv.patientEmail}
                    onClick={() => handleSelectConversation(conv.patientEmail)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      selectedEmail === conv.patientEmail ? 'bg-blue-50' : ''
                    } ${conv.unreadCount > 0 && selectedEmail !== conv.patientEmail ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {conv.patientEmail}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 min-w-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage.subject || conv.lastMessage.body}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 flex flex-col">
            {showCompose ? (
              /* Compose form */
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">New Message</h3>
                </div>
                <form onSubmit={handleSend} className="flex-1 flex flex-col p-4 gap-4">
                  {sendingError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{sendingError}</div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Patient Email *</label>
                    <input
                      type="email"
                      value={composeEmail}
                      onChange={e => setComposeEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="patient@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                    <input
                      type="text"
                      value={composeSubject}
                      onChange={e => setComposeSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Optional subject"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
                    <textarea
                      value={composeBody}
                      onChange={e => setComposeBody(e.target.value)}
                      required
                      rows={6}
                      className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Type your message..."
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowCompose(false); setComposeEmail(''); setComposeSubject(''); setComposeBody(''); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !composeEmail.trim() || !composeBody.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedEmail ? (
              <>
                {/* Thread header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{selectedEmail}</h3>
                    <p className="text-xs text-gray-500">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] ${msg.direction === 'outbound' ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            msg.direction === 'outbound'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          {msg.subject && (
                            <p className={`font-semibold mb-1 text-xs ${msg.direction === 'outbound' ? 'text-blue-100' : 'text-gray-700'}`}>
                              {msg.subject}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                        <div className={`flex items-center gap-2 mt-1 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] ${msg.direction === 'outbound' ? 'text-gray-400' : 'text-gray-400'}`}>
                            {formatFullDate(msg.createdAt)}
                          </span>
                          {msg.direction === 'outbound' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[msg.status] || STATUS_COLORS.sent}`}>
                              {msg.status}
                            </span>
                          )}
                          {msg.direction === 'inbound' && !msg.isRead && (
                            <button
                              onClick={() => markRead(msg.id)}
                              disabled={markingId === msg.id}
                              className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {markingId === msg.id ? 'Marking...' : 'Mark read'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply */}
                <div className="p-3 border-t border-gray-100 bg-white">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const bodyInput = form.elements.namedItem('replyBody') as HTMLInputElement;
                      if (!bodyInput?.value.trim()) return;
                      setComposeEmail(selectedEmail);
                      setComposeBody(bodyInput.value);
                      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                      await handleSend(fakeEvent);
                      bodyInput.value = '';
                    }}
                    className="flex gap-2"
                  >
                    <input
                      name="replyBody"
                      type="text"
                      placeholder="Type a reply..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a conversation</h3>
                <p className="text-sm text-gray-500">Choose a conversation from the list or start a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
