'use client';
import { useState, useCallback } from 'react';

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  element?: string;
  recommendation: string;
  status: 'open' | 'fixed';
}

interface PageAudit {
  url: string;
  score: number;
  issues: AuditIssue[];
  scannedAt: string;
}

interface SeoAuditsProps {
  initialAudits?: PageAudit[];
}

export default function AdminSeoAuditor({ initialAudits = [] }: SeoAuditsProps) {
  const [audits, setAudits] = useState<PageAudit[]>(initialAudits.length > 0 ? initialAudits : [
    {
      url: '/clinics',
      score: 87,
      issues: [
        { type: 'warning', category: 'Meta Tags', message: 'Meta description is 95 characters (recommended: 120-160)', element: '<meta name="description">', recommendation: 'Expand meta description to between 120-160 characters.', status: 'open' },
        { type: 'info', category: 'Images', message: '3 images missing alt attributes', element: '<img src="...">', recommendation: 'Add descriptive alt text to all images.', status: 'open' },
        { type: 'error', category: 'Headings', message: 'Multiple H1 tags found (2)', element: '<h1>', recommendation: 'Each page should have exactly one H1 tag.', status: 'open' },
        { type: 'warning', category: 'Schema', message: 'Missing LocalBusiness schema markup', element: '<script type="application/ld+json">', recommendation: 'Add structured data for LocalBusiness.', status: 'open' },
        { type: 'info', category: 'Links', message: '5 internal links without descriptive anchor text', element: '<a href="...">', recommendation: 'Use descriptive anchor text for internal links.', status: 'open' },
      ],
      scannedAt: '2024-04-18T09:00:00Z',
    },
    {
      url: '/us/california/los-angeles',
      score: 72,
      issues: [
        { type: 'error', category: 'Title', message: 'Title tag is missing', element: '<title>', recommendation: 'Add a unique title tag for this page.', status: 'open' },
        { type: 'error', category: 'Meta Tags', message: 'Meta description is missing', element: '<meta name="description">', recommendation: 'Add a meta description between 120-160 characters.', status: 'open' },
        { type: 'warning', category: 'Speed', message: 'LCP is 4.2s (target: under 2.5s)', element: 'LCP', recommendation: 'Optimize Largest Contentful Paint by lazy-loading images.', status: 'open' },
        { type: 'warning', category: 'Schema', message: 'BreadcrumbList schema is incomplete', element: '<script type="application/ld+json">', recommendation: 'Add complete breadcrumb schema with all parent items.', status: 'open' },
        { type: 'info', category: 'Images', message: 'Image sizes should be optimized', element: '<img>', recommendation: 'Compress images and use modern formats like WebP.', status: 'open' },
      ],
      scannedAt: '2024-04-18T08:30:00Z',
    },
  ]);

  const [scanning, setScanning] = useState(false);
  const [scanUrl, setScanUrl] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [showChecks, setShowChecks] = useState(true);

  const handleScan = useCallback(async () => {
    if (!scanUrl) return;
    setScanning(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    // Simulate adding a new audit
    const newAudit: PageAudit = {
      url: scanUrl,
      score: Math.floor(Math.random() * 30 + 60),
      issues: [],
      scannedAt: new Date().toISOString(),
    };
    setAudits(prev => [newAudit, ...prev]);
    setScanning(false);
    setScanUrl('');
  }, [scanUrl]);

  const scoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  const scoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-100';
    if (score >= 70) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const issueTypeColor = (type: string) => {
    if (type === 'error') return 'bg-red-100 text-red-700';
    if (type === 'warning') return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">SEO Auditor</h2>
          <p className="text-sm text-gray-500 mt-1">Audit pages for SEO best practices and issues</p>
        </div>
      </div>

      {/* Overall Score */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">79.5</p>
          <p className="text-xs text-gray-400 mt-1">Across all pages</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Critical Issues</p>
          <p className="text-3xl font-bold text-red-600 mt-1">4</p>
          <p className="text-xs text-gray-400 mt-1">Need immediate fix</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Warnings</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">8</p>
          <p className="text-xs text-gray-400 mt-1">Should be addressed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Info Tips</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">5</p>
          <p className="text-xs text-gray-400 mt-1">Improvements available</p>
        </div>
      </div>

      {/* Scan New Page */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Scan a Page</h3>
        <div className="flex items-center gap-3">
          <input
            type="url"
            value={scanUrl}
            onChange={(e) => setScanUrl(e.target.value)}
            placeholder="https://tmslist.com/page-url"
            className="flex-1 text-sm border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
          />
          <button
            onClick={handleScan}
            disabled={scanning || !scanUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {scanning ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Run Audit
              </>
            )}
          </button>
        </div>
      </div>

      {/* On-Page SEO Checklist */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">On-Page SEO Checklist</h3>
          <button
            onClick={() => setShowChecks(!showChecks)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {showChecks ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {showChecks && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title Tag */}
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-emerald-900">Title Tag</p>
                  <p className="text-xs text-emerald-700">All pages have unique title tags</p>
                </div>
              </div>
              {/* Meta Description */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-900">Meta Description</p>
                  <p className="text-xs text-amber-700">2 pages missing meta descriptions</p>
                </div>
              </div>
              {/* Heading Structure */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-900">Heading Structure</p>
                  <p className="text-xs text-amber-700">1 page has multiple H1 tags</p>
                </div>
              </div>
              {/* Images Alt */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Images with Alt Text</p>
                  <p className="text-xs text-blue-700">3 images need alt attributes</p>
                </div>
              </div>
              {/* Schema.org */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-900">Schema.org Markup</p>
                  <p className="text-xs text-amber-700">2 pages missing structured data</p>
                </div>
              </div>
              {/* Broken Links */}
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-emerald-900">Broken Links</p>
                  <p className="text-xs text-emerald-700">No broken links detected</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {audits.map((audit) => (
          <div key={audit.url} className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scoreBg(audit.score)}`}>
                  <span className={`text-lg font-bold ${scoreColor(audit.score)}`}>{audit.score}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{audit.url}</p>
                  <p className="text-xs text-gray-400">
                    Scanned {new Date(audit.scannedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Re-scan</button>
            </div>
            <div className="divide-y divide-gray-50">
              {audit.issues
                .filter(issue => filterType === 'all' || issue.type === filterType)
                .map((issue, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-start gap-3">
                    <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium uppercase shrink-0 ${issueTypeColor(issue.type)}`}>
                      {issue.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                      {issue.element && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{issue.element}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{issue.category}</span>
                        <span className="text-xs text-blue-600">{issue.recommendation}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}