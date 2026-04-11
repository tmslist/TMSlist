/**
 * JSON Data Provider — replaces Postgres reads with in-memory JSON.
 *
 * Loads clinics.json + international-clinics.json at build time.
 * Returns data shaped exactly like Drizzle DB rows so mapDbClinic() works unchanged.
 * DB is still used for writes (reviews, leads, admin).
 */

import clinicsRaw from '../data/clinics.json';
import internationalRaw from '../data/international-clinics.json';
import type { InferSelectModel } from 'drizzle-orm';
import type { clinics as clinicsTable, doctors as doctorsTable } from '../db/schema';

type ClinicRow = InferSelectModel<typeof clinicsTable>;
type DoctorRow = InferSelectModel<typeof doctorsTable>;

// ── JSON → DB Row Mappers ──────────────────────────────

function extractRating(rating: unknown): string {
  if (typeof rating === 'number') return rating.toFixed(2);
  if (typeof rating === 'object' && rating && 'aggregate' in rating) {
    return ((rating as { aggregate: number }).aggregate || 0).toFixed(2);
  }
  return '0.00';
}

function extractReviewCount(c: Record<string, any>): number {
  if (typeof c.rating === 'object' && c.rating && 'count' in c.rating) {
    return c.rating.count || 0;
  }
  return typeof c.review_count === 'number' ? c.review_count : 0;
}

function normalizeProviderType(type?: string): string | null {
  if (!type) return null;
  const map: Record<string, string> = {
    'Psychiatrist (MD/DO)': 'psychiatrist',
    'Dedicated TMS Center': 'tms_center',
    'Hospital / Medical Center': 'hospital',
    'Neurologist': 'neurologist',
    'Mental Health Clinic': 'mental_health_clinic',
    'Primary Care / Family Practice': 'primary_care',
    'Psychiatric Nurse Practitioner': 'nurse_practitioner',
  };
  return map[type] || null;
}

function mapJsonToClinicRow(c: Record<string, any>, isInternational = false): ClinicRow {
  const geo = c.geo || {};
  const media = c.media as Record<string, any> | undefined;

  return {
    id: c.id || c.slug,
    slug: c.slug,
    name: c.name,
    providerType: normalizeProviderType(c.provider_type) as any,
    country: c.country || 'US',
    address: c.address || null,
    city: c.city || 'Unknown',
    state: c.state || 'XX',
    zip: c.zip || null,
    lat: geo.lat?.toString() || null,
    lng: geo.lng?.toString() || null,
    phone: c.phone || null,
    website: c.website || null,
    email: c.email || null,
    machines: c.machines || [],
    specialties: c.specialties || [],
    insurances: c.insurances || [],
    openingHours: c.opening_hours || [],
    accessibility: c.accessibility || null,
    availability: c.availability || null,
    pricing: c.pricing || null,
    media: media || (c.hero_image_url || c.logo_url ? {
      hero_image_url: c.hero_image_url,
      logo_url: c.logo_url,
      gallery_urls: c.gallery_urls,
    } : null) as any,
    googleProfile: c.google_business_profile || null,
    faqs: c.faqs || null,
    createdBy: c.created_by || null,
    description: c.description || null,
    descriptionLong: c.description_long || null,
    verified: Boolean(c.verified),
    isFeatured: Boolean(c.is_featured),
    ratingAvg: extractRating(c.rating),
    reviewCount: extractReviewCount(c),
    createdAt: c.created_at ? new Date(c.created_at) : new Date('2025-04-01'),
    updatedAt: c.updated_at ? new Date(c.updated_at) : new Date('2025-04-01'),
    deletedAt: null,
  };
}

