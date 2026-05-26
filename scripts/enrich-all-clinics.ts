/**
 * Batch enrichment across the entire clinics.json dataset.
 *
 * For each clinic with a website:
 *   - Scrape apple-touch-icon → upgrade logo_url (always overwrites s2 favicons / null)
 *   - Scrape og:image / twitter:image → set hero_image_url if currently null OR a generic Unsplash placeholder
 *   - For clinics with no logo at all, set a baseline Google s2 favicon URL even if scrape fails
 *
 * Concurrency: 8 parallel fetches with per-request timeout.
 * Periodic checkpoint saves so progress isn't lost on crash.
 *
 * Run: npx tsx scripts/enrich-all-clinics.ts
 *      npx tsx scripts/enrich-all-clinics.ts --limit 100   (smoke test)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLINICS_JSON = resolve(__dirname, '..', 'src/data/clinics.json');

const UA = 'Mozilla/5.0 (compatible; tmslist-enrich/1.0; +https://tmslist.com)';
const CONCURRENCY = 8;
const FETCH_TIMEOUT_MS = 10000;
const CHECKPOINT_EVERY = 200;

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

async function fetchHtml(url: string): Promise<string | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const browserUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': browserUA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            redirect: 'follow',
            signal: ctrl.signal,
        });
        // Accept any response that returns HTML (even 404s often serve a usable shell with meta tags)
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('text/html')) return null;
        const text = await res.text();
        if (text.length < 200) return null;
        return text;
    } catch {
        return null;
    } finally {
        clearTimeout(t);
    }
}

async function tryFallbackHomepage(url: string): Promise<string | null> {
    // If the deep URL fails, try the bare origin.
    try {
        const u = new URL(url);
        const origin = `${u.protocol}//${u.hostname}`;
        if (origin === url.replace(/\/$/, '')) return null;
        return await fetchHtml(origin);
    } catch { return null; }
}

function absUrl(href: string, base: string): string | null {
    try { return new URL(href, base).toString(); } catch { return null; }
}

function extractLogo(html: string, baseUrl: string): string | null {
    const apple = html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
                || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon[^"']*["']/i);
    if (apple) return absUrl(apple[1], baseUrl);
    const iconRe = /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/gi;
    let bestHref: string | null = null;
    let bestSize = 0;
    for (const m of html.matchAll(iconRe)) {
        const tag = m[0];
        const href = m[1];
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
    return og ? absUrl(og, baseUrl) : null;
}

function s2Favicon(website: string): string | null {
    try {
        const domain = new URL(website).hostname.replace(/^www\./, '');
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch { return null; }
}

function isPlaceholderHero(url: string | null | undefined): boolean {
    if (!url) return true;
    return url.includes('images.unsplash.com');
}

function isWeakLogo(url: string | null | undefined): boolean {
    if (!url) return true;
    return url.includes('s2/favicons'); // upgrade these when we can
}

type Stats = { logoUpgraded: number; logoBaseline: number; heroSet: number; siteFail: number; processed: number };

async function processClinic(c: any, stats: Stats) {
    if (!c.website) {
        // Even with no website we can't do anything; skip.
        return;
    }
    stats.processed++;
    let html = await fetchHtml(c.website);
    if (!html) html = await tryFallbackHomepage(c.website);
    if (!html) {
        stats.siteFail++;
        // Still apply a baseline favicon if logo is missing
        if (!c.logo_url) {
            const fav = s2Favicon(c.website);
            if (fav) { c.logo_url = fav; stats.logoBaseline++; }
        }
        return;
    }
    const newLogo = extractLogo(html, c.website);
    if (newLogo) {
        if (isWeakLogo(c.logo_url) || c.logo_url !== newLogo) {
            c.logo_url = newLogo;
            stats.logoUpgraded++;
        }
    } else if (!c.logo_url) {
        const fav = s2Favicon(c.website);
        if (fav) { c.logo_url = fav; stats.logoBaseline++; }
    }
    const hero = extractHero(html, c.website);
    if (hero && isPlaceholderHero(c.hero_image_url)) {
        c.hero_image_url = hero;
        stats.heroSet++;
    }
}

async function runWithConcurrency<T>(items: T[], n: number, fn: (item: T, idx: number) => Promise<void>, onProgress: (done: number, total: number) => void) {
    let i = 0;
    const total = items.length;
    let done = 0;
    const workers = Array.from({ length: n }, async () => {
        while (true) {
            const idx = i++;
            if (idx >= total) return;
            await fn(items[idx], idx);
            done++;
            if (done % 25 === 0 || done === total) onProgress(done, total);
        }
    });
    await Promise.all(workers);
}

async function main() {
    const clinics: any[] = JSON.parse(readFileSync(CLINICS_JSON, 'utf-8'));
    const targets = clinics.filter((c) => c.website).slice(0, LIMIT);
    console.log(`Total clinics: ${clinics.length}`);
    console.log(`With website (targets): ${targets.length}`);
    console.log(`Concurrency: ${CONCURRENCY}, fetch timeout: ${FETCH_TIMEOUT_MS}ms`);
    console.log('');

    const stats: Stats = { logoUpgraded: 0, logoBaseline: 0, heroSet: 0, siteFail: 0, processed: 0 };
    let lastCheckpoint = 0;

    await runWithConcurrency(targets, CONCURRENCY, async (c) => {
        await processClinic(c, stats);
    }, (done, total) => {
        const pct = ((done / total) * 100).toFixed(1);
        process.stdout.write(`\r[${done}/${total}] ${pct}%  logo↑${stats.logoUpgraded}  logo·base${stats.logoBaseline}  hero+${stats.heroSet}  fail${stats.siteFail}  `);
        if (done - lastCheckpoint >= CHECKPOINT_EVERY) {
            writeFileSync(CLINICS_JSON, JSON.stringify(clinics, null, 2));
            lastCheckpoint = done;
        }
    });

    writeFileSync(CLINICS_JSON, JSON.stringify(clinics, null, 2));
    console.log('\n\n--- Summary ---');
    console.log(`Processed:           ${stats.processed}`);
    console.log(`Site fetch failed:   ${stats.siteFail}`);
    console.log(`Logos upgraded:      ${stats.logoUpgraded}`);
    console.log(`Logos (baseline):    ${stats.logoBaseline}`);
    console.log(`Hero images set:     ${stats.heroSet}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
