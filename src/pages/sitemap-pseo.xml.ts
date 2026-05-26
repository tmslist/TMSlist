import type { APIRoute } from 'astro';
import { getAllClinics, COUNTRY_URL_PREFIXES, STATE_NAMES } from '../utils/dataHelpers';
import { PSEO_PRIORITY_TREATMENTS } from '../utils/treatmentData';
import { TREATMENT_SLUGS } from '../utils/seo_slugs';

// Programmatic SEO sitemap: condition × location combinations.
// To stay under the 50k-URL sitemap limit we only emit:
//   - all treatments × every US state              (~27 × 50  = 1,350)
//   - PSEO_PRIORITY_TREATMENTS × every city        (varies; capped per country)
//   - PSEO_PRIORITY_TREATMENTS × every region (UK/CA/AU)
const PRIORITY_COUNTRIES = ['US', 'GB', 'CA', 'AU'];
const MAX_URLS = 49000;

export const GET: APIRoute = async () => {
    const base = 'https://tmslist.com';
    const now = new Date().toISOString().split('T')[0];
    const clinics = await getAllClinics();

    const seen = new Set<string>();
    const urls: string[] = [];
    const add = (loc: string, priority = '0.6', changefreq = 'weekly') => {
        if (urls.length >= MAX_URLS || seen.has(loc)) return;
        seen.add(loc);
        urls.push(`  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`);
    };

    const slugify = (s: string) =>
        s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // 1. All treatments × every US state ("TMS for X in California")
    for (const stateName of Object.values(STATE_NAMES)) {
        const stateSlug = slugify(stateName);
        for (const t of TREATMENT_SLUGS) {
            add(`${base}/us/${stateSlug}/treatments/${t.slug}/`, '0.7');
        }
    }

    // 2. Priority treatments × every (country, region, city) for priority countries
    const byCountryRegionCity = new Map<string, { country: string; region: string; city: string; count: number }>();
    for (const c of clinics) {
        const country = c.country || 'US';
        if (!PRIORITY_COUNTRIES.includes(country)) continue;
        if (!c.state || !c.city) continue;
        const key = `${country}|${c.state}|${c.city}`;
        const existing = byCountryRegionCity.get(key);
        if (existing) existing.count++;
        else byCountryRegionCity.set(key, { country, region: c.state, city: c.city, count: 1 });
    }

    // City-level: priority treatments × every priority-country city
    for (const { country, region, city } of byCountryRegionCity.values()) {
        const prefix = COUNTRY_URL_PREFIXES[country] || country.toLowerCase();
        const regionSlug = slugify(region);
        const citySlug = slugify(city);
        for (const tSlug of PSEO_PRIORITY_TREATMENTS) {
            add(`${base}/${prefix}/${regionSlug}/${citySlug}/${tSlug}/`, '0.6');
        }
    }

    // 3. Region-level: priority treatments × every region (UK/CA/AU)
    const intlRegions = new Set<string>();
    for (const c of clinics) {
        const country = c.country || 'US';
        if (!['GB', 'CA', 'AU'].includes(country)) continue;
        if (!c.state) continue;
        intlRegions.add(`${country}|${c.state}`);
    }
    for (const key of intlRegions) {
        const [country, region] = key.split('|');
        const prefix = COUNTRY_URL_PREFIXES[country];
        const regionSlug = slugify(region);
        for (const tSlug of PSEO_PRIORITY_TREATMENTS) {
            add(`${base}/${prefix}/${regionSlug}/treatments/${tSlug}/`, '0.7');
        }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
