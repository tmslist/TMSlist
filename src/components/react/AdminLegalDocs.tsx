import { useState, useEffect, useCallback } from 'react';

interface LegalDoc {
  id: string;
  type: string;
  version: string;
  content: string;
  isActive: boolean;
  publishedAt?: string;
  createdAt: string;
  createdBy?: string;
}

interface GroupedDocs {
  [type: string]: LegalDoc[];
}

const DOC_TYPES = [
  { value: 'privacy_policy', label: 'Privacy Policy' },
  { value: 'terms_of_service', label: 'Terms of Service' },
  { value: 'medical_disclaimer', label: 'Medical Disclaimer' },
  { value: 'cookie_policy', label: 'Cookie Policy' },
  { value: 'hipaa_notice', label: 'HIPAA Notice' },
  { value: 'accessibility_statement', label: 'Accessibility Statement' },
];

const DOC_TYPE_LABELS: Record<string, string> = Object.fromEntries(DOC_TYPES.map(t => [t.value, t.label]));

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function Modal({ open, onClose, title, children, size = 'max-w-2xl' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-[var(--ink2)] rounded-2xl shadow-2xl w-full ${size} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] dark:border-[var(--ink2)]">
          <h3 className="text-lg font-semibold text-[var(--ink)] dark:text-[var(--line)]">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)] text-[var(--muted)] dark:text-[var(--muted)] hover:text-[var(--ink2)] dark:hover:text-[var(--line)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
      type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {message}
    </div>
  );
}

