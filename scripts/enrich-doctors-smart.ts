/**
 * Smart Doctor Image Enrichment
 *
 * Only processes clinics with websites that actually resolve.
 * First does a fast DNS/HEAD check, then only scrapes reachable sites.
 *
 * Usage: npx tsx scripts/enrich-doctors-smart.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLINICS_PATH = path.join(__dirname, '..', 'src', 'data', 'clinics.json');

// Atomic write to prevent file corruption if interrupted
function safeWriteJson(filePath: string, data: any) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

const pageCache = new Map<string, string>();

async function fetchPage(url: string): Promise<string | null> {
  const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
  if (pageCache.has(cleanUrl)) return pageCache.get(cleanUrl)!;
  try {
    const response = await fetch(cleanUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!response.ok) return null;
    const html = await response.text();
    pageCache.set(cleanUrl, html);
    return html;
  } catch {
    return null;
  }
}

function makeAbsolute(imageUrl: string, baseUrl: string): string {
  if (imageUrl.startsWith('http')) return imageUrl;
  if (imageUrl.startsWith('//')) return `https:${imageUrl}`;
  if (imageUrl.startsWith('/')) {
    try {
      const urlObj = new URL(baseUrl);
      return `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
    } catch { return imageUrl; }
  }
  return `${baseUrl.replace(/\/$/, '')}/${imageUrl}`;
}

function isSkippableImg(tag: string, src: string): boolean {
  return tag.includes('icon') || tag.includes('logo') || tag.includes('favicon') ||
    tag.includes('1x1') || tag.includes('pixel') || tag.includes('spinner') ||
    src.includes('gravatar') || src.includes('wp-emoji') || src.includes('.svg') ||
    src.includes('data:image/svg') || src.includes('spacer') || src.includes('blank.gif') ||
    src.length < 10;
}

async function isReachable(url: string): Promise<boolean> {
  if (!url) return false;
  const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
  try {
    const response = await fetch(cleanUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });
    return response.ok || response.status === 405 || response.status === 403;
  } catch {
    try {
      const getRes = await fetch(cleanUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        redirect: 'follow',
      });
      return getRes.ok || getRes.status === 403;
    } catch {
      return false;
    }
  }
}

async function findDoctorImage(
  doctorName: string,
  firstName: string,
  lastName: string,
  clinicWebsite: string
): Promise<string | null> {
  let baseUrl: string;
  const cleanWebsite = clinicWebsite.startsWith('http') ? clinicWebsite : `https://${clinicWebsite}`;
  try {
    const u = new URL(cleanWebsite);
    baseUrl = `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }

  const lastNameLower = lastName.toLowerCase();
  const firstNameLower = firstName.toLowerCase();
  const fullNameLower = doctorName.toLowerCase();

  const pagesToCheck = [
    cleanWebsite,
    `${baseUrl}/about`, `${baseUrl}/about-us`,
    `${baseUrl}/team`, `${baseUrl}/our-team`,
    `${baseUrl}/staff`, `${baseUrl}/providers`,
    `${baseUrl}/doctors`, `${baseUrl}/meet-our-team`,
  ];

  for (const pageUrl of pagesToCheck) {
    const html = await fetchPage(pageUrl);
    if (!html) continue;

    const htmlLower = html.toLowerCase();

    // Strategy 1: img alt/src with doctor name
    const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
    for (const match of imgMatches) {
      const imgTag = match[0].toLowerCase();
      const imgSrc = match[1];
      if (isSkippableImg(imgTag, imgSrc)) continue;

      const altMatch = imgTag.match(/alt=["']([^"']+)["']/);
      const altText = altMatch ? altMatch[1].toLowerCase() : '';

      if ((lastNameLower.length > 3 && altText.includes(lastNameLower)) ||
        altText.includes(fullNameLower)) {
        return makeAbsolute(imgSrc, baseUrl);
      }
      if (lastNameLower.length > 3 && imgSrc.toLowerCase().includes(lastNameLower)) {
        return makeAbsolute(imgSrc, baseUrl);
      }
    }

    // Strategy 2: proximity search
    if (lastNameLower.length > 3 && htmlLower.includes(lastNameLower)) {
      let searchPos = 0;
      while (true) {
        const nameIdx = htmlLower.indexOf(lastNameLower, searchPos);
        if (nameIdx === -1) break;
        searchPos = nameIdx + 1;

        const regionStart = Math.max(0, nameIdx - 800);
        const regionEnd = Math.min(html.length, nameIdx + 800);
        const region = html.substring(regionStart, regionEnd);

        const nearbyImgs = [...region.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
        for (const imgMatch of nearbyImgs) {
          const tag = imgMatch[0].toLowerCase();
          const src = imgMatch[1];
          if (isSkippableImg(tag, src)) continue;

          const isLikelyHeadshot = tag.includes('headshot') || tag.includes('portrait') ||
            tag.includes('staff') || tag.includes('team') || tag.includes('provider') ||
            tag.includes('doctor') || tag.includes('photo') ||
            src.includes('headshot') || src.includes('team') || src.includes('staff') ||
            src.includes('portrait') || src.includes('doctor') || src.includes('provider');

          const widthMatch = tag.match(/width=["']?(\d+)/);
          const heightMatch = tag.match(/height=["']?(\d+)/);
          const w = widthMatch ? parseInt(widthMatch[1]) : 0;
          const h = heightMatch ? parseInt(heightMatch[1]) : 0;
          const isReasonableSize = (w === 0 && h === 0) || (w >= 80 && w <= 1200);

          if (isLikelyHeadshot && isReasonableSize) {
            return makeAbsolute(src, baseUrl);
          }
        }
      }
    }
  }

  return null;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

interface DoctorData {
  name: string;
  first_name?: string;
  last_name?: string;
  slug?: string;
  image_url?: string;
  [key: string]: any;
}

interface ClinicData {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  contact?: { phone?: string; website_url?: string };
  doctors_data?: DoctorData[];
  [key: string]: any;
}

async function main() {
  console.log('=== Smart Doctor Image Enrichment ===\n');

  const rawData = fs.readFileSync(CLINICS_PATH, 'utf-8');
  const clinics: ClinicData[] = JSON.parse(rawData);

  // Phase 1: Find all clinics with websites and doctors that need images
  const candidates: ClinicData[] = [];
  for (const clinic of clinics) {
    const websiteUrl = clinic.contact?.website_url || clinic.website || clinic.contact?.website;
    if (!websiteUrl || websiteUrl === '#') continue;
    // Skip obviously invalid URLs
    if (websiteUrl.includes('&') || websiteUrl.includes(' ')) continue;
    if (!clinic.doctors_data || clinic.doctors_data.length === 0) continue;

    const needsImages = clinic.doctors_data.some(d =>
      !d.image_url ||
      d.image_url.includes('api.dicebear.com') ||
      d.image_url.includes('ui-avatars.com') ||
      d.image_url.includes('unsplash.com') ||
      d.image_url.includes('placehold.co') ||
      d.image_url.includes('tms_doctor_consult')
    );
    if (needsImages) candidates.push(clinic);
  }

  console.log(`${candidates.length} clinics with valid websites need doctor images\n`);

  // Phase 2: Quick reachability check (batch with concurrency)
  console.log('Phase 1: Checking website reachability...');
  const reachable: ClinicData[] = [];
  const batchSize = 20;

  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (clinic) => {
        const websiteUrl = clinic.contact?.website_url || clinic.website || clinic.contact?.website;
        const ok = await isReachable(websiteUrl);
        return { clinic, ok };
      })
    );

    for (const { clinic, ok } of results) {
      if (ok) reachable.push(clinic);
    }

    const progress = Math.min(i + batchSize, candidates.length);
    process.stdout.write(`\r  Checked ${progress}/${candidates.length} - ${reachable.length} reachable`);
  }
  console.log(`\n\n${reachable.length} reachable clinic websites found\n`);

  // Phase 3: Scrape reachable sites for doctor photos
  console.log('Phase 2: Scraping doctor photos from reachable sites...\n');
  let imagesFound = 0;
  let avatarsGenerated = 0;

  for (let i = 0; i < reachable.length; i++) {
    const clinic = reachable[i];
    const progress = `[${i + 1}/${reachable.length}]`;
    const websiteUrl = clinic.contact?.website_url || clinic.website || clinic.contact?.website;

    for (const doctor of clinic.doctors_data!) {
      const hasRealImage = doctor.image_url &&
        !doctor.image_url.includes('api.dicebear.com') &&
        !doctor.image_url.includes('ui-avatars.com') &&
        !doctor.image_url.includes('unsplash.com') &&
        !doctor.image_url.includes('placehold.co') &&
        !doctor.image_url.includes('tms_doctor_consult');

      if (!hasRealImage) {
        const imageUrl = await findDoctorImage(
          doctor.name,
          doctor.first_name || '',
          doctor.last_name || '',
          websiteUrl
        );

        if (imageUrl) {
          doctor.image_url = imageUrl;
          imagesFound++;
          console.log(`${progress} ${doctor.name} @ ${clinic.name} - FOUND: ${imageUrl.substring(0, 80)}...`);
        } else {
          // Keep/set professional avatar
          const bgColors = ['0369a1', '1d4ed8', '4338ca', '6d28d9', '0e7490', '047857', 'b45309', 'be123c', '0f766e', '4f46e5'];
          const colorIdx = simpleHash(doctor.name) % bgColors.length;
          const bg = bgColors[colorIdx];
          const initials = `${(doctor.first_name || 'D').charAt(0)}${(doctor.last_name || 'R').charAt(0)}`;
          doctor.image_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=fff&size=256&bold=true&format=png`;
          avatarsGenerated++;
        }
      }
    }

    console.log(`${progress} ${clinic.name} - ${clinic.doctors_data!.length} doctors processed`);

    // Save periodically so progress isn't lost and dev server updates
    if (i > 0 && i % 25 === 0) {
      safeWriteJson(CLINICS_PATH, clinics);
    }
  }

  // Also update non-reachable clinic doctors to use professional avatars
  for (const clinic of clinics) {
    if (!clinic.doctors_data) continue;
    for (const doctor of clinic.doctors_data) {
      if (doctor.image_url?.includes('dicebear')) {
        const bgColors = ['0369a1', '1d4ed8', '4338ca', '6d28d9', '0e7490', '047857', 'b45309', 'be123c', '0f766e', '4f46e5'];
        const colorIdx = simpleHash(doctor.name) % bgColors.length;
        const bg = bgColors[colorIdx];
        const initials = `${(doctor.first_name || 'D').charAt(0)}${(doctor.last_name || 'R').charAt(0)}`;
        doctor.image_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=fff&size=256&bold=true&format=png`;
        avatarsGenerated++;
      }
    }
  }

  // Write back
  safeWriteJson(CLINICS_PATH, clinics);
  console.log(`\nWritten to ${CLINICS_PATH}`);

  console.log('\n=== Smart Doctor Enrichment Complete ===');
  console.log(`Candidates:       ${candidates.length}`);
  console.log(`Reachable sites:  ${reachable.length}`);
  console.log(`Real images found: ${imagesFound}`);
  console.log(`Avatars updated:  ${avatarsGenerated}`);
}

main().catch(console.error);
