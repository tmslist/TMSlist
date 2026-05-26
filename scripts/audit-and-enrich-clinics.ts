/**
 * Audit + enrich clinic websites in one atomic pass.
 *
 * For every clinic with a website:
 *   1. Validate URL is parseable and hostname has no forbidden chars
 *   2. DNS-probe the hostname (Node dns.lookup)
 *   3. HTTP-fetch (browser-like UA, follows redirects, accepts non-2xx HTML)
 *   4. Classify: ok | invalid_url | dns_fail | http_fail | empty | timeout
 *
 * Mutations:
 *   - invalid_url, dns_fail  → set website = null (link is demonstrably broken)
 *   - ok                     → upgrade logo (apple-touch-icon) and hero (og:image)
 *   - http_fail, timeout, empty → leave website unchanged (could be transient/blocked)
 *
 * Safety:
 *   - Backs up clinics.json to clinics.json.bak-{ISO} before writing
 *   - Atomic write: writes to .tmp then rename
 *   - Periodic checkpoint every 500 processed
 *
 * Run: npx tsx scripts/audit-and-enrich-clinics.ts
 *      npx tsx scripts/audit-and-enrich-clinics.ts --limit=100   (smoke test)
 *      npx tsx scripts/audit-and-enrich-clinics.ts --dry-run     (no writes)
 */

import { readFileSync, writeFileSync, copyFileSync, renameSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLINICS_JSON = resolve(__dirname, '..', 'src/data/clinics.json');

const CONCURRENCY = 8;
const FETCH_TIMEOUT_MS = 9000;
const DNS_TIMEOUT_MS = 5000;
const CHECKPOINT_EVERY = 500;
// Cloudflare DNS-over-HTTPS — robust against local resolver flakiness
const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const DRY_RUN = args.includes('--dry-run');

type Verdict = 'ok' | 'invalid_url' | 'dns_fail' | 'http_fail' | 'timeout' | 'empty' | 'no_site';

function classifyUrl(raw: string): { ok: boolean; reason?: Verdict; host?: string; url?: URL } {
    if (!raw) return { ok: false, reason: 'no_site' };
    let url: URL;
    try { url = new URL(raw); } catch { return { ok: false, reason: 'invalid_url' }; }
    // Hostname must contain no spec-forbidden chars (Node's URL accepts some weirdness)
    if (!/^[a-z0-9.-]+$/i.test(url.hostname)) return { ok: false, reason: 'invalid_url' };
    if (!url.hostname.includes('.')) return { ok: false, reason: 'invalid_url' };
    return { ok: true, host: url.hostname, url };
}

// In-memory DoH cache. Tri-state: true=resolves, false=definite NXDOMAIN, null=unknown.
const dohCache = new Map<string, boolean | null>();

async function dohQuery(host: string): Promise<boolean | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), DNS_TIMEOUT_MS);
    try {
        const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(host)}&type=A`;
        const res = await fetch(url, { headers: { Accept: 'application/dns-json' }, signal: ctrl.signal });
        if (!res.ok) return null;
        const data = await res.json() as { Status: number; Answer?: any[] };
        if (data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length) return true;
        if (data.Status === 3) return false; // NXDOMAIN — definitively no such name
        return null;
    } catch {
        return null;
    } finally {
        clearTimeout(t);
    }
}

/** Returns true (alive), false (NXDOMAIN — confirmed dead), or null (unknown). */
async function dnsProbe(host: string): Promise<boolean | null> {
    if (dohCache.has(host)) return dohCache.get(host)!;
    let result = await dohQuery(host);
    if (result === null) {
        await new Promise((r) => setTimeout(r, 700));
        result = await dohQuery(host);
    }
    dohCache.set(host, result);
    return result;
}

async function fetchHtml(url: string): Promise<{ html: string | null; verdict: Verdict }> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort('timeout'), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': BROWSER_UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            redirect: 'follow',
            signal: ctrl.signal,
        });
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
            return { html: null, verdict: 'http_fail' };
        }
        const text = await res.text();
        if (text.length < 200) return { html: null, verdict: 'empty' };
        return { html: text, verdict: 'ok' };
    } catch (e: any) {
        const msg = String(e?.message || e?.name || '');
        if (msg.includes('abort') || msg.includes('timeout')) return { html: null, verdict: 'timeout' };
        if (msg.includes('ENOTFOUND') || msg.includes('EAI_AGAIN')) return { html: null, verdict: 'dns_fail' };
        return { html: null, verdict: 'http_fail' };
    } finally {
        clearTimeout(t);
    }
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
        const sizesM = tag.match(/sizes=["'](\d+)x\d+["']/);
        const size = sizesM ? parseInt(sizesM[1], 10) : 16;
        if (size > bestSize) { bestSize = size; bestHref = m[1]; }
    }
    return bestHref ? absUrl(bestHref, baseUrl) : null;
}

function extractMeta(html: string, prop: string): string | null {
    const re1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
    const re3 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i');
    return (html.match(re1) || html.match(re2) || html.match(re3))?.[1] ?? null;
}

function extractHero(html: string, baseUrl: string): string | null {
    const og = extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image');
    return og ? absUrl(og, baseUrl) : null;
}

function s2Favicon(host: string): string {
    return `https://www.google.com/s2/favicons?domain=${host.replace(/^www\./, '')}&sz=128`;
}

