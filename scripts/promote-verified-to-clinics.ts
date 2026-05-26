/**
 * Promote VerifiedClinic entries from src/data/verified-clinics.ts into
 * src/data/clinics.json so they actually surface on /verified-clinics, state
 * pages, search, and the sitemap.
 *
 * - Geocodes each address via OpenStreetMap Nominatim (1 req/sec, no key)
 * - Adds a logo via Google's favicon service (domain-derived)
 * - Generates doctor stubs matching the existing doctors_data shape
 * - Dedupes against existing clinics.json by normalized name+zip
 *
 * Run:  npx tsx scripts/promote-verified-to-clinics.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_VERIFIED_CLINICS, type VerifiedClinic } from '../src/data/verified-clinics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const CLINICS_JSON = resolve(ROOT, 'src/data/clinics.json');

type Clinic = Record<string, any>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const norm = (s: string) =>
    s.toLowerCase().replace(/\b(inc|llc|pllc|pc|pa|pllc|p\.c\.|p\.a\.)\b/g, '').replace(/[^a-z0-9]+/g, '');

const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const cityCode = (city: string) =>
    city.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6);

async function geocode(addr: VerifiedClinic['address']): Promise<{ lat: number; lng: number } | null> {
    const q = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}, USA`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'tmslist-promote-script/1.0 (brandingpioneers@gmail.com)' } });
        if (!res.ok) return null;
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (!data.length) return null;
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch {
        return null;
    }
}

function logoUrlFromWebsite(website?: string): string | null {
    if (!website) return null;
    try {
        const domain = new URL(website).hostname.replace(/^www\./, '');
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
        return null;
    }
}

function doctorAvatar(name: string): string {
    const parts = name.replace(/,.*$/, '').split(/\s+/).filter(Boolean);
    const initials = (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || 'Dr')}&background=4338ca&color=fff&size=256&bold=true&format=png`;
}

function buildDoctor(d: NonNullable<VerifiedClinic['doctors']>[number], clinic: VerifiedClinic) {
    const cleanName = d.name.replace(/^Dr\.?\s*/i, '').replace(/,.*$/, '').trim();
    const parts = cleanName.split(/\s+/);
    const first_name = parts[0] || '';
    const last_name = parts[parts.length - 1] || '';
    const focus = d.specialties[0] || 'Depression';
    return {
        name: d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`,
        first_name,
        last_name,
        slug: slugify(`dr-${first_name}-${last_name}-${clinic.address.city}`),
        title: d.title,
        school: null,
        years_experience: null,
        specialties: d.specialties,
        bio_focus: focus,
        image_url: doctorAvatar(d.name),
        bio: `${d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`} is a ${d.title} at ${clinic.name} in ${clinic.address.city}, ${clinic.address.state}, specializing in ${d.specialties.join(', ')}.`,
    };
}

function toClinicJson(v: VerifiedClinic, geo: { lat: number; lng: number } | null, idCounter: () => number): Clinic {
    const id = `${v.address.state.toLowerCase()}-${cityCode(v.address.city)}-${String(idCounter()).padStart(3, '0')}`;
    return {
        id,
        name: v.name,
        slug: v.slug,
        description: v.description,
        description_long: v.description,
        provider_type: 'tms_center',
        address: v.address.street,
        city: v.address.city,
        state: v.address.state,
        zip: v.address.zip,
        country: 'US',
        geo,
        phone: v.phone ?? null,
        website: v.website ?? null,
        email: null,
        machines: v.machines,
        specialties: v.treatments,
        insurances: v.insuranceAccepted,
        opening_hours: ['Mon-Fri 09:00-17:00'],
        rating: { aggregate: 0, count: 0, sentiment_summary: null },
        verified: v.verified,
        is_featured: false,
        doctors_data: (v.doctors ?? []).map((d) => buildDoctor(d, v)),
        hero_image_url: null,
        logo_url: logoUrlFromWebsite(v.website),
        gallery_urls: [],
        media: null,
        accessibility: null,
        availability: null,
        pricing: null,
        google_business_profile: null,
        faqs: [],
        created_by: 'verified-clinics-promotion',
        seo_article: null,
    };
}

async function main() {
    const existing: Clinic[] = JSON.parse(readFileSync(CLINICS_JSON, 'utf-8'));
    const dedupeKeys = new Set(existing.map((c) => `${norm(c.name)}|${c.zip}`));
    const existingSlugs = new Set(existing.map((c) => c.slug));
    const stateCounters = new Map<string, number>();

    // Seed counters from existing IDs of pattern "<state>-<city>-NNN"
    for (const c of existing) {
        const m = /^([a-z]{2})-[a-z]+-(\d+)$/.exec(c.id);
        if (m) {
            const key = `${m[1]}|${c.city.toLowerCase()}`;
            const n = parseInt(m[2], 10);
            stateCounters.set(key, Math.max(stateCounters.get(key) ?? 0, n));
        }
    }
    const nextCounter = (state: string, city: string) => {
        const key = `${state.toLowerCase()}|${city.toLowerCase()}`;
        const n = (stateCounters.get(key) ?? 0) + 1;
        stateCounters.set(key, n);
        return n;
    };

    const toAdd: VerifiedClinic[] = [];
    for (const v of ALL_VERIFIED_CLINICS) {
        const k = `${norm(v.name)}|${v.address.zip}`;
        if (dedupeKeys.has(k)) continue;
        if (existingSlugs.has(v.slug)) continue;
        toAdd.push(v);
    }

    console.log(`Existing clinics: ${existing.length}`);
    console.log(`Verified candidates: ${ALL_VERIFIED_CLINICS.length}`);
    console.log(`After dedupe, will add: ${toAdd.length}`);

    const newEntries: Clinic[] = [];
    for (let i = 0; i < toAdd.length; i++) {
        const v = toAdd[i];
        process.stdout.write(`[${i + 1}/${toAdd.length}] ${v.name} ... `);
        const geo = await geocode(v.address);
        process.stdout.write(geo ? `geo ✓\n` : `geo ✗\n`);
        const counter = () => nextCounter(v.address.state, v.address.city);
        newEntries.push(toClinicJson(v, geo, counter));
        await sleep(1100); // Nominatim rate limit
    }

    const merged = [...existing, ...newEntries];
    writeFileSync(CLINICS_JSON, JSON.stringify(merged, null, 2));
    console.log(`\nWrote ${merged.length} clinics to ${CLINICS_JSON}`);
    console.log(`Added: ${newEntries.length}`);
    const geocoded = newEntries.filter((c) => c.geo).length;
    console.log(`Geocoded: ${geocoded}/${newEntries.length}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