function mapJsonToDoctorRow(doc: Record<string, any>, clinicId: string): DoctorRow {
  const docName = doc.name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim();
  return {
    id: doc.id || `${clinicId}-${doc.slug || docName}`,
    clinicId,
    slug: doc.slug || null,
    name: docName,
    firstName: doc.first_name || null,
    lastName: doc.last_name || null,
    credential: doc.credential || doc.credentials || null,
    title: doc.title || null,
    school: doc.school || doc.university || null,
    yearsExperience: doc.years_experience || null,
    specialties: doc.specialties || null,
    bio: doc.bio || null,
    imageUrl: doc.image_url || doc.photo_url || null,
    createdAt: new Date('2025-04-01'),
    updatedAt: new Date('2025-04-01'),
  };
}

// ── Build In-Memory Data Store ──────────────────────────────

interface ClinicWithDoctors {
  row: ClinicRow;
  doctorRows: DoctorRow[];
  rawDoctorsData: Record<string, any>[];
}

function buildDataStore(): { clinicMap: Map<string, ClinicWithDoctors>; allRows: ClinicRow[]; allDoctorRows: DoctorRow[] } {
  const clinicMap = new Map<string, ClinicWithDoctors>();
  const allRows: ClinicRow[] = [];
  const allDoctorRows: DoctorRow[] = [];

  const allJson = [
    ...clinicsRaw.map((c: any) => ({ ...c, _src: 'us' })),
    ...internationalRaw.map((c: any) => ({ ...c, _src: 'intl' })),
  ];

  // Deduplicate by slug
  const seenSlugs = new Set<string>();
  for (const c of allJson) {
    if (seenSlugs.has(c.slug)) continue;
    seenSlugs.add(c.slug);

    const row = mapJsonToClinicRow(c, c._src === 'intl');
    const rawDocs = c.doctors_data || c.doctors || [];
    const doctorRows = rawDocs
      .filter((d: any) => d.name || d.first_name)
      .map((d: any) => mapJsonToDoctorRow(d, row.id));

    clinicMap.set(row.slug, { row, doctorRows, rawDoctorsData: rawDocs });
    allRows.push(row);
    allDoctorRows.push(...doctorRows);
  }

  return { clinicMap, allRows, allDoctorRows };
}

// Lazy singleton — built once on first access
let _store: ReturnType<typeof buildDataStore> | null = null;
function getStore() {
  if (!_store) _store = buildDataStore();
  return _store;
}

// ── Helpers ──────────────────────────────────

function ilike(str: string | null, pattern: string): boolean {
  if (!str) return false;
  return str.toLowerCase() === pattern.toLowerCase();
}

