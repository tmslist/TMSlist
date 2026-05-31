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

interface AuditSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  topIssues: Array<{
    url: string;
    issueType: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  lastRun: string | null;
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[severity] || styles.medium}`}>
      {severity}
    </span>
  );
}

function IssueRow({ url, issueType, severity, recommendation }: {
  url: string;
  issueType: string;
  severity: string;
  recommendation: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--line)] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50/50 transition-colors"
      >
        <SeverityBadge severity={severity} />
        <span className="text-xs text-[var(--muted)] font-mono truncate flex-1 min-w-0" title={url}>{url}</span>
        <span className="text-sm text-[var(--ink)] truncate hidden sm:block flex-1">{issueType}</span>
        <svg className={`w-4 h-4 text-[var(--muted)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-emerald-50/30 border-t border-[var(--line)]">
          <p className="text-xs text-[var(--ink2)]">
            <span className="font-semibold text-emerald-700">Recommendation:</span> {recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminSEOScanner() {
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [lastAudit, setLastAudit] = useState<PageAudit | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seo-auditor');
      if (res.ok) {
        const json = await res.json();
        const audits: PageAudit[] = json.data || [];

        if (audits.length === 0) {
          setSummary({ total: 0, critical: 0, high: 0, medium: 0, low: 0, topIssues: [], lastRun: null });
          return;
        }

        const allIssues = audits.flatMap(a => a.issues);
        const counts = { critical: 0, high: 0, medium: 0, low: 0 };
        allIssues.forEach(issue => {
          if (issue.type === 'error') counts.critical++;
          else if (issue.type === 'warning') counts.high++;
          else counts.medium++;
        });

        // Top 10 issues across all audits
        const topIssues = audits.flatMap(a =>
          a.issues.slice(0, 3).map(issue => ({
            url: a.url,
            issueType: `${issue.category}: ${issue.message}`,
            severity: (issue.type === 'error' ? 'critical' : issue.type === 'warning' ? 'high' : 'medium') as 'critical' | 'high' | 'medium' | 'low',
            recommendation: issue.recommendation,
          }))
        ).slice(0, 10);

        const latest = audits.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())[0];

        setSummary({
          total: allIssues.length,
          ...counts,
          topIssues,
          lastRun: latest?.scannedAt || null,
        });
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const runAudit = useCallback(async () => {
    if (!lastAudit?.url) return;
    setRunning(true);
    setError('');
    try {
      const res = await fetch('/api/admin/seo-auditor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: lastAudit.url, forceRefresh: true }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Audit failed');
      }
      fetchSummary();
    } catch {
      setError('Network error');
    } finally {
      setRunning(false);
    }
  }, [lastAudit, fetchSummary]);

  const pollResults = useCallback(async () => {
    if (!running) return;
    const res = await fetch('/api/admin/seo-auditor');
    if (res.ok) {
      const json = await res.json();
      const audits: PageAudit[] = json.data || [];
      const latest = audits.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())[0];
      if (latest && new Date(latest.scannedAt).getTime() > (lastAudit?.scannedAt ? new Date(lastAudit.scannedAt).getTime() : 0)) {
        setLastAudit(latest);
        fetchSummary();
        setRunning(false);
        return;
      }
    }
    setTimeout(pollResults, 2000);
  }, [running, lastAudit, fetchSummary]);

  useEffect(() => {
    if (running) {
      const timeout = setTimeout(pollResults, 3000);
      return () => clearTimeout(timeout);
    }
  }, [running, pollResults]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">SEO Scanner</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Audit site pages for SEO issues</p>
        </div>
        <a
          href="/admin/seo"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[var(--line)] rounded-lg hover:bg-[var(--paper2)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          SEO Overrides
        </a>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Issues</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-red-500 uppercase">Critical</p>
            <p className="text-2xl font-semibold text-red-600 mt-1">{summary.critical}</p>
          </div>
          <div className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-orange-500 uppercase">High</p>
            <p className="text-2xl font-semibold text-orange-600 mt-1">{summary.high}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-amber-500 uppercase">Medium</p>
            <p className="text-2xl font-semibold text-amber-600 mt-1">{summary.medium}</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--line)] p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase">Low</p>
            <p className="text-2xl font-semibold text-blue-600 mt-1">{summary.low}</p>
          </div>
        </div>
      )}

      {/* Run Audit + Last Run */}
      <div className="bg-white rounded-xl border border-[var(--line)] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--ink)]">Quick Audit</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {summary?.lastRun
                ? `Last run: ${new Date(summary.lastRun).toLocaleString()}`
                : 'No audits run yet'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastAudit ? (
              <button
                onClick={runAudit}
                disabled={running}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {running ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Re-scan
                  </>
                )}
              </button>
            ) : (
              <a
                href="/admin/seo-auditor"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Run Audit
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Top Issues */}
      {summary && summary.topIssues.length > 0 && (
        <div className="bg-white rounded-xl border border-[var(--line)] overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--ink)]">Top Issues</h3>
            <a
              href="/admin/seo-auditor"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View Full Report
            </a>
          </div>
          <div>
            {summary.topIssues.slice(0, 10).map((issue, i) => (
              <IssueRow key={i} {...issue} />
            ))}
          </div>
          {summary.topIssues.length === 0 && (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-emerald-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[var(--muted)] text-sm">No issues found!</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {summary && summary.total === 0 && (
        <div className="bg-white rounded-xl border border-[var(--line)] p-12 text-center shadow-sm">
          <svg className="w-16 h-16 text-emerald-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">No SEO audits yet</h3>
          <p className="text-sm text-[var(--muted)] mb-4">Run an SEO audit to see issues and recommendations for your pages.</p>
          <a
            href="/admin/seo-auditor"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            Run First Audit
          </a>
        </div>
      )}
    </div>
  );
}