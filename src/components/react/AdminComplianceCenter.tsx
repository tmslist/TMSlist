import { useState, useCallback, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RetentionPolicy {
  id: string;
  entityType: string;
  retentionDays: number;
  description: string;
  active: boolean;
  createdAt: string;
}

interface LegalDocument {
  id: string;
  type: string;
  version: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}

interface AuditEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface HipaaCheckItem {
  id: string;
  category: string;
  requirement: string;
  description: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  lastChecked: string;
  notes?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  privacy_policy: 'Privacy Policy',
  terms_of_service: 'Terms of Service',
  medical_disclaimer: 'Medical Disclaimer',
  hipaa_notice: 'HIPAA Notice of Privacy Practices',
  cookie_policy: 'Cookie Policy',
};

// ── Toast ─────────────────────────────────────────────────────────────────────

interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

function ToastBar({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${
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

// ── Modal ──────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type TabKey = 'hipaa' | 'audit' | 'retention' | 'legal';

const TABS = [
  { key: 'hipaa', label: 'HIPAA Checklist', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
  { key: 'audit', label: 'Audit Trail', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
  { key: 'retention', label: 'Data Retention', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { key: 'legal', label: 'Legal Documents', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
];

export default function AdminComplianceCenter() {
  const [tab, setTab] = useState<TabKey>('hipaa');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [hipaaItems, setHipaaItems] = useState<HipaaCheckItem[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [legalDocs, setLegalDocs] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [auditPage, setAuditPage] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Modals
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [editingRetention, setEditingRetention] = useState<RetentionPolicy | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = String(Date.now());
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/compliance-center');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      if (res.ok) {
        const json = await res.json();
        setHipaaItems(json.hipaaItems || []);
        setAuditEntries(json.auditEntries || []);
        setRetentionPolicies(json.retentionPolicies || []);
        setLegalDocs(json.legalDocs || []);
      }
    } catch { /* fail silently */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Retention ─────────────────────────────────────────────────────────────────

  function openRetentionModal(policy?: RetentionPolicy) {
    if (policy) { setEditingRetention(policy); }
    else { setEditingRetention(null); }
    setShowRetentionModal(true);
  }

  async function saveRetention(data: { entityType: string; retentionDays: number; description: string; active: boolean }) {
    try {
      const method = editingRetention ? 'PUT' : 'POST';
      const url = editingRetention ? `/api/admin/compliance-center/retention?id=${editingRetention.id}` : '/api/admin/compliance-center/retention';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { showToast(editingRetention ? 'Policy updated' : 'Policy created'); setShowRetentionModal(false); fetchData(); }
    } catch { showToast('Failed to save policy', 'error'); }
  }

  async function deleteRetention(id: string) {
    if (!confirm('Delete this retention policy?')) return;
    try {
      const res = await fetch(`/api/admin/compliance-center/retention?id=${id}`, { method: 'DELETE' });
      if (res.ok) { setRetentionPolicies(prev => prev.filter(p => p.id !== id)); showToast('Policy deleted'); }
    } catch { showToast('Failed to delete', 'error'); }
  }

  // ── Legal docs ─────────────────────────────────────────────────────────────────

  function openDocModal(doc?: LegalDocument) {
    setEditingDoc(doc || null);
    setShowDocModal(true);
  }

  async function saveDoc(data: { type: string; content: string; isActive: boolean }) {
    try {
      const method = editingDoc ? 'PUT' : 'POST';
      const url = editingDoc ? `/api/admin/compliance-center/legal-doc?id=${editingDoc.id}` : '/api/admin/compliance-center/legal-doc';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (res.ok) { showToast(editingDoc ? 'Document updated' : 'Document created'); setShowDocModal(false); fetchData(); }
    } catch { showToast('Failed to save document', 'error'); }
  }

  // ── Audit trail filtering ───────────────────────────────────────────────────────

  const filteredAudit = auditEntries.filter(e => {
    if (auditSearch) {
      const q = auditSearch.toLowerCase();
      if (!((e.userEmail || '').toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || (e.entityType || '').toLowerCase().includes(q))) return false;
    }
    if (auditActionFilter && e.action !== auditActionFilter) return false;
    if (auditEntityFilter && e.entityType !== auditEntityFilter) return false;
    if (auditDateFrom && new Date(e.createdAt) < new Date(auditDateFrom)) return false;
    if (auditDateTo && new Date(e.createdAt) > new Date(auditDateTo + 'T23:59:59')) return false;
    return true;
  });

  const auditPages = Math.ceil(filteredAudit.length / 50);
  const paginatedAudit = filteredAudit.slice(auditPage * 50, (auditPage + 1) * 50);

  // ── Export report ──────────────────────────────────────────────────────────────

  const handleExportReport = (type: 'hipaa' | 'audit' | 'retention' | 'full') => {
    const timestamp = new Date().toISOString().split('T')[0];
    if (type === 'hipaa') {
      const csv = [
        ['Category', 'Requirement', 'Status', 'Last Checked', 'Notes'],
        ...hipaaItems.map(i => [i.category, i.requirement, i.status, i.lastChecked, i.notes || '']),
      ].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
      downloadFile(csv, `hipaa-compliance-report-${timestamp}.csv`);
    } else if (type === 'retention') {
      const csv = [
        ['Entity Type', 'Retention Days', 'Description', 'Active'],
        ...retentionPolicies.map(p => [p.entityType, String(p.retentionDays), p.description || '', p.active ? 'Yes' : 'No']),
      ].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
      downloadFile(csv, `data-retention-report-${timestamp}.csv`);
    } else if (type === 'audit') {
      const csv = [
        ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details'],
        ...filteredAudit.map(e => [e.createdAt, e.userEmail || '', e.action, e.entityType, e.entityId || '', e.details ? JSON.stringify(e.details) : '']),
      ].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      downloadFile(csv, `audit-trail-report-${timestamp}.csv`);
    } else {
      const report = JSON.stringify({ hipaaItems, retentionPolicies, auditEntries: filteredAudit, exportedAt: new Date().toISOString() }, null, 2);
      downloadFile(report, `compliance-full-report-${timestamp}.json`);
    }
    showToast(`Report exported (${type})`);
    setShowReportModal(false);
  };

  function downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── HIPAA stats ─────────────────────────────────────────────────────────────────

  const hipaaCompliant = hipaaItems.filter(i => i.status === 'compliant').length;
  const hipaaPartial = hipaaItems.filter(i => i.status === 'partial').length;
  const hipaaNonCompliant = hipaaItems.filter(i => i.status === 'non_compliant').length;
  const hipaaScore = hipaaItems.length > 0 ? Math.round((hipaaCompliant / hipaaItems.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <ToastBar toasts={toasts} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Compliance Center</h1>
          <p className="text-gray-500 mt-1 text-sm">HIPAA compliance, audit trail, and data retention management</p>
        </div>
        <button onClick={() => setShowReportModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex gap-1 px-4">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key as TabKey)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tab === 'hipaa' ? (
            <HipaaTab items={hipaaItems} compliant={hipaaCompliant} partial={hipaaPartial} nonCompliant={hipaaNonCompliant} score={hipaaScore} />
          ) : tab === 'audit' ? (
            <AuditTab entries={paginatedAudit} total={filteredAudit.length} page={auditPage} pages={auditPages}
              onPageChange={setAuditPage} actionFilter={auditActionFilter} onActionFilter={setAuditActionFilter}
              entityFilter={auditEntityFilter} onEntityFilter={setAuditEntityFilter}
              dateFrom={auditDateFrom} onDateFrom={setAuditDateFrom} dateTo={auditDateTo} onDateTo={setAuditDateTo}
              search={auditSearch} onSearch={setAuditSearch}
              onClear={() => { setAuditActionFilter(''); setAuditEntityFilter(''); setAuditDateFrom(''); setAuditDateTo(''); setAuditSearch(''); setAuditPage(0); }}
            />
          ) : tab === 'retention' ? (
            <RetentionTab data={retentionPolicies} onAdd={() => openRetentionModal()} onEdit={openRetentionModal} onDelete={deleteRetention} />
          ) : tab === 'legal' ? (
            <LegalDocsTab data={legalDocs} onAdd={() => openDocModal()} onEdit={openDocModal} />
          ) : null}
        </div>
      </div>

      {/* Modals */}
      <Modal open={showRetentionModal} onClose={() => setShowRetentionModal(false)} title={editingRetention ? 'Edit Retention Policy' : 'Add Retention Policy'}>
        <RetentionPolicyForm existing={editingRetention} onSave={saveRetention} onCancel={() => setShowRetentionModal(false)} />
      </Modal>

      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title={editingDoc ? 'Edit Legal Document' : 'Add Legal Document'}>
        <LegalDocForm existing={editingDoc} onSave={saveDoc} onCancel={() => setShowDocModal(false)} />
      </Modal>

      <Modal open={showReportModal} onClose={() => setShowReportModal(false)} title="Export Compliance Report">
        <div className="space-y-3">
          {[
            { label: 'HIPAA Compliance Report', sub: 'HIPAA checklist with status for each requirement', type: 'hipaa' as const },
            { label: 'Data Retention Report', sub: 'All active retention policies', type: 'retention' as const },
            { label: 'Audit Trail Report', sub: 'Full audit trail with current filters applied', type: 'audit' as const },
            { label: 'Full Compliance Report', sub: 'Complete JSON dump of all compliance data', type: 'full' as const },
          ].map(opt => (
            <button key={opt.type} onClick={() => handleExportReport(opt.type)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors text-left">
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ── HIPAA Tab ─────────────────────────────────────────────────────────────────

const HIPAA_CATEGORIES = ['Administrative', 'Physical', 'Technical', 'Organizational', 'Training'];

function HipaaTab({ items, compliant, partial, nonCompliant, score }: {
  items: HipaaCheckItem[]; compliant: number; partial: number; nonCompliant: number; score: number;
}) {
  const [expandedCategory, setExpandedCategory] = useState<string>(HIPAA_CATEGORIES[0] || '');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return { label: 'Compliant', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✓' };
      case 'partial': return { label: 'Partial', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '~' };
      case 'non_compliant': return { label: 'Non-Compliant', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '✗' };
      default: return { label: 'N/A', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', icon: '?' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Score banner */}
      <div className="flex items-center gap-6 p-5 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{score}%</span>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">HIPAA Compliance Score</h3>
          <p className="text-sm text-gray-500 mt-1">Based on {items.length} requirements across 5 categories</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs font-medium text-emerald-600">{compliant} compliant</span>
            <span className="text-xs font-medium text-amber-600">{partial} partial</span>
            <span className="text-xs font-medium text-red-600">{nonCompliant} non-compliant</span>
          </div>
        </div>
      </div>

      {/* Category accordions */}
      <div className="space-y-3">
        {HIPAA_CATEGORIES.map(cat => {
          const catItems = items.filter(i => i.category === cat);
          if (catItems.length === 0) return null;
          const catCompliant = catItems.filter(i => i.status === 'compliant').length;
          const isOpen = expandedCategory === cat;
          return (
            <div key={cat} className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setExpandedCategory(isOpen ? '' : cat)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{cat}</span>
                  <span className="text-xs text-gray-400">({catCompliant}/{catItems.length} compliant)</span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="divide-y divide-gray-100">
                  {catItems.map(item => {
                    const badge = getStatusBadge(item.status);
                    return (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.requirement}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            {item.notes && <p className="text-xs text-gray-400 mt-1 italic">Note: {item.notes}</p>}
                            <p className="text-xs text-gray-300 mt-1">Last checked: {formatDate(item.lastChecked)}</p>
                          </div>
                          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Audit Tab ─────────────────────────────────────────────────────────────────

function AuditTab({ entries, total, page, pages, onPageChange, actionFilter, onActionFilter, entityFilter, onEntityFilter, dateFrom, onDateFrom, dateTo, onDateTo, search, onSearch, onClear }: {
  entries: AuditEntry[]; total: number; page: number; pages: number; onPageChange: (p: number) => void;
  actionFilter: string; onActionFilter: (v: string) => void; entityFilter: string; onEntityFilter: (v: string) => void;
  dateFrom: string; onDateFrom: (v: string) => void; dateTo: string; onDateTo: (v: string) => void;
  search: string; onSearch: (v: string) => void; onClear: () => void;
}) {
  const hasFilters = actionFilter || entityFilter || dateFrom || dateTo || search;
  const allActions = [...new Set(entries.map(e => e.action))].sort();
  const allEntities = [...new Set(entries.map(e => e.entityType))].sort();

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => onSearch(e.target.value)} placeholder="Search by user, action, or entity..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
        </div>
        <select value={actionFilter} onChange={e => onActionFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All Actions</option>
          {allActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={entityFilter} onChange={e => onEntityFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">All Entities</option>
          {allEntities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => onDateFrom(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
        <input type="date" value={dateTo} onChange={e => onDateTo(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500" />
        {hasFilters && <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700 px-2">Clear filters</button>}
      </div>

      <div className="text-xs text-gray-400 mb-2">{total} entries</div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No audit entries found</td></tr>
            ) : entries.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap" title={formatDate(entry.createdAt)}>{formatRelativeTime(entry.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{entry.userEmail || 'System'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{entry.action}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  <span className="bg-gray-100 px-2 py-0.5 rounded">{entry.entityType}</span>
                  {entry.entityId && <span className="ml-1 font-mono text-gray-400">{entry.entityId.slice(0, 8)}</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{entry.details ? JSON.stringify(entry.details) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-gray-500">Page {page + 1} of {pages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">Previous</button>
            <button onClick={() => onPageChange(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Retention Tab ─────────────────────────────────────────────────────────────

function RetentionTab({ data, onAdd, onEdit, onDelete }: {
  data: RetentionPolicy[];
  onAdd: () => void; onEdit: (r: RetentionPolicy) => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Policy
        </button>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No retention policies configured</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Entity Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Retention Period</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(policy => (
                <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{policy.entityType}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{policy.retentionDays} days</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{policy.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${policy.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {policy.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(policy.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEdit(policy)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => onDelete(policy.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
  );
}

// ── Legal Docs Tab ─────────────────────────────────────────────────────────────

function LegalDocsTab({ data, onAdd, onEdit }: {
  data: LegalDocument[];
  onAdd: () => void; onEdit: (d: LegalDocument) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={onAdd} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Document
        </button>
      </div>
      {data.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No legal documents</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(doc => (
            <div key={doc.id} className={`p-5 rounded-xl border ${doc.isActive ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">{DOC_TYPE_LABELS[doc.type] || doc.type}</h4>
                    {doc.isActive && <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Version {doc.version} &middot; {formatDate(doc.createdAt)}</p>
                </div>
                <button onClick={() => onEdit(doc)} className="shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              </div>
              <div className="text-sm text-gray-600 max-h-24 overflow-y-auto bg-white rounded-lg p-3 border border-gray-100">
                {doc.content.slice(0, 300)}{doc.content.length > 300 ? '...' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Retention Form ─────────────────────────────────────────────────────────────

function RetentionPolicyForm({ existing, onSave, onCancel }: {
  existing: RetentionPolicy | null;
  onSave: (d: { entityType: string; retentionDays: number; description: string; active: boolean }) => void;
  onCancel: () => void;
}) {
  const [entityType, setEntityType] = useState(existing?.entityType || '');
  const [retentionDays, setRetentionDays] = useState(existing ? String(existing.retentionDays) : '');
  const [description, setDescription] = useState(existing?.description || '');
  const [active, setActive] = useState(existing?.active ?? true);

  const handleSubmit = () => {
    if (!entityType || !retentionDays) return;
    onSave({ entityType, retentionDays: parseInt(retentionDays), description, active });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type *</label>
        <input type="text" value={entityType} onChange={e => setEntityType(e.target.value)} placeholder="e.g. leads, users, audit_logs"
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Retention Days *</label>
        <input type="number" value={retentionDays} onChange={e => setRetentionDays(e.target.value)} placeholder="365"
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="GDPR compliant data retention..."
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
        Active policy
      </label>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">Save</button>
      </div>
    </div>
  );
}

// ── Legal Doc Form ─────────────────────────────────────────────────────────────

function LegalDocForm({ existing, onSave, onCancel }: {
  existing: LegalDocument | null;
  onSave: (d: { type: string; content: string; isActive: boolean }) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState(existing?.type || 'privacy_policy');
  const [content, setContent] = useState(existing?.content || '');
  const [isActive, setIsActive] = useState(existing?.isActive ?? false);

  const handleSubmit = () => {
    if (!content) return;
    onSave({ type, content, isActive });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white">
          <option value="privacy_policy">Privacy Policy</option>
          <option value="terms_of_service">Terms of Service</option>
          <option value="medical_disclaimer">Medical Disclaimer</option>
          <option value="hipaa_notice">HIPAA Notice of Privacy Practices</option>
          <option value="cookie_policy">Cookie Policy</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={12} placeholder="Enter document content..."
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono" />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
        Set as active version
      </label>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">Save</button>
      </div>
    </div>
  );
}