function sortByRating(a: ClinicRow, b: ClinicRow): number {
  return parseFloat(b.ratingAvg || '0') - parseFloat(a.ratingAvg || '0');
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function arrayContains(arr: string[] | null, values: string[]): boolean {
  if (!arr) return false;
  return values.every(v => arr.some(a => a.toLowerCase().includes(v.toLowerCase())));
}

// ── CLINIC QUERIES (drop-in replacements for db/queries.ts) ──

export async function getAllVerifiedClinics(): Promise<ClinicRow[]> {
  return getStore().allRows.filter(c => c.verified).sort(sortByRating);
}

export async function getAllClinics(opts?: { verified?: boolean; limit?: number; offset?: number }): Promise<ClinicRow[]> {
  let rows = getStore().allRows;
  if (opts?.verified !== undefined) rows = rows.filter(c => c.verified === opts.verified);
  rows = rows.sort(sortByRating);
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 5000;
  return rows.slice(offset, offset + limit);
}

export async function getClinicBySlug(slug: string): Promise<ClinicRow | null> {
  const entry = getStore().clinicMap.get(slug);
  return entry?.row ?? null;
}

export async function getClinicsByState(stateCode: string, opts?: { limit?: number; offset?: number }): Promise<ClinicRow[]> {
  const rows = getStore().allRows
    .filter(c => c.state.toUpperCase() === stateCode.toUpperCase() && c.verified)
    .sort(sortByRating);
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 1000;
  return rows.slice(offset, offset + limit);
}

export async function getClinicsByCity(stateCode: string, cityName: string): Promise<ClinicRow[]> {
  return getStore().allRows
    .filter(c =>
      c.state.toUpperCase() === stateCode.toUpperCase() &&
      ilike(c.city, cityName) &&
      c.verified
    )
    .sort(sortByRating);
}

export async function getClinicById(id: string): Promise<ClinicRow | null> {
  return getStore().allRows.find(c => c.id === id) ?? null;
}

export async function getUniqueStates(): Promise<string[]> {
  const states = new Set<string>();
  for (const c of getStore().allRows) {
    if (c.verified) states.add(c.state);
  }
  return [...states].sort();
}

export async function getCitiesByState(stateCode: string): Promise<string[]> {
  const cities = new Set<string>();
  for (const c of getStore().allRows) {
    if (c.state.toUpperCase() === stateCode.toUpperCase() && c.verified) {
      cities.add(c.city);
    }
  }
  return [...cities].sort();
}

export async function searchClinics(opts: {
  query?: string;
  state?: string;
  city?: string;
  country?: string;
  machines?: string[];
  insurances?: string[];
  specialties?: string[];
  verified?: boolean;
  limit?: number;
  offset?: number;
}): Promise<ClinicRow[]> {
  let rows = getStore().allRows;

  if (opts.verified !== undefined) rows = rows.filter(c => c.verified === opts.verified);
  if (opts.country) rows = rows.filter(c => c.country.toUpperCase() === opts.country!.toUpperCase());
  if (opts.state) rows = rows.filter(c => c.state.toUpperCase() === opts.state!.toUpperCase());
  if (opts.city) rows = rows.filter(c => ilike(c.city, opts.city!));
  if (opts.query) {
    const q = opts.query.toLowerCase();
    rows = rows.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  }
  if (opts.machines?.length) rows = rows.filter(c => arrayContains(c.machines, opts.machines!));
  if (opts.insurances?.length) rows = rows.filter(c => arrayContains(c.insurances, opts.insurances!));
  if (opts.specialties?.length) rows = rows.filter(c => arrayContains(c.specialties, opts.specialties!));

  rows = rows.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return sortByRating(a, b);
  });

  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 20;
  return rows.slice(offset, offset + limit);
}

export async function searchClinicsNearby(opts: {
  lat: number;
  lng: number;
  radiusMiles?: number;
  limit?: number;
  offset?: number;
  verified?: boolean;
}): Promise<(ClinicRow & { distance: number })[]> {
  const radiusMiles = opts.radiusMiles ?? 25;
  let rows = getStore().allRows;

  if (opts.verified !== undefined) rows = rows.filter(c => c.verified === opts.verified);

  const withDistance = rows
    .filter(c => c.lat && c.lng && parseFloat(c.lat) !== 0)
    .map(c => {
      const dist = haversineDistance(opts.lat, opts.lng, parseFloat(c.lat!), parseFloat(c.lng!));
      return { ...c, distance: Math.round(dist * 10) / 10 };
    })
    .filter(c => c.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);

  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 20;
  return withDistance.slice(offset, offset + limit);
}

export async function getClinicCount(stateCode?: string): Promise<number> {
  let rows = getStore().allRows.filter(c => c.verified);
  if (stateCode) rows = rows.filter(c => c.state.toUpperCase() === stateCode.toUpperCase());
  return rows.length;
}

export async function getTotalClinicCount(countryCode?: string): Promise<number> {
  let rows = getStore().allRows.filter(c => c.verified);
  if (countryCode) rows = rows.filter(c => c.country.toUpperCase() === countryCode.toUpperCase());
  return rows.length;
}

// ── DOCTOR QUERIES ──────────────────────────────

export async function getDoctorsByClinic(clinicId: string): Promise<DoctorRow[]> {
  return getStore().allDoctorRows.filter(d => d.clinicId === clinicId);
}

export async function getDoctorBySlug(slug: string): Promise<DoctorRow | null> {
  return getStore().allDoctorRows.find(d => d.slug === slug) ?? null;
}

