/**
 * Enrich promoted clinics by scraping their websites for better assets:
 *  - logo_url:        apple-touch-icon (typically 180x180+) → fall back to existing favicon
 *  - hero_image_url:  og:image / twitter:image → leave null on miss
 *  - doctor image_url: try to find each named doctor's photo on the site → fall back to ui-avatars
 *
 * Only touches entries with created_by === 'verified-clinics-promotion'.
 * Idempotent-ish: re-running will overwrite values it can find again.
 *
 * Run: npx tsx scripts/enrich-promoted.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLINICS_JSON = resolve(__dirname, '..', 'src/data/clinics.json');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (compatible; tmslist-enrich/1.0; +https://tmslist.com)';

async function fetchHtml(url: string, timeoutMs = 12000): Promise<string | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, redirect: 'follow', signal: ctrl.signal });
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('text/html')) return null;
        return await res.text();
    } catch {
        return null;
    } finally {
        clearTimeout(t);
    }
}

function absUrl(href: string, base: string): string | null {
    try { return new URL(href, base).toString(); } catch { return null; }
}

function extractLogo(html: string, baseUrl: string): string | null {
    // Prefer apple-touch-icon (typically high-res square)
    const appleRe = /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i;
    const appleAltRe = /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon[^"']*["']/i;
    const m = html.match(appleRe) || html.match(appleAltRe);
    if (m) return absUrl(m[1], baseUrl);
    // Fall back to icon (any sizes), prefer larger
    const iconRe = /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/gi;
    let bestHref: string | null = null;
    let bestSize = 0;
    for (const match of html.matchAll(iconRe)) {
        const tag = match[0];
        const href = match[1];
        const sizesM = tag.match(/sizes=["'](\d+)x\d+["']/);
        const size = sizesM ? parseInt(sizesM[1], 10) : 16;
        if (size > bestSize) { bestSize = size; bestHref = href; }
    }
    if (bestHref) return absUrl(bestHref, baseUrl);
    return null;
}

function extractMeta(html: string, prop: string): string | null {
    const re1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
    const re3 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i');
    const m = html.match(re1) || html.match(re2) || html.match(re3);
    return m ? m[1] : null;
}

function extractHero(html: string, baseUrl: string): string | null {
    const og = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');
    if (og) return absUrl(og, baseUrl);
    return null;
}

function findDoctorImage(html: string, baseUrl: string, doctorName: string): string | null {
    // Strip "Dr. " and credentials, build name tokens
    const clean = doctorName.replace(/^Dr\.?\s*/i, '').replace(/,.*$/, '').trim();
    const tokens = clean.split(/\s+/).filter((t) => t.length > 1);
    if (!tokens.length) return null;
    // Look for an <img> whose alt or src contains the name (first + last together is best)
    const first = tokens[0].toLowerCase();
    const last = tokens[tokens.length - 1].toLowerCase();
    const imgRe = /<img[^>]+>/gi;
    for (const m of html.matchAll(imgRe)) {
        const tag = m[0].toLowerCase();
        const altM = tag.match(/alt=["']([^"']+)["']/);
        const srcM = tag.match(/src=["']([^"']+)["']/);
        if (!srcM) continue;
        const alt = altM?.[1] ?? '';
        const src = srcM[1];
        const hay = `${alt} ${src}`.toLowerCase();
        const hasFirst = hay.includes(first);
        const hasLast = hay.includes(last);
        if (hasFirst && hasLast) {
            const abs = absUrl(srcM[1], baseUrl);
            if (abs && /\.(jpe?g|png|webp)(\?|$)/i.test(abs)) return abs;
        }
    }
    return null;
}

async function main() {
    const clinics: any[] = JSON.parse(readFileSync(CLINICS_JSON, 'utf-8'));
    const promoted = clinics.filter((c) => c.created_by === 'verified-clinics-promotion' && c.website);

    console.log(`Promoted entries with websites: ${promoted.length}`);

    let logoUpgraded = 0;
    let heroSet = 0;
    let docFound = 0;
    let docTotal = 0;

    for (let i = 0; i < promoted.length; i++) {
        const c = promoted[i];
        process.stdout.write(`[${i + 1}/${promoted.length}] ${c.name} ... `);
        const html = await fetchHtml(c.website);
        if (!html) {
            process.stdout.write('site fetch ✗\n');
            await sleep(400);
            continue;
        }
        const newLogo = extractLogo(html, c.website);
        if (newLogo) { c.logo_url = newLogo; logoUpgraded++; }
        const hero = extractHero(html, c.website);
        if (hero) { c.hero_image_url = hero; heroSet++; }

        // Doctor headshots — try the homepage; if none, give up (deeper crawl is overkill).
        if (Array.isArray(c.doctors_data) && c.doctors_data.length) {
            for (const d of c.doctors_data) {
                docTotal++;
                const img = findDoctorImage(html, c.website, d.name);
                if (img) { d.image_url = img; docFound++; }
            }
        }
        process.stdout.write(`logo:${newLogo ? '✓' : '✗'} hero:${hero ? '✓' : '✗'}\n`);
        await sleep(600);
    }

    writeFileSync(CLINICS_JSON, JSON.stringify(clinics, null, 2));
    console.log(`\n--- Summary ---`);
    console.log(`Logo upgraded:  ${logoUpgraded}/${promoted.length}`);
    console.log(`Hero set:       ${heroSet}/${promoted.length}`);
    console.log(`Doctor photos:  ${docFound}/${docTotal}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