const isPlaceholderHero = (u?: string | null) => !u || u.includes('images.unsplash.com');
const isWeakLogo = (u?: string | null) => !u || u.includes('s2/favicons');

interface Stats {
    total: number; processed: number;
    verdicts: Record<Verdict, number>;
    nullified: number;
    logoUpgraded: number; logoBaseline: number;
    heroSet: number;
}

async function processClinic(c: any, stats: Stats): Promise<void> {
    stats.processed++;
    const cls = classifyUrl(c.website || '');
    if (!cls.ok) {
        stats.verdicts[cls.reason!]++;
        if (cls.reason === 'invalid_url') {
            c.website = null;
            stats.nullified++;
        }
        return;
    }
    const dnsResult = await dnsProbe(cls.host!);
    // Always attempt the fetch as ground truth.
    const { html, verdict } = await fetchHtml(c.website!);
    // Nullify ONLY on confirmed NXDOMAIN (dnsResult === false) AND fetch couldn't pull HTML.
    // Inconclusive DNS (null) → keep URL; transient blocks → keep URL.
    if (dnsResult === false && verdict !== 'ok') {
        stats.verdicts.dns_fail++;
        c.website = null;
        stats.nullified++;
        return;
    }
    stats.verdicts[verdict]++;
    if (verdict !== 'ok' || !html) {
        // DNS unknown/alive but fetch failed — keep URL.
        return;
    }
    const newLogo = extractLogo(html, c.website!);
    if (newLogo && (isWeakLogo(c.logo_url) || c.logo_url !== newLogo)) {
        c.logo_url = newLogo;
        stats.logoUpgraded++;
    } else if (!c.logo_url) {
        c.logo_url = s2Favicon(cls.host!);
        stats.logoBaseline++;
    }
    const hero = extractHero(html, c.website!);
    if (hero && isPlaceholderHero(c.hero_image_url)) {
        c.hero_image_url = hero;
        stats.heroSet++;
    }
}

async function runWithConcurrency<T>(items: T[], n: number, fn: (item: T) => Promise<void>, onTick: (done: number) => void) {
    let i = 0;
    let done = 0;
    const workers = Array.from({ length: n }, async () => {
        while (true) {
            const idx = i++;
            if (idx >= items.length) return;
            await fn(items[idx]);
            done++;
            if (done % 25 === 0 || done === items.length) onTick(done);
        }
    });
    await Promise.all(workers);
}

function atomicWrite(path: string, data: string) {
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, data);
    renameSync(tmp, path);
}

async function main() {
    const clinics: any[] = JSON.parse(readFileSync(CLINICS_JSON, 'utf-8'));
    const targets = clinics.slice(0, LIMIT);
    const withSite = targets.filter((c) => c.website).length;
    console.log(`Total clinics:          ${clinics.length}`);
    console.log(`Targeting:              ${targets.length}${LIMIT === Infinity ? '' : ' (--limit)'}`);
    console.log(`With website:           ${withSite}`);
    console.log(`Concurrency:            ${CONCURRENCY}`);
    console.log(`Mode:                   ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
    console.log('');

    if (!DRY_RUN) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${CLINICS_JSON}.bak-${ts}`;
        copyFileSync(CLINICS_JSON, backupPath);
        console.log(`Backup written: ${backupPath}\n`);
    }

    const stats: Stats = {
        total: targets.length, processed: 0,
        verdicts: { ok: 0, invalid_url: 0, dns_fail: 0, http_fail: 0, timeout: 0, empty: 0, no_site: 0 },
        nullified: 0,
        logoUpgraded: 0, logoBaseline: 0,
        heroSet: 0,
    };

    let lastCheckpoint = 0;
    const start = Date.now();

    await runWithConcurrency(targets, CONCURRENCY, async (c) => {
        await processClinic(c, stats);
    }, (done) => {
        const pct = ((done / targets.length) * 100).toFixed(1);
        const eta = Math.round(((Date.now() - start) / done) * (targets.length - done) / 1000);
        process.stdout.write(`\r[${done}/${targets.length}] ${pct}%  ok:${stats.verdicts.ok} dns_fail:${stats.verdicts.dns_fail} invalid:${stats.verdicts.invalid_url} timeout:${stats.verdicts.timeout} http:${stats.verdicts.http_fail} | logo↑${stats.logoUpgraded} hero+${stats.heroSet} | ETA ${eta}s   `);
        if (!DRY_RUN && done - lastCheckpoint >= CHECKPOINT_EVERY) {
            atomicWrite(CLINICS_JSON, JSON.stringify(clinics, null, 2));
            lastCheckpoint = done;
        }
    });

    if (!DRY_RUN) atomicWrite(CLINICS_JSON, JSON.stringify(clinics, null, 2));

    console.log('\n\n=== Summary ===');
    console.log('Verdicts:');
    for (const [k, v] of Object.entries(stats.verdicts)) console.log(`  ${k.padEnd(14)} ${v}`);
    console.log(`\nMutations:`);
    console.log(`  Websites nullified:  ${stats.nullified}`);
    console.log(`  Logos upgraded:      ${stats.logoUpgraded}`);
    console.log(`  Logos (baseline):    ${stats.logoBaseline}`);
    console.log(`  Hero images set:     ${stats.heroSet}`);
    console.log(`\nElapsed: ${((Date.now() - start) / 1000).toFixed(0)}s`);
}

main().catch((e) => { console.error(e); process.exit(1); });