export async function getAllDoctors(opts?: { limit?: number; offset?: number }): Promise<{
  doctor: DoctorRow;
  clinicName: string;
  clinicSlug: string;
  clinicCity: string;
  clinicState: string;
}[]> {
  const store = getStore();
  const results: { doctor: DoctorRow; clinicName: string; clinicSlug: string; clinicCity: string; clinicState: string }[] = [];

  for (const entry of store.clinicMap.values()) {
    if (!entry.row.verified) continue;
    for (const doc of entry.doctorRows) {
      results.push({
        doctor: doc,
        clinicName: entry.row.name,
        clinicSlug: entry.row.slug,
        clinicCity: entry.row.city,
        clinicState: entry.row.state,
      });
    }
  }

  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 5000;
  return results.slice(offset, offset + limit);
}

export async function getDoctorCount(): Promise<number> {
  const store = getStore();
  let count = 0;
  for (const entry of store.clinicMap.values()) {
    if (entry.row.verified) count += entry.doctorRows.length;
  }
  return count;
}

// ── INTERNATIONAL QUERIES ──────────────────────────────

export async function getClinicsByCountry(countryCode: string, opts?: { limit?: number; offset?: number }): Promise<ClinicRow[]> {
  const rows = getStore().allRows
    .filter(c => c.country.toUpperCase() === countryCode.toUpperCase() && c.verified)
    .sort(sortByRating);
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 500;
  return rows.slice(offset, offset + limit);
}

export async function getClinicsByCountryAndRegion(countryCode: string, region: string): Promise<ClinicRow[]> {
  return getStore().allRows
    .filter(c =>
      c.country.toUpperCase() === countryCode.toUpperCase() &&
      ilike(c.state, region) &&
      c.verified
    )
    .sort(sortByRating);
}

export async function getClinicsByCountryRegionCity(countryCode: string, region: string, city: string): Promise<ClinicRow[]> {
  return getStore().allRows
    .filter(c =>
      c.country.toUpperCase() === countryCode.toUpperCase() &&
      ilike(c.state, region) &&
      ilike(c.city, city) &&
      c.verified
    )
    .sort(sortByRating);
}

export async function getUniqueCountries(): Promise<string[]> {
  const countries = new Set<string>();
  for (const c of getStore().allRows) {
    if (c.verified && c.country !== 'US') countries.add(c.country);
  }
  return [...countries].sort();
}

export async function getRegionsForCountry(countryCode: string): Promise<string[]> {
  const states = new Set<string>();
  for (const c of getStore().allRows) {
    if (c.country.toUpperCase() === countryCode.toUpperCase() && c.verified) {
      states.add(c.state);
    }
  }
  return [...states].sort();
}

export async function getCitiesForRegion(countryCode: string, region: string): Promise<string[]> {
  const cities = new Set<string>();
  for (const c of getStore().allRows) {
    if (
      c.country.toUpperCase() === countryCode.toUpperCase() &&
      ilike(c.state, region) &&
      c.verified
    ) {
      cities.add(c.city);
    }
  }
  return [...cities].sort();
}

// ── FILTER QUERIES ──────────────────────────────

export async function getClinicsByMachine(machine: string): Promise<ClinicRow[]> {
  return getStore().allRows
    .filter(c => c.verified && arrayContains(c.machines, [machine]))
    .sort(sortByRating);
}

export async function getClinicsBySpecialty(specialty: string): Promise<ClinicRow[]> {
  return getStore().allRows
    .filter(c => c.verified && arrayContains(c.specialties, [specialty]))
    .sort(sortByRating);
}

export async function getClinicsByInsurance(insurance: string): Promise<ClinicRow[]> {
  return getStore().allRows
    .filter(c => c.verified && arrayContains(c.insurances, [insurance]))
    .sort(sortByRating);
}

// ── ADMIN QUERIES (read-only parts) ──────────────────────────────

export async function getAllClinicsAdmin(opts?: { limit?: number; offset?: number }): Promise<ClinicRow[]> {
  const rows = getStore().allRows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const offset = opts?.offset ?? 0;
  const limit = opts?.limit ?? 100;
  return rows.slice(offset, offset + limit);
}
