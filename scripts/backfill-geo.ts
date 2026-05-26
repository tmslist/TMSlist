/**
 * Backfill missing geo coordinates in clinics.json using a less-specific
 * Nominatim query (city + state + zip) for entries the first pass couldn't
 * pinpoint. Only touches entries where geo === null.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLINICS_JSON = resolve(__dirname, '..', 'src/data/clinics.json');

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'tmslist-backfill-script/1.0 (brandingpioneers@gmail.com)' } });
        if (!res.ok) return null;
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (!data.length) return null;
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {
        return null;
    }
}

async function main() {
    const clinics: any[] = JSON.parse(readFileSync(CLINICS_JSON, 'utf-8'));
    const missing = clinics.filter((c) => c.created_by === 'verified-clinics-promotion' && !c.geo);
    console.log(`Promoted entries missing geo: ${missing.length}`);

    let fixed = 0;
    for (let i = 0; i < missing.length; i++) {
        const c = missing[i];
        process.stdout.write(`[${i + 1}/${missing.length}] ${c.name} ... `);
        // Try 1: street stripped of suite info + city/state/zip
        const streetBase = String(c.address).split(/,|suite|ste|unit|#/i)[0].trim();
        let geo = await geocode(`${streetBase}, ${c.city}, ${c.state} ${c.zip}, USA`);
        if (!geo) {
            await sleep(1100);
            // Try 2: zip only
            geo = await geocode(`${c.zip}, USA`);
        }
        if (geo) {
            c.geo = geo;
            fixed++;
            process.stdout.write('✓\n');
        } else {
            process.stdout.write('✗\n');
        }
        await sleep(1100);
    }

    writeFileSync(CLINICS_JSON, JSON.stringify(clinics, null, 2));
    console.log(`\nFixed: ${fixed}/${missing.length}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
