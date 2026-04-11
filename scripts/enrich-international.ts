/**
 * International Clinic Enrichment Pipeline
 *
 * - Fetches hero images from clinic websites (OG image / hero image)
 * - Fetches doctor headshot photos from clinic team pages
 *
 * Usage: npx tsx scripts/enrich-international.ts
 * Options:
 *   --images-only     Only fetch clinic hero images
 *   --doctors-only    Only fetch doctor photos
 *   --dry-run         Preview changes without writing
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLINICS_PATH = path.join(__dirname, '..', 'src', 'data', 'international-clinics.json');

const CLINIC_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1516549655169-df83a092dd14?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1516574187841-693083f69382?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&h=500&fit=crop"
];

// ─── Page Fetching ──────────────────────────────────────────────────────────

const pageCache = new Map<string, string>();

async function fetchPage(url: string): Promise<string | null> {
  if (pageCache.has(url)) return pageCache.get(url)!;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!response.ok) return null;
    const html = await response.text();
    pageCache.set(url, html);
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

async function getFallbackLogo(websiteUrl: string): Promise<string | null> {
  try {
    const urlObj = new URL(websiteUrl);
    const domain = urlObj.hostname.replace(/^www\./, '');

    // Try Clearbit first for high-quality enterprise logos
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    try {
      const cbRes = await fetch(clearbitUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (cbRes.ok) return clearbitUrl;
    } catch { }

    // Fallback to Google's Favicon API which safely extracts the logo directly from the site
    return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=256`;
  } catch {
    return null;
  }
}

// ─── Clinic Hero Image ────────────────────────────────────────────────────

async function fetchClinicHeroImage(websiteUrl: string): Promise<string | null> {
  if (!websiteUrl || websiteUrl === '#') return null;

  const cleanUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
  const html = await fetchPage(cleanUrl);
  if (!html) return null;

  // 1. OG image
  const ogMatch = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
  if (ogMatch?.[1] && !ogMatch[1].includes('favicon')) return makeAbsolute(ogMatch[1], cleanUrl);

  // 2. Twitter card image
  const twitterMatch = html.match(/<meta[^>]+(?:property|name)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']twitter:image["']/i);
  if (twitterMatch?.[1] && !twitterMatch[1].includes('favicon')) return makeAbsolute(twitterMatch[1], cleanUrl);

  // 3. Hero/banner image
  const imgTags = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*/gi)];
  const heroImg = imgTags.find(m => {
    const tag = m[0].toLowerCase();
    return (tag.includes('hero') || tag.includes('banner') || tag.includes('header') || tag.includes('featured'))
      && !tag.includes('icon') && !tag.includes('pixel') && !tag.includes('1x1') && !tag.includes('logo');
  });
  if (heroImg?.[1]) return makeAbsolute(heroImg[1], cleanUrl);

  return null;
}

// ─── Doctor Photo Fetching ────────────────────────────────────────────────

function isSkippableImg(tag: string, src: string): boolean {
  return tag.includes('icon') || tag.includes('logo') || tag.includes('favicon') ||
    tag.includes('1x1') || tag.includes('pixel') || tag.includes('spinner') ||
    src.includes('gravatar') || src.includes('wp-emoji') || src.includes('.svg') ||
    src.includes('data:image/svg') || src.includes('spacer') || src.includes('blank.gif') ||
    src.length < 10;
}

