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
  NEAR_ME_SLUGS,
} from '../utils/seo_slugs';
import { getUniqueStates, STATE_NAMES, getStateSlug, getAllClinics, getClinicsByState, buildInternationalDirectory } from '../utils/dataHelpers';

export const GET: APIRoute = async () => {
  const base = 'https://tmslist.com';
  const now = new Date().toISOString().split('T')[0];
  const urls: Array<{ loc: string; lastmod?: string; priority?: string; changefreq?: string }> = [];

  // Homepage
  urls.push({ loc: `${base}/`, lastmod: now, priority: '1.0', changefreq: 'daily' });

  // Core pages
  for (const page of CORE_PAGES) {
    urls.push({ loc: `${base}/${page.slug}/`, priority: '0.8', changefreq: 'monthly' });
  }

  // Section indexes
  const sectionSlugs = [
    'treatments', 'protocols', 'technology', 'insurance', 'blog',
    'stories', 'research', 'compare', 'providers', 'demographic',
    'resources', 'alternatives', 'quiz', 'specialists',
    'best-tms-clinics', 'verified-clinics', 'sitemap', 'map', 'search',
    'community', 'wellness', 'starting-a-tms-clinic', 'pricing',
    'glossary', 'tms-cost-guide', 'tms-cost-calculator', 'tms-cpt-codes',
    'for-clinics', 'for-specialists',
  ];
  const seen = new Set<string>();
  for (const slug of sectionSlugs) {
    if (!seen.has(slug)) {
      seen.add(slug);
      urls.push({ loc: `${base}/${slug}/`, priority: '0.7', changefreq: 'weekly' });
    }
  }

  // Static pages
  const staticPages = [
    '/', '/verified-clinics/', '/specialists/', '/about-us/', '/blog/',
    '/contact/', '/add-listing/', '/community/', '/community/login/', '/community/new/',
    '/login/', '/oauth/consent/', '/legal/',
  ];
  for (const page of staticPages) {
    urls.push({ loc: `${base}${page}`, priority: '0.6', changefreq: 'monthly' });
  }

  // Technology
  for (const t of TECHNOLOGY_SLUGS) {
    urls.push({ loc: `${base}/technology/${t.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }
  // Insurance
  for (const i of INSURANCE_SLUGS) {
    urls.push({ loc: `${base}/insurance/${i.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }
  // Treatments
  for (const t of TREATMENT_SLUGS) {
    urls.push({ loc: `${base}/treatments/${t.slug}/`, priority: '0.8', changefreq: 'weekly' });
  }
  // Compare
  for (const c of COMPARE_SLUGS) {
    urls.push({ loc: `${base}/compare/${c.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }
  // Providers
  for (const p of PROVIDER_SLUGS) {
    urls.push({ loc: `${base}/providers/${p.slug}/`, priority: '0.6', changefreq: 'weekly' });
  }
  // Demographic
  for (const d of DEMOGRAPHIC_SLUGS) {
    urls.push({ loc: `${base}/demographic/${d.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }
  // Protocols
  for (const p of PROTOCOL_SLUGS) {
    urls.push({ loc: `${base}/protocols/${p.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }
  // Blog
  for (const b of BLOG_SLUGS) {
    urls.push({ loc: `${base}/blog/${b.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }
  // Stories
  for (const s of STORIES_SLUGS) {
    urls.push({ loc: `${base}/stories/${s.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }
  // Legal
  for (const l of LEGAL_SLUGS) {
    urls.push({ loc: `${base}/legal/${l.slug}/`, priority: '0.5', changefreq: 'yearly' });
  }
  // Research
  for (const r of RESEARCH_SLUGS) {
    urls.push({ loc: `${base}/research/${r.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }
  // Alternatives
  for (const a of ALTERNATIVE_SLUGS) {
    urls.push({ loc: `${base}/alternatives/${a.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }
  // Utility
  for (const u of UTILITY_SLUGS) {
    urls.push({ loc: `${base}/quiz/${u.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }
  // Tools
  for (const t of TOOL_SLUGS) {
    urls.push({ loc: `${base}/${t.slug}/`, priority: '0.6', changefreq: 'monthly' });
  }
  // Commercial
  for (const c of COMMERCIAL_SLUGS) {
    urls.push({ loc: `${base}/providers/services/${c.slug}/`, priority: '0.5', changefreq: 'monthly' });
  }
  // Near Me
  for (const n of NEAR_ME_SLUGS) {
    urls.push({ loc: `${base}/near-me/${n.slug}/`, priority: '0.7', changefreq: 'monthly' });
  }

  // Provider index pages (psychologists, therapists)
  urls.push({ loc: `${base}/psychologists/`, priority: '0.8', changefreq: 'weekly' });
  urls.push({ loc: `${base}/therapists/`, priority: '0.8', changefreq: 'weekly' });
  urls.push({ loc: `${base}/psychiatrists/`, priority: '0.8', changefreq: 'weekly' });

  // US states
  for (const stateCode of (await getUniqueStates()).sort()) {
    const slug = getStateSlug(stateCode);
    urls.push({ loc: `${base}/us/${slug}/`, priority: '0.8', changefreq: 'weekly' });
    urls.push({ loc: `${base}/best-tms-clinics/${slug}/`, priority: '0.7', changefreq: 'weekly' });
  }

  // City-level provider sub-pages (psychologists, therapists)
  // These are dynamically generated — add per city for top 100 cities
  const cities = await getAllClinics().then(cs =>
    [...new Set(cs.map(c => `${c.state}|${c.city}`))]
      .map(s => {
        const [state, city] = s.split('|');
        return { state, city, citySlug: city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''), stateSlug: getStateSlug(state) };
      })
  );
  for (const { citySlug, stateSlug } of cities) {
    urls.push({ loc: `${base}/us/${stateSlug}/${citySlug}/psychologists/`, priority: '0.6', changefreq: 'weekly' });
    urls.push({ loc: `${base}/us/${stateSlug}/${citySlug}/therapists/`, priority: '0.6', changefreq: 'weekly' });
  }

  // Near-me provider routes
  urls.push({ loc: `${base}/near-me/psychologist-near-me`, priority: '0.7', changefreq: 'monthly' });
  urls.push({ loc: `${base}/near-me/therapist-near-me`, priority: '0.7', changefreq: 'monthly' });

  // International
  const intl = await buildInternationalDirectory();
  for (const country of intl) {
    urls.push({ loc: `${base}/${country.urlPrefix}/`, priority: '0.8', changefreq: 'weekly' });
    for (const region of country.regions) {
      urls.push({ loc: `${base}/${country.urlPrefix}/${region.slug}/`, priority: '0.7', changefreq: 'weekly' });
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
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
