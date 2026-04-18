import type { APIRoute } from 'astro';
import {
  CORE_PAGES,
  TECHNOLOGY_SLUGS,
  INSURANCE_SLUGS,
  TREATMENT_SLUGS,
  COMPARE_SLUGS,
  PROVIDER_SLUGS,
  DEMOGRAPHIC_SLUGS,
  PROTOCOL_SLUGS,
  BLOG_SLUGS,
  COMMERCIAL_SLUGS,
  LEGAL_SLUGS,
  RESEARCH_SLUGS,
  STORIES_SLUGS,
  UTILITY_SLUGS,
  TOOL_SLUGS,
  ALTERNATIVE_SLUGS,
} from '../utils/seo_slugs';

export const GET: APIRoute = async () => {
  const base = 'https://tmslist.com';

  const urls: Array<{ loc: string; lastmod?: string; priority?: string; changefreq?: string }> = [];

  // Homepage
  urls.push({ loc: `${base}/`, lastmod: new Date().toISOString().split('T')[0], priority: '1.0', changefreq: 'daily' });

  // Static & Core pages
  for (const page of CORE_PAGES) {
    urls.push({ loc: `${base}/${page.slug}/`, priority: '0.8', changefreq: 'monthly' });
  }

  // Section indexes
  const sections = [
    { slug: 'treatments', priority: '0.9', changefreq: 'weekly' },
    { slug: 'protocols', priority: '0.8', changefreq: 'weekly' },
    { slug: 'technology', priority: '0.8', changefreq: 'weekly' },
    { slug: 'insurance', priority: '0.9', changefreq: 'weekly' },
    { slug: 'blog', priority: '0.8', changefreq: 'weekly' },
    { slug: 'stories', priority: '0.7', changefreq: 'monthly' },
    { slug: 'research', priority: '0.7', changefreq: 'monthly' },
    { slug: 'compare', priority: '0.8', changefreq: 'monthly' },
    { slug: 'providers', priority: '0.7', changefreq: 'weekly' },
    { slug: 'demographic', priority: '0.7', changefreq: 'monthly' },
    { slug: 'resources', priority: '0.7', changefreq: 'monthly' },
    { slug: 'alternatives', priority: '0.6', changefreq: 'monthly' },
    { slug: 'quiz', priority: '0.8', changefreq: 'monthly' },
    { slug: 'specialists', priority: '0.8', changefreq: 'weekly' },
    { slug: 'insurance', priority: '0.9', changefreq: 'weekly' },
    { slug: 'best-tms-clinics', priority: '0.8', changefreq: 'weekly' },
    { slug: 'verified-clinics', priority: '0.8', changefreq: 'weekly' },
    { slug: 'sitemap', priority: '0.3', changefreq: 'weekly' },
    { slug: 'sitemap.html', priority: '0.3', changefreq: 'weekly' },
    { slug: 'map', priority: '0.7', changefreq: 'weekly' },
    { slug: 'search', priority: '0.6', changefreq: 'weekly' },
    { slug: 'treatments', priority: '0.9', changefreq: 'weekly' },
    { slug: 'alternatives', priority: '0.6', changefreq: 'monthly' },
    { slug: 'community', priority: '0.6', changefreq: 'weekly' },
    { slug: 'wellness', priority: '0.6', changefreq: 'monthly' },
    { slug: 'providers', priority: '0.7', changefreq: 'weekly' },
    { slug: 'demographic', priority: '0.7', changefreq: 'monthly' },
    { slug: 'starting-a-tms-clinic', priority: '0.6', changefreq: 'monthly' },
    { slug: 'pricing', priority: '0.7', changefreq: 'monthly' },
    { slug: 'glossary', priority: '0.5', changefreq: 'monthly' },
    { slug: 'tms-cost-guide', priority: '0.8', changefreq: 'monthly' },
    { slug: 'tms-cost-calculator', priority: '0.7', changefreq: 'monthly' },
    { slug: 'tms-cpt-codes', priority: '0.7', changefreq: 'monthly' },
    { slug: 'for-clinics', priority: '0.7', changefreq: 'monthly' },
    { slug: 'for-specialists', priority: '0.7', changefreq: 'monthly' },
  ];

  const seen = new Set<string>();
  for (const s of sections) {
    if (!seen.has(s.slug)) {
      seen.add(s.slug);
      urls.push({ loc: `${base}/${s.slug}/`, priority: s.priority, changefreq: s.changefreq as any });
    }
  }

  // Technology pages
  for (const t of TECHNOLOGY_SLUGS) {
    urls.push({ loc: `${base}/technology/${t.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }

  // Insurance pages
  for (const i of INSURANCE_SLUGS) {
    urls.push({ loc: `${base}/insurance/${i.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }

  // Treatment pages
  for (const t of TREATMENT_SLUGS) {
    urls.push({ loc: `${base}/treatments/${t.slug}/`, priority: '0.8', changefreq: 'weekly' });
  }

  // Compare pages
  for (const c of COMPARE_SLUGS) {
    urls.push({ loc: `${base}/compare/${c.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }

  // Provider pages
  for (const p of PROVIDER_SLUGS) {
    urls.push({ loc: `${base}/providers/${p.slug}/`, priority: '0.6', changefreq: 'weekly' });
  }

  // Demographic pages
  for (const d of DEMOGRAPHIC_SLUGS) {
    urls.push({ loc: `${base}/demographic/${d.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }

  // Protocol pages
  for (const p of PROTOCOL_SLUGS) {
    urls.push({ loc: `${base}/protocols/${p.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }

  // Blog articles
  for (const b of BLOG_SLUGS) {
    urls.push({ loc: `${base}/blog/${b.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }

  // Stories
  for (const s of STORIES_SLUGS) {
    urls.push({ loc: `${base}/stories/${s.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }

  // Legal pages
  for (const l of LEGAL_SLUGS) {
    urls.push({ loc: `${base}/legal/${l.slug}/`, priority: '0.5', changefreq: 'yearly' });
  }

  // Research pages
  for (const r of RESEARCH_SLUGS) {
    urls.push({ loc: `${base}/research/${r.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }

  // Alternative treatments
  for (const a of ALTERNATIVE_SLUGS) {
    urls.push({ loc: `${base}/alternatives/${a.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }

  // Utility pages
  for (const u of UTILITY_SLUGS) {
    urls.push({ loc: `${base}/quiz/${u.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }

  // Tool pages
  for (const t of TOOL_SLUGS) {
    urls.push({ loc: `${base}/${t.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }

  // Commercial pages
  for (const c of COMMERCIAL_SLUGS) {
    urls.push({ loc: `${base}/providers/services/${c.slug}/`, priority: '0.5', changefreq: 'monthly' });
  }

  // Community pages
  urls.push({ loc: `${base}/community/`, priority: '0.5', changefreq: 'weekly' });
  urls.push({ loc: `${base}/community/login/`, priority: '0.3', changefreq: 'monthly' });
  urls.push({ loc: `${base}/community/new/`, priority: '0.4', changefreq: 'monthly' });

  // Auth pages
  urls.push({ loc: `${base}/login/`, priority: '0.3', changefreq: 'yearly' });
  urls.push({ loc: `${base}/oauth/consent/`, priority: '0.3', changefreq: 'yearly' });

  // Legal index
  urls.push({ loc: `${base}/legal/`, priority: '0.4', changefreq: 'yearly' });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority || '0.5'}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};