/**
 * Ground-truth validation: pick 20 known-real and 20 known-synthetic clinics,
 * run them through the audit logic, verify classifications match expectations.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLINICS_JSON = resolve(__dirname, '..', 'src/data/clinics.json');

const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';

async function dohQuery(host: string): Promise<boolean | null> {
    try {
        const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(host)}&type=A`;
        const res = await fetch(url, { headers: { Accept: 'application/dns-json' }, signal: AbortSignal.timeout(5000) });
        if (!res.ok) return null;
        const data = await res.json() as { Status: number; Answer?: any[] };
        if (data.Status === 0 && data.Answer?.length) return true;
        if (data.Status === 3) return false;
        return null;
    } catch { return null; }
}

async function main() {
    const clinics: any[] = JSON.parse(readFileSync(CLINICS_JSON, 'utf-8'));

    const promoted = clinics.filter((c) => c.created_by === 'verified-clinics-promotion' && c.website).slice(0, 10);
    // Known-good: hand-picked real sites
    const known = ['uclahealth.org', 'siliconvalleytms.com', 'butler.org', 'mayoclinic.org', 'muschealth.org', 'vanderbilthealth.com', 'brainhealthsolutions.com'];
    const realSet = clinics.filter((c) => c.website && known.some((d) => c.website.includes(d))).slice(0, 7);
    // Known-fake: 20-char SLDs
    const fakeSet = clinics.filter((c) => {
        if (!c.website) return false;
        try {
            const sld = new URL(c.website).hostname.replace(/^www\./, '').split('.')[0];
            return sld.length >= 19 && sld.length <= 22 && /^[a-z]+$/.test(sld);
        } catch { return false; }
    }).slice(0, 20);

    const samples = [
        ...promoted.map((c) => ({ ...c, _expected: 'real' })),
        ...realSet.map((c) => ({ ...c, _expected: 'real' })),
        ...fakeSet.map((c) => ({ ...c, _expected: 'fake' })),
    ];

    console.log(`Testing ${samples.length} samples (${promoted.length} promoted real + ${realSet.length} known real + ${fakeSet.length} synthetic-looking):\n`);

    let realCorrect = 0, realWrong = 0, fakeCorrect = 0, fakeWrong = 0;

    for (const c of samples) {
        const host = new URL(c.website).hostname;
        const dns = await dohQuery(host);
        let fetchOk = false;
        try {
            const r = await fetch(c.website, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
                redirect: 'follow', signal: AbortSignal.timeout(8000),
            });
            const ct = r.headers.get('content-type') || '';
            const txt = ct.includes('html') ? await r.text() : '';
            fetchOk = txt.length > 200;
        } catch {}

        // Match main script logic: only "fake" when DNS = false (confirmed NXDOMAIN) AND fetch fails
        const classified: 'real' | 'fake' = (dns === false && !fetchOk) ? 'fake' : 'real';
        const ok = classified === c._expected;
        if (c._expected === 'real') ok ? realCorrect++ : realWrong++;
        else ok ? fakeCorrect++ : fakeWrong++;
        const mark = ok ? '✓' : '✗ MISCLASSIFIED';
        console.log(`${mark} [${c._expected}→${classified}] dns=${dns} fetch=${fetchOk}  ${c.name} (${host})`);
    }

    console.log(`\n=== Validation ===`);
    console.log(`Real correctly identified:  ${realCorrect}/${realCorrect + realWrong}`);
    console.log(`Fake correctly identified:  ${fakeCorrect}/${fakeCorrect + fakeWrong}`);
    if (realWrong > 0) {
        console.log(`\n!! ${realWrong} REAL sites would be wrongly nullified — DO NOT proceed.`);
        process.exit(1);
    }
    console.log(`\n✓ Safe to proceed: zero false positives on real sites.`);
}

main();