export default function AdminLegalDocs() {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [grouped, setGrouped] = useState<GroupedDocs>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedType, setSelectedType] = useState('privacy_policy');
  const [showCreate, setShowCreate] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDoc | null>(null);
  const [viewingDoc, setViewingDoc] = useState<LegalDoc | null>(null);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [newVersion, setNewVersion] = useState('1.0');
  const [newContent, setNewContent] = useState('');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/legal-docs');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setDocs(json.data.docs);
      setGrouped(json.data.grouped);
    } catch {
      showToast('error', 'Failed to load legal documents');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleCreate = async () => {
    if (!newContent.trim()) {
      showToast('error', 'Content is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/legal-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, version: newVersion, content: newContent }),
      });
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to create');
      showToast('success', 'Legal document created');
      setShowCreate(false);
      setNewContent('');
      setNewVersion('1.0');
      fetchDocs();
    } catch {
      showToast('error', 'Failed to create document');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (doc: LegalDoc) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/legal-docs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, publish: true }),
      });
      if (!res.ok) throw new Error('Failed to publish');
      showToast('success', 'Document published successfully');
      fetchDocs();
    } catch {
      showToast('error', 'Failed to publish document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document version?')) return;
    try {
      const res = await fetch(`/api/admin/legal-docs?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      showToast('success', 'Document deleted');
      fetchDocs();
    } catch {
      showToast('error', 'Failed to delete document');
    }
  };

  const handleUpdate = async () => {
    if (!editingDoc) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/legal-docs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingDoc.id, content: editingDoc.content }),
      });
      if (!res.ok) throw new Error('Failed to update');
      showToast('success', 'Document updated');
      setEditingDoc(null);
      fetchDocs();
    } catch {
      showToast('error', 'Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  const currentDocs = grouped[selectedType] || [];
  const activeDoc = currentDocs.find(d => d.isActive);

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--ink)] dark:text-[var(--line)]">Legal Documents</h1>
          <p className="text-[var(--muted)] dark:text-[var(--muted)] mt-1 text-sm">Manage privacy policies, terms of service, and disclaimers</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Document
        </button>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {DOC_TYPES.map(type => (
          <button
            key={type.value}
            onClick={() => setSelectedType(type.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedType === type.value
                ? 'bg-[var(--ink)] text-white'
                : 'bg-white dark:bg-[var(--ink2)] text-[var(--ink2)] dark:text-[var(--line)] border border-[var(--line)] dark:border-[var(--ink2)] hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)]'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white dark:bg-[var(--ink2)] rounded-xl border border-[var(--line)] dark:border-[var(--ink2)] p-16 text-center">
          <div className="inline-block w-6 h-6 border-2 border-[var(--line)] border-t-[#0A1628] rounded-full animate-spin mb-3" />
          <p className="text-[var(--muted)] dark:text-[var(--muted)] text-sm">Loading...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Version History */}
          <div className="lg:col-span-2 bg-white dark:bg-[var(--ink2)] rounded-xl border border-[var(--line)] dark:border-[var(--ink2)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--line)] dark:border-[var(--ink2)]">
              <h3 className="text-base font-semibold text-[var(--ink)] dark:text-[var(--line)]">
                {DOC_TYPE_LABELS[selectedType]} — Version History
              </h3>
            </div>
            {currentDocs.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-10 h-10 mx-auto text-[var(--line)] dark:text-[var(--ink2)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-[var(--muted)] dark:text-[var(--muted)] font-medium">No documents yet</p>
                <p className="text-[var(--muted)] dark:text-[var(--muted)] text-sm mt-1">Create your first version above</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--line)] dark:divide-[var(--line)]">
                {currentDocs.map(doc => (
                  <div key={doc.id} className="p-5 hover:bg-[var(--paper2)] dark:hover:bg-[var(--ink2)] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-[var(--ink)] dark:text-[var(--line)]">v{doc.version}</span>
                          {doc.isActive ? (
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
                              Live
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--muted)] dark:text-[var(--muted)] text-[10px] font-medium rounded-full">
                              Draft
                            </span>
                          )}
                          {doc.publishedAt && (
                            <span className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">
                              Published {formatDate(doc.publishedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)] font-mono">
                          Created {formatDateTime(doc.createdAt)}
                        </p>
                        <p className="text-sm text-[var(--ink2)] dark:text-[var(--line)] mt-2 line-clamp-2">{doc.content.slice(0, 200)}...</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="px-3 py-1.5 bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--ink2)] dark:text-[var(--line)] text-xs font-medium rounded-lg hover:bg-[var(--paper2)] dark:hover:bg-[var(--muted)] transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setEditingDoc({ ...doc })}
                          className="px-3 py-1.5 bg-[rgba(10,22,40,0.08)] dark:bg-[#0A1628]/30 text-[var(--ink)] dark:text-[var(--ink2)] text-xs font-medium rounded-lg hover:bg-[rgba(10,22,40,0.08)] dark:hover:bg-[#0A1628]/50 transition-colors"
                        >
                          Edit
                        </button>
                        {!doc.isActive && (
                          <>
                            <button
                              onClick={() => handlePublish(doc)}
                              disabled={saving}
                              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                            >
                              Publish
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active document preview */}
          <div className="bg-white dark:bg-[var(--ink2)] rounded-xl border border-[var(--line)] dark:border-[var(--ink2)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--line)] dark:border-[var(--ink2)]">
              <h3 className="text-base font-semibold text-[var(--ink)] dark:text-[var(--line)]">Currently Live</h3>
            </div>
            {activeDoc ? (
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase">
                    Published
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink)] dark:text-[var(--line)]">v{activeDoc.version}</span>
                </div>
                <p className="text-xs text-[var(--muted)] dark:text-[var(--muted)] mb-4">
                  Published {activeDoc.publishedAt ? formatDateTime(activeDoc.publishedAt) : 'N/A'}
                </p>
                <div className="bg-[var(--paper2)] dark:bg-[var(--ink)] rounded-lg p-4 text-sm text-[var(--ink2)] dark:text-[var(--line)] font-mono leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap">
                  {activeDoc.content}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setEditingDoc({ ...activeDoc })}
                    className="flex-1 px-3 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Edit Live Version
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-[var(--muted)] dark:text-[var(--muted)] text-sm">No active version</p>
                <p className="text-[var(--muted)] dark:text-[var(--muted)] text-xs mt-1">Publish a version to make it live</p>
              </div>
            )}

            {/* Stats */}
            <div className="border-t border-[var(--line)] dark:border-[var(--ink2)] p-5">
              <h4 className="text-xs font-semibold text-[var(--muted)] dark:text-[var(--muted)] uppercase tracking-wide mb-3">Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ink2)] dark:text-[var(--muted)]">Total Versions</span>
                  <span className="font-semibold text-[var(--ink)] dark:text-[var(--line)]">{currentDocs.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ink2)] dark:text-[var(--muted)]">Published</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{currentDocs.filter(d => d.isActive).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--ink2)] dark:text-[var(--muted)]">Drafts</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{currentDocs.filter(d => !d.isActive).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={`New ${DOC_TYPE_LABELS[selectedType]} Document`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-1">Document Type</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)] focus:ring-2 focus:ring-[#1E2A3B]"
            >
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-1">Version</label>
            <input
              type="text"
              value={newVersion}
              onChange={e => setNewVersion(e.target.value)}
              placeholder="e.g. 1.0, 1.1, 2.0"
              className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)] focus:ring-2 focus:ring-[#1E2A3B]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-1">Content</label>
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              rows={12}
              placeholder="Enter the full legal document content..."
              className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)] font-mono focus:ring-2 focus:ring-[#1E2A3B]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--ink2)] dark:text-[var(--line)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)] dark:hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !newContent.trim()}
              className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingDoc} onClose={() => setEditingDoc(null)} title="Edit Document">
        {editingDoc && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--ink2)] dark:text-[var(--line)] text-xs font-medium rounded">
                {DOC_TYPE_LABELS[editingDoc.type] || editingDoc.type}
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] dark:text-[var(--line)]">v{editingDoc.version}</span>
              {editingDoc.isActive && (
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase">Live</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink2)] dark:text-[var(--line)] mb-1">Content</label>
              <textarea
                value={editingDoc.content}
                onChange={e => setEditingDoc({ ...editingDoc, content: e.target.value })}
                rows={12}
                className="w-full rounded-lg border border-[var(--line)] dark:border-[var(--ink2)] px-3 py-2 text-sm bg-white dark:bg-[var(--ink2)] text-[var(--ink)] dark:text-[var(--line)] font-mono focus:ring-2 focus:ring-[#1E2A3B]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingDoc(null)}
                className="px-4 py-2 bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--ink2)] dark:text-[var(--line)] text-sm font-medium rounded-lg hover:bg-[var(--paper2)] dark:hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewingDoc} onClose={() => setViewingDoc(null)} title="Document Preview" size="max-w-4xl">
        {viewingDoc && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--ink2)] dark:text-[var(--line)] text-xs font-medium rounded">
                {DOC_TYPE_LABELS[viewingDoc.type] || viewingDoc.type}
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] dark:text-[var(--line)]">v{viewingDoc.version}</span>
              {viewingDoc.isActive ? (
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase">Live</span>
              ) : (
                <span className="px-2 py-0.5 bg-[var(--paper2)] dark:bg-[var(--ink2)] text-[var(--muted)] dark:text-[var(--muted)] text-[10px] font-medium rounded-full">Draft</span>
              )}
              {viewingDoc.publishedAt && (
                <span className="text-xs text-[var(--muted)] dark:text-[var(--muted)]">Published {formatDateTime(viewingDoc.publishedAt)}</span>
              )}
            </div>
            <div className="bg-[var(--paper2)] dark:bg-[var(--ink)] rounded-lg p-6 text-sm text-[var(--ink2)] dark:text-[var(--line)] font-mono leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-wrap border border-[var(--line)] dark:border-[var(--ink2)]">
              {viewingDoc.content}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => { setViewingDoc(null); setEditingDoc({ ...viewingDoc }); }}
                className="px-4 py-2 bg-[var(--ink)] hover:bg-[var(--ink)] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Edit This Version
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
