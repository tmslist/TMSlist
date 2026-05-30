'use client';
import { useState, useEffect, useCallback } from 'react';

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  element?: string;
  recommendation: string;
}

interface PageAudit {
  url: string;
  score: number;
  issues: AuditIssue[];
  scannedAt: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  return (
    <span className={`text-2xl font-bold ${color}`}>{score}</span>
  );
}

function IssueRow({ issue }: { issue: AuditIssue }) {
  const [open, setOpen] = useState(false);
  const colors = {
    error: { badge: 'bg-red-100 text-red-700', label: 'Error' },
    warning: { badge: 'bg-amber-100 text-amber-700', label: 'Warning' },
    info: { badge: 'bg-blue-100 text-blue-700', label: 'Info' },
  };
  const c = colors[issue.type];
  return (
    <div className="border-b border-[var(--line)] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--paper2)] transition-colors"
      >
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${c.badge}`}>
          {c.label}
        </span>
        <span className="text-xs text-[var(--ink2)] font-medium">{issue.category}</span>
        <span className="flex-1 text-sm text-[var(--ink)] truncate">{issue.message}</span>
        <svg className={`w-4 h-4 text-[var(--muted)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-[var(--paper2)] border-t border-[var(--line)]">
          {issue.element && (
            <p className="text-xs text-[var(--muted)] mb-1">Element: <code className="font-mono bg-white px-1 rounded">{issue.element}</code></p>
          )}
          <p className="text-xs text-[var(--ink2)]">
            <span className="font-semibold">Recommendation:</span> {issue.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminSEOAuditor() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [auditResult, setAuditResult] = useState<PageAudit | null>(null);
  const [history, setHistory] = useState<PageAudit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seo-auditor');
      if (res.ok) {
        const json = await res.json();
        setHistory(json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const runAudit = useCallback(async (forceRefresh = false) => {
    if (!url.trim()) return;
    setScanning(true);
    setError('');
    setAuditResult(null);

    const normalized = url.startsWith('http') ? url : `https://${url}`;
    try {
      const res = await fetch('/api/admin/seo-auditor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, forceRefresh }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Audit failed');
        return;
      }
      setAuditResult(json.data);
      fetchHistory();
    } catch {
      setError('Network error during audit');
    } finally {
      setScanning(false);
    }
  }, [url, fetchHistory]);

  const clearHistory = async () => {
    if (!window.confirm('Clear all audit history?')) return;
    await fetch('/api/admin/seo-auditor', { method: 'DELETE' });
    setHistory([]);
    setAuditResult(null);
  };

  const groups = ['error', 'warning', 'info'] as const;
  const errors = auditResult?.issues.filter(i => i.type === 'error') ?? [];
  const warnings = auditResult?.issues.filter(i => i.type === 'warning') ?? [];
  const infos = auditResult?.issues.filter(i => i.type === 'info') ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-[var(--ink)]">SEO Auditor</h1>
        <p className="text-[var(--muted)] mt-1">Scan any URL for SEO issues and get actionable recommendations</p>
      </header>

      {/* Scan bar */}
      <div className="bg-white rounded-xl border border-[var(--line)] shadow-sm p-6">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runAudit(false); }}
            placeholder="https://example.com or example.com"
            className="flex-1 text-sm border border-[var(--line)] rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#1E2A3B] focus:border-[var(--ink2)] outline-none"
          />
          <button
            onClick={() => runAudit(false)}
            disabled={scanning || !url.trim()}
            className="px-6 py-2.5 bg-[var(--ink)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {scanning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Scan
              </>
            )}
          </button>
          {auditResult && (
            <button
              onClick={() => runAudit(true)}
              disabled={scanning}
              className="px-4 py-2.5 bg-[var(--paper2)] text-[var(--ink2)] text-sm font-medium rounded-lg border border-[var(--line)] hover:bg-[var(--paper2)] disabled:opacity-50 shrink-0"
            >
              Re-scan
            </button>
          )}
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Results */}
      {auditResult && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Score */}
          <div className="bg-white rounded-xl border border-[var(--line)] shadow-sm p-6 flex flex-col items-center justify-center">
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider mb-2">SEO Score</p>
            <ScoreBadge score={auditResult.score} />
            <p className="text-xs text-[var(--muted)] mt-1">/ 100</p>
            <div className="mt-4 w-full space-y-2">
              {[
                { label: 'Errors', count: errors.length, color: 'bg-red-500' },
                { label: 'Warnings', count: warnings.length, color: 'bg-amber-400' },
                { label: 'Info', count: infos.length, color: 'bg-blue-400' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-[var(--ink2)] flex-1">{label}</span>
                  <span className="text-xs font-semibold text-[var(--ink)]">{count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)] mt-4">{auditResult.url}</p>
            <p className="text-xs text-[var(--muted)]">
              Scanned {new Date(auditResult.scannedAt).toLocaleString()}
            </p>
          </div>

          {/* Issues */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-[var(--line)] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--line)]">
              <h3 className="text-sm font-semibold text-[var(--ink)]">Issues ({auditResult.issues.length})</h3>
            </div>
            {auditResult.issues.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-emerald-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[var(--muted)] text-sm">No issues found!</p>
              </div>
            ) : (
              groups.map(type => {
                const items = auditResult.issues.filter(i => i.type === type);
                if (items.length === 0) return null;
                return (
                  <div key={type}>
                    {items.map((issue, i) => (
                      <IssueRow key={i} issue={issue} />
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-[var(--line)] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Scan History</h3>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-600">
              Clear history
            </button>
          )}
        </div>
        {loadingHistory ? (
          <div className="py-8 text-center">
            <div className="w-5 h-5 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[var(--muted)] text-xs">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[var(--muted)] text-sm">No scans yet. Enter a URL above to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {history.map((audit, i) => {
              const scoreColor = audit.score >= 80 ? 'text-emerald-600' : audit.score >= 60 ? 'text-amber-500' : 'text-red-500';
              return (
                <button
                  key={i}
                  onClick={() => { setUrl(audit.url); setAuditResult(audit); }}
                  className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[var(--paper2)] transition-colors"
                >
                  <span className={`text-lg font-bold w-10 text-right shrink-0 ${scoreColor}`}>{audit.score}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--ink)] truncate">{audit.url}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {audit.issues.filter(i => i.type === 'error').length} errors,{' '}
                      {audit.issues.filter(i => i.type === 'warning').length} warnings{' '}
                      &middot; {new Date(audit.scannedAt).toLocaleString()}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-[var(--muted)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}