import type { APIRoute } from 'astro';
import {
  COUNTRY_URL_PREFIXES,
  STATE_NAMES,
} from '../utils/dataHelpers';
import { getAllClinics } from '../utils/dataHelpers';

export const GET: APIRoute = async () => {
  const base = 'https://tmslist.com';
  const clinics = await getAllClinics();

  const seen = new Set<string>();
  const urls: string[] = [];

  // Helper to deduplicate
  const add = (loc: string, priority = '0.7', changefreq = 'weekly') => {
    if (!seen.has(loc)) {
      seen.add(loc);
      urls.push(`  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`);
    }
  };

  // Group clinics by country, region, city
  const byCountry: Record<string, typeof clinics> = {};
  for (const c of clinics) {
    const country = c.country || 'US';
    if (!byCountry[country]) byCountry[country] = [];
    byCountry[country].push(c);
  }

  // Country index pages
  for (const countryCode of Object.keys(byCountry)) {
    const prefix = COUNTRY_URL_PREFIXES[countryCode] || countryCode.toLowerCase();
    add(`${base}/${prefix}/`, '0.9', 'weekly');

    // Group by region (state/province)
    const byRegion: Record<string, typeof clinics> = {};
    for (const c of byCountry[countryCode]) {
      const region = c.state || '';
      if (!byRegion[region]) byRegion[region] = [];
      byRegion[region].push(c);
    }

    // State/region pages
    for (const region of Object.keys(byRegion).filter(Boolean).sort()) {
      const regionSlug = region.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      add(`${base}/${prefix}/${regionSlug}/`, '0.8', 'weekly');

      // City pages
      const byCity: Record<string, typeof clinics> = {};
      for (const c of byRegion[region]) {
        const city = c.city || '';
        if (!byCity[city]) byCity[city] = [];
        byCity[city].push(c);
      }

      for (const city of Object.keys(byCity).filter(Boolean).sort()) {
        const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        add(`${base}/${prefix}/${regionSlug}/${citySlug}/`, '0.7', 'weekly');
      }
    }
  }

  // US state pages (direct /us/ path for US-based)
  for (const [code, name] of Object.entries(STATE_NAMES)) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    add(`${base}/us/${slug}/`, '0.8', 'weekly');
  }

  // Best TMS clinics section pages
  for (const [code, name] of Object.entries(STATE_NAMES)) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    add(`${base}/best-tms-clinics/${slug}/`, '0.7', 'weekly');
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};