'use client';
import { useState, useCallback } from 'react';

interface SitemapUrl {
  id: string;
  url: string;
  priority: 'high' | 'medium' | 'low';
  frequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastModified: string;
  status: 'active' | 'warning' | 'error';
}

interface SitemapConfig {
  id: string;
  name: string;
  urls: SitemapUrl[];
  pingStatus: 'pending' | 'success' | 'failed';
  lastPing: string;
}

interface AdminSitemapManagerProps {
  initialConfigs?: SitemapConfig[];
}

export default function AdminSitemapManager({ initialConfigs = [] }: AdminSitemapManagerProps) {
  const [configs, setConfigs] = useState<SitemapConfig[]>(initialConfigs.length > 0 ? initialConfigs : [
    {
      id: '1',
      name: 'Main Sitemap',
      urls: [
        { id: '1', url: '/clinics', priority: 'high', frequency: 'daily', lastModified: '2024-04-18', status: 'active' },
        { id: '2', url: '/treatments', priority: 'high', frequency: 'weekly', lastModified: '2024-04-15', status: 'active' },
        { id: '3', url: '/doctors', priority: 'medium', frequency: 'weekly', lastModified: '2024-04-16', status: 'active' },
        { id: '4', url: '/blog', priority: 'medium', frequency: 'daily', lastModified: '2024-04-18', status: 'active' },
        { id: '5', url: '/us/california/los-angeles', priority: 'high', frequency: 'daily', lastModified: '2024-04-18', status: 'warning' },
        { id: '6', url: '/us/new-york/new-york', priority: 'high', frequency: 'daily', lastModified: '2024-04-17', status: 'active' },
        { id: '7', url: '/us/texas/houston', priority: 'medium', frequency: 'weekly', lastModified: '2024-04-14', status: 'error' },
        { id: '8', url: '/faq', priority: 'low', frequency: 'monthly', lastModified: '2024-04-10', status: 'active' },
        { id: '9', url: '/forum', priority: 'low', frequency: 'hourly', lastModified: '2024-04-18', status: 'active' },
        { id: '10', url: '/jobs', priority: 'medium', frequency: 'daily', lastModified: '2024-04-18', status: 'active' },
      ],
      pingStatus: 'success',
      lastPing: '2024-04-18T10:30:00Z',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'warning' | 'error'>('all');
  const [editingUrl, setEditingUrl] = useState<string | null>(null);

  const totalUrls = configs.reduce((acc, cfg) => acc + cfg.urls.length, 0);
  const activeUrls = configs.reduce((acc, cfg) => acc + cfg.urls.filter(u => u.status === 'active').length, 0);
  const warningUrls = configs.reduce((acc, cfg) => acc + cfg.urls.filter(u => u.status === 'warning').length, 0);
  const errorUrls = configs.reduce((acc, cfg) => acc + cfg.urls.filter(u => u.status === 'error').length, 0);

  const handlePing = useCallback(async (engine: 'google' | 'bing') => {
    setPingLoading(true);
    // Simulate ping
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPingLoading(false);
    alert(`Sitemap pinged to ${engine === 'google' ? 'Google' : 'Bing'} successfully.`);
  }, []);

  const handleGenerateSitemap = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    alert('Sitemap generated and submitted successfully.');
  }, []);

  const filteredUrls = filter === 'all'
    ? configs[0]?.urls ?? []
    : configs[0]?.urls.filter(u => u.status === filter) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sitemap Manager</h2>
          <p className="text-sm text-gray-500 mt-1">Manage XML sitemaps and search engine indexing</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateSitemap}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Generate Sitemap
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total URLs</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalUrls.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeUrls}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Warnings</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{warningUrls}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{errorUrls}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Ping</p>
          <p className="text-lg font-bold text-gray-900 mt-1">Apr 18, 10:30 AM</p>
          <p className="text-xs text-emerald-600 mt-1">Successful</p>
        </div>
      </div>

      {/* Ping Search Engines */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Ping Search Engines</h3>
        <p className="text-sm text-gray-500 mb-4">Notify Google and Bing when your sitemap is updated.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePing('google')}
            disabled={pingLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Ping Google
          </button>
          <button
            onClick={() => handlePing('bing')}
            disabled={pingLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Ping Bing
          </button>
        </div>
      </div>

      {/* URL List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Sitemap URLs</h3>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'warning', 'error'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filter === f
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'active' && ` (${activeUrls})`}
                {f === 'warning' && ` (${warningUrls})`}
                {f === 'error' && ` (${errorUrls})`}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">URL</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Priority</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Frequency</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Last Modified</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUrls.map((url) => (
                <tr key={url.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-sm font-mono text-gray-800">{url.url}</span>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      defaultValue={url.priority}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      defaultValue={url.frequency}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="always">Always</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="never">Never</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-600">{url.lastModified}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      url.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      url.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        url.status === 'active' ? 'bg-emerald-500' :
                        url.status === 'warning' ? 'bg-amber-500' :
                        'bg-red-500'
                      }`} />
                      {url.status.charAt(0).toUpperCase() + url.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                      <button className="text-xs text-red-600 hover:text-red-700 font-medium">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">{filteredUrls.length} URLs shown</p>
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add URL</button>
        </div>
      </div>

      {/* Sitemap Preview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">XML Preview</h3>
          <div className="flex items-center gap-2">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open sitemap.xml
            </a>
          </div>
        </div>
        <div className="p-5">
          <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-lg overflow-x-auto font-mono leading-relaxed">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tmslist.com/clinics</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
    <lastmod>2024-04-18</lastmod>
  </url>
  <url>
    <loc>https://tmslist.com/treatments</loc>
    <priority>0.9</priority>
    <changefreq>weekly</changefreq>
    <lastmod>2024-04-15</lastmod>
  </url>
  <url>
    <loc>https://tmslist.com/doctors</loc>
    <priority>0.7</priority>
    <changefreq>weekly</changefreq>
    <lastmod>2024-04-16</lastmod>
  </url>
</urlset>`}
          </pre>
        </div>
      </div>
    </div>
  );
}