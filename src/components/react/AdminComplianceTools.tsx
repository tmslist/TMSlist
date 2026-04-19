import { useState, useEffect, useCallback } from 'react';

interface LegalDoc {
  id: string;
  type: 'privacy_policy' | 'terms_of_service' | 'medical_disclaimer';
  version: number;
  content: string;
  isActive: boolean;
  createdAt: string;
}

interface CookieConfig {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  bannerText: string;
}

interface RetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  description: string;
  active: boolean;
}

interface GDPRRequest {
  id: string;
  email: string;
  type: 'export' | 'delete' | 'restrict';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  notes: string;
  createdAt: string;
  history: { status: string; timestamp: string; note?: string }[];
}

type TabKey = 'legal_docs' | 'cookie_consent' | 'retention' | 'gdpr_requests';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'legal_docs', label: 'Legal Docs' },
  { key: 'cookie_consent', label: 'Cookie Consent' },
  { key: 'retention', label: 'Retention' },
  { key: 'gdpr_requests', label: 'GDPR Requests' },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
  medical_disclaimer: 'Medical Disclaimer',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
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

export default function AdminComplianceTools() {
  const [tab, setTab] = useState<TabKey>('legal_docs');
  const [legalDocs, setLegalDocs] = useState<LegalDoc[]>([]);
  const [cookieConfig, setCookieConfig] = useState<CookieConfig>({ necessary: true, analytics: false, marketing: false, bannerText: 'We use cookies to enhance your experience.' });
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [gdprRequests, setGdprRequests] = useState<GDPRRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [showGdprModal, setShowGdprModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDoc | null>(null);
  const [editingRetention, setEditingRetention] = useState<RetentionPolicy | null>(null);
  const [selectedGdpr, setSelectedGdpr] = useState<GDPRRequest | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [docType, setDocType] = useState<LegalDoc['type']>('privacy_policy');
  const [docContent, setDocContent] = useState('');
  const [docIsActive, setDocIsActive] = useState(true);

  const [retentionEntityType, setRetentionEntityType] = useState('');
  const [retentionDays, setRetentionDays] = useState('');
  const [retentionDesc, setRetentionDesc] = useState('');
  const [retentionActive, setRetentionActive] = useState(true);

  const [gdprEmail, setGdprEmail] = useState('');
  const [gdprType, setGdprType] = useState<'export' | 'delete' | 'restrict'>('export');
  const [gdprNotes, setGdprNotes] = useState('');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/compliance');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setLegalDocs(json.legalDocs || []);
      setCookieConfig(json.cookieConfig || { necessary: true, analytics: false, marketing: false, bannerText: '' });
      setRetentionPolicies(json.retentionPolicies || []);
      setGdprRequests(json.gdprRequests || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openDocModal(doc?: LegalDoc) {
    if (doc) {
      setEditingDoc(doc);
      setDocType(doc.type);
      setDocContent(doc.content);
      setDocIsActive(doc.isActive);
    } else {
      setEditingDoc(null);
      setDocType('privacy_policy');
      setDocContent('');
      setDocIsActive(true);
    }
    setShowDocModal(true);
  }

  async function saveDoc() {
    if (!docContent) { showToast('error', 'Content is required'); return; }

    setSaving(true);
    try {
      const body = { type: docType, content: docContent, isActive: docIsActive };
      const url = editingDoc ? `/api/admin/compliance/legal-doc?id=${editingDoc.id}` : '/api/admin/compliance/legal-doc';
      const method = editingDoc ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save document');

      showToast('success', 'Document saved');
      setShowDocModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function publishDoc(doc: LegalDoc) {
    try {
      const res = await fetch(`/api/admin/compliance/legal-doc/publish?id=${doc.id}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to publish');
      showToast('success', 'Document published');
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to publish');
    }
  }

  function openRetentionModal(policy?: RetentionPolicy) {
    if (policy) {
      setEditingRetention(policy);
      setRetentionEntityType(policy.entityType);
      setRetentionDays(String(policy.retentionDays));
      setRetentionDesc(policy.description);
      setRetentionActive(policy.active);
    } else {
      setEditingRetention(null);
      setRetentionEntityType('');
      setRetentionDays('');
      setRetentionDesc('');
      setRetentionActive(true);
    }
    setShowRetentionModal(true);
  }

  async function saveRetention() {
    if (!retentionEntityType || !retentionDays) { showToast('error', 'Entity type and retention days are required'); return; }

    setSaving(true);
    try {
      const body = { entityType: retentionEntityType, retentionDays: Number(retentionDays), description: retentionDesc, active: retentionActive };
      const url = editingRetention ? `/api/admin/compliance/retention?id=${editingRetention.id}` : '/api/admin/compliance/retention';
      const method = editingRetention ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save policy');

      showToast('success', 'Policy saved');
      setShowRetentionModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function deleteRetention(policy: RetentionPolicy) {
    if (!confirm(`Delete retention policy for "${policy.entityType}"?`)) return;
    try {
      const res = await fetch(`/api/admin/compliance/retention?id=${policy.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setRetentionPolicies(retentionPolicies.filter(p => p.id !== policy.id));
      showToast('success', 'Policy deleted');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  async function submitGdprRequest() {
    if (!gdprEmail) { showToast('error', 'Email is required'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/compliance/gdpr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gdprEmail, type: gdprType, notes: gdprNotes }),
      });
      if (!res.ok) throw new Error('Failed to submit request');
      showToast('success', 'GDPR request submitted');
      setShowGdprModal(false);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSaving(false);
    }
  }

  async function updateGdprStatus(id: string, status: GDPRRequest['status'], notes?: string) {
    try {
      const res = await fetch(`/api/admin/compliance/gdpr?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error('Failed to update');
      showToast('success', `Status updated to ${status}`);
      fetchData();
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function saveCookieConfig() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/compliance/cookie-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cookieConfig),
      });
      if (!res.ok) throw new Error('Failed to save');
      showToast('success', 'Cookie configuration saved');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      ) : null}

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-xs font-medium ml-3">Dismiss</button>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Compliance Tools</h2>
          <p className="text-sm text-gray-500 mt-0.5">Legal docs, GDPR, and retention policies</p>
        </div>
        <button onClick={fetchData} className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : tab === 'legal_docs' ? (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => openDocModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Version
                </button>
              </div>

              {legalDocs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No legal documents.</div>
              ) : (
                <div className="space-y-4">
                  {legalDocs.map(doc => (
                    <div key={doc.id} className={`border rounded-xl p-5 ${doc.isActive ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">{DOC_TYPE_LABELS[doc.type]}</h4>
                            {doc.isActive ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">Active</span> : null}
                          </div>
                          <p className="text-xs text-gray-500">Version {doc.version} - {formatDate(doc.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openDocModal(doc)} className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
                          {!doc.isActive ? (
                            <button onClick={() => publishDoc(doc)} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Publish</button>
                          ) : null}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-sm text-gray-600 max-h-32 overflow-y-auto">
                        {doc.content.slice(0, 300)}{doc.content.length > 300 ? '...' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === 'cookie_consent' ? (
            <div className="max-w-2xl space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Necessary Cookies</p>
                    <p className="text-xs text-gray-500">Required for the site to function</p>
                  </div>
                  <div className="w-12 h-6 rounded-full bg-indigo-600 relative">
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform translate-x-6" />
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Analytics Cookies</p>
                    <p className="text-xs text-gray-500">Help us improve the site</p>
                  </div>
                  <button onClick={() => setCookieConfig({ ...cookieConfig, analytics: !cookieConfig.analytics })} className={`w-12 h-6 rounded-full transition-colors ${cookieConfig.analytics ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${cookieConfig.analytics ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Marketing Cookies</p>
                    <p className="text-xs text-gray-500">Used for advertising</p>
                  </div>
                  <button onClick={() => setCookieConfig({ ...cookieConfig, marketing: !cookieConfig.marketing })} className={`w-12 h-6 rounded-full transition-colors ${cookieConfig.marketing ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${cookieConfig.marketing ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Text</label>
                <textarea value={cookieConfig.bannerText} onChange={e => setCookieConfig({ ...cookieConfig, bannerText: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
              </div>

              <div className="flex justify-end">
                <button onClick={saveCookieConfig} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          ) : tab === 'retention' ? (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => openRetentionModal()} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Policy
                </button>
              </div>

              {retentionPolicies.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No retention policies configured.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Entity Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Retention Days</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {retentionPolicies.map(policy => (
                        <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{policy.entityType}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{policy.retentionDays} days</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{policy.description}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${policy.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                              {policy.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openRetentionModal(policy)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => deleteRetention(policy)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : tab === 'gdpr_requests' ? (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => { setGdprEmail(''); setGdprType('export'); setGdprNotes(''); setShowGdprModal(true); }} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Submit Request
                </button>
              </div>

              {gdprRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No GDPR requests.</div>
              ) : (
                <div className="space-y-4">
                  {gdprRequests.map(req => (
                    <div key={req.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">{req.type}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : req.status === 'processing' ? 'bg-blue-100 text-blue-700' : req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900">{req.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(req.createdAt)}</span>
                      </div>

                      {req.notes ? <p className="text-sm text-gray-600 mb-3">Notes: {req.notes}</p> : null}

                      {req.history && req.history.length > 0 ? (
                        <div className="border-t border-gray-100 pt-3 mt-3">
                          <p className="text-xs font-medium text-gray-500 uppercase mb-2">History</p>
                          <div className="space-y-1">
                            {req.history.map((h, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                <span>{h.status}</span>
                                {h.note ? <span className="text-gray-400">- {h.note}</span> : null}
                                <span className="text-gray-400 ml-auto">{formatDate(h.timestamp)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {req.status === 'pending' ? (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                          <button onClick={() => updateGdprStatus(req.id, 'processing')} className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Start Processing</button>
                          <button onClick={() => updateGdprStatus(req.id, 'completed')} className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">Mark Complete</button>
                          <button onClick={() => updateGdprStatus(req.id, 'rejected')} className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Reject</button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            null
          )}
        </div>
      </div>

      {/* Legal Doc Modal */}
      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title={editingDoc ? `Edit ${DOC_TYPE_LABELS[docType]}` : `New ${DOC_TYPE_LABELS[docType]}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value as LegalDoc['type'])} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="privacy_policy">Privacy Policy</option>
              <option value="terms_of_service">Terms of Service</option>
              <option value="medical_disclaimer">Medical Disclaimer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea value={docContent} onChange={e => setDocContent(e.target.value)} rows={12} placeholder="Enter document content..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono resize-none" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={docIsActive} onChange={e => setDocIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Set as active version
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowDocModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={saveDoc} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      {/* Retention Policy Modal */}
      <Modal open={showRetentionModal} onClose={() => setShowRetentionModal(false)} title={editingRetention ? 'Edit Policy' : 'Add Policy'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type *</label>
            <input type="text" value={retentionEntityType} onChange={e => setRetentionEntityType(e.target.value)} placeholder="leads, users, reviews" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retention Days *</label>
            <input type="number" value={retentionDays} onChange={e => setRetentionDays(e.target.value)} placeholder="365" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={retentionDesc} onChange={e => setRetentionDesc(e.target.value)} rows={2} placeholder="GDPR compliant data retention..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={retentionActive} onChange={e => setRetentionActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowRetentionModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={saveRetention} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      {/* GDPR Request Modal */}
      <Modal open={showGdprModal} onClose={() => setShowGdprModal(false)} title="Submit GDPR Request">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Email *</label>
            <input type="email" value={gdprEmail} onChange={e => setGdprEmail(e.target.value)} placeholder="user@example.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
            <select value={gdprType} onChange={e => setGdprType(e.target.value as typeof gdprType)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option value="export">Data Export</option>
              <option value="delete">Data Deletion</option>
              <option value="restrict">Processing Restriction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={gdprNotes} onChange={e => setGdprNotes(e.target.value)} rows={3} placeholder="Additional notes..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowGdprModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={submitGdprRequest} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Submitting...' : 'Submit'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