async function findDoctorPhoto(
  doctorName: string,
  clinicWebsite: string
): Promise<string | null> {
  if (!clinicWebsite || clinicWebsite === '#') return null;

  const cleanWebsite = clinicWebsite.startsWith('http') ? clinicWebsite : `https://${clinicWebsite}`;
  let baseUrl: string;
  try {
    const u = new URL(cleanWebsite);
    baseUrl = `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }

  // Extract name parts
  const nameParts = doctorName.replace(/^(Dr\.?|Prof\.?|Professor)\s+/i, '').split(/\s+/);
  const lastName = nameParts[nameParts.length - 1] || '';
  const firstName = nameParts[0] || '';
  const lastNameLower = lastName.toLowerCase();
  const firstNameLower = firstName.toLowerCase();

  const pagesToCheck = [
    cleanWebsite,
    `${baseUrl}/about`, `${baseUrl}/about-us`, `${baseUrl}/about/`,
    `${baseUrl}/team`, `${baseUrl}/team/`, `${baseUrl}/our-team`, `${baseUrl}/our-team/`,
    `${baseUrl}/staff`, `${baseUrl}/staff/`, `${baseUrl}/providers`, `${baseUrl}/providers/`,
    `${baseUrl}/doctors`, `${baseUrl}/meet-our-team`, `${baseUrl}/meet-the-team`,
    `${baseUrl}/our-doctors`, `${baseUrl}/specialists`,
  ];

  for (const pageUrl of pagesToCheck) {
    const html = await fetchPage(pageUrl);
    if (!html) continue;

    const htmlLower = html.toLowerCase();
    if (lastNameLower.length > 2 && !htmlLower.includes(lastNameLower)) continue;

    // Strategy 1: Check img alt/src for name
    const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];

    for (const match of imgMatches) {
      const imgTag = match[0].toLowerCase();
      const imgSrc = match[1];
      if (isSkippableImg(imgTag, imgSrc)) continue;

      const altMatch = imgTag.match(/alt=["']([^"']+)["']/);
      const altText = altMatch ? altMatch[1].toLowerCase() : '';

      if ((lastNameLower.length > 3 && altText.includes(lastNameLower)) ||
        (firstNameLower.length > 3 && altText.includes(firstNameLower) && altText.includes(lastNameLower))) {
        return makeAbsolute(imgSrc, baseUrl);
      }

      if (lastNameLower.length > 3 && imgSrc.toLowerCase().includes(lastNameLower)) {
        return makeAbsolute(imgSrc, baseUrl);
      }
    }

    // Strategy 2: Proximity search
    if (lastNameLower.length > 3) {
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

          if (isReasonableSize && w > 0 && h > 0 && h >= w * 0.8) {
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

// ─── Main Pipeline ──────────────────────────────────────────────────────────

interface InternationalClinic {
  id: string;
  name: string;
  slug: string;
  website: string;
  hero_image_url: string | null;
  doctors_data?: {
    name: string;
    photo_url: string | null;
    [key: string]: any;
  }[];
  [key: string]: any;
}

async function main() {
  const args = process.argv.slice(2);
  const imagesOnly = args.includes('--images-only');
  const doctorsOnly = args.includes('--doctors-only');
  const dryRun = args.includes('--dry-run');

  console.log('=== International Clinic Enrichment Pipeline ===\n');
  console.log(`Mode: ${imagesOnly ? 'Hero Images Only' : doctorsOnly ? 'Doctor Photos Only' : 'Full Enrichment'}`);
  if (dryRun) console.log('DRY RUN\n');

  const rawData = fs.readFileSync(CLINICS_PATH, 'utf-8');
  const clinics: InternationalClinic[] = JSON.parse(rawData);
  console.log(`Loaded ${clinics.length} international clinics\n`);

  let heroImagesFound = 0;
  let doctorPhotosFound = 0;
  let fallbacksAssigned = 0;
  let errors = 0;

  for (let i = 0; i < clinics.length; i++) {
    const clinic = clinics[i];
    const progress = `[${i + 1}/${clinics.length}]`;

    try {
      // Fetch hero image
      if (!doctorsOnly && !clinic.hero_image_url) {
        const heroUrl = await fetchClinicHeroImage(clinic.website);
        if (heroUrl) {
          clinic.hero_image_url = heroUrl;
          heroImagesFound++;
          console.log(`${progress} ${clinic.name} - HERO: ${heroUrl.substring(0, 80)}...`);
        } else {
          const index = simpleHash(clinic.name) % CLINIC_IMAGE_POOL.length;
          clinic.hero_image_url = CLINIC_IMAGE_POOL[index];
          fallbacksAssigned++;
          console.log(`${progress} ${clinic.name} - No hero image found, assigned fallback`);
        }
      } else if (!doctorsOnly) {
        console.log(`${progress} ${clinic.name} - Already has hero image`);
      }

      // Fetch doctor photos
      if (!imagesOnly && clinic.doctors_data) {
        for (const doctor of clinic.doctors_data) {
          if (!doctor.photo_url) {
            const photoUrl = await findDoctorPhoto(doctor.name, clinic.website);
            if (photoUrl) {
              doctor.photo_url = photoUrl;
              doctorPhotosFound++;
              console.log(`  → ${doctor.name} - PHOTO: ${photoUrl.substring(0, 80)}...`);
            }
          }
        }
      }
    } catch (err) {
      errors++;
      console.error(`${progress} ERROR: ${clinic.name}:`, err);
    }
  }

  if (!dryRun) {
    fs.writeFileSync(CLINICS_PATH, JSON.stringify(clinics, null, 2), 'utf-8');
    console.log(`\nWritten to ${CLINICS_PATH}`);
  }

  console.log('\n=== International Enrichment Complete ===');
  console.log(`Clinics processed:     ${clinics.length}`);
  console.log(`Hero images found:     ${heroImagesFound}`);
  console.log(`Doctor photos found:   ${doctorPhotosFound}`);
  console.log(`Fallbacks assigned:    ${fallbacksAssigned}`);
  console.log(`Errors:                ${errors}`);
}

main().catch(console.error);
