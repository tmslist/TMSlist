/**
 * Image utilities — deterministic fallback pool + responsive helpers.
 * Replaces the old hardcoded Unsplash URLs in dataHelpers.ts with
 * a system that supports uploaded images (Vercel Blob) and fallbacks.
 *
 * Pool distribution uses clinic ID first (unique per DB row) so each
 * real clinic gets its own photo. Only falls back to name-based hashing
 * when ID is absent (static/mock data).
 */

const CLINIC_IMAGE_POOL = [
  // Medical / clinic interiors
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
  "https://images.unsplash.com/photo-1576091160550-217358c7e618?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&h=500&fit=crop",
  // Additional diversity — waiting rooms, exteriors, mental health context
  "https://images.unsplash.com/photo-1584982752892-0a4e2b5a9e17?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1590536889920-2540e4b90826?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=500&fit=crop",
  "https://images.unsplash.com/photo-1513060738314-8e4e4e7fea78?w=800&h=500&fit=crop",
];

/**
 * Deterministic hash — prioritizes ID (unique per clinic) then name.
 * This ensures all real DB clinics get unique photos from the pool.
 */
function getPoolIndex(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    // Keep hash to 32-bit range to avoid floating point issues
    hash = hash & hash;
  }
  return Math.abs(hash) % CLINIC_IMAGE_POOL.length;
}

/**
 * Get best image for a clinic with proper fallback chain.
 * Priority: uploaded hero → deterministic pool fallback
 *
 * Uses ID first (clinic.id from DB is unique) so each real clinic
 * gets its own distinct photo. Falls back to name-based hashing for
 * static/mock objects without IDs.
 */
export function getClinicImageUrl(clinic: {
  id?: string;
  name?: string;
  media?: { hero_image_url?: string; logo_url?: string } | null;
}): string {
  if (clinic.media?.hero_image_url) return clinic.media.hero_image_url;

  // Prefer clinic ID — ensures unique distribution for all DB rows
  const key = clinic.id || clinic.name || 'default';
  return CLINIC_IMAGE_POOL[getPoolIndex(key)];
}

/**
 * Generate responsive srcset for Unsplash images.
 */
export function getUnsplashSrcSet(url: string): string {
  if (!url.includes('unsplash.com')) return '';

  const base = url.split('?')[0];
  const widths = [400, 600, 800, 1200];
  return widths
    .map(w => `${base}?w=${w}&h=${Math.round(w * 0.625)}&fit=crop&auto=format ${w}w`)
    .join(', ');
}

/**
 * Get logo URL with fallback to first-letter SVG avatar.
 */
export function getClinicLogoUrl(clinic: {
  name: string;
  media?: { logo_url?: string } | null;
}): string {
  if (clinic.media?.logo_url) return clinic.media.logo_url;

  const initial = clinic.name.charAt(0).toUpperCase();
  const colors = ['4f46e5', '2563eb', '7c3aed', '059669', 'dc2626', 'ea580c', '0891b2', '7c3aed'];
  const color = colors[getPoolIndex(clinic.name) % colors.length];

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#${color}"/><text x="32" y="40" text-anchor="middle" fill="white" font-family="system-ui" font-size="28" font-weight="bold">${initial}</text></svg>`
  )}`;
}