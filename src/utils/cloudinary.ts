import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = import.meta.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
const API_SECRET = import.meta.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;

let configured = false;

function ensureConfig() {
  if (configured || !CLOUD_NAME) return !!CLOUD_NAME;
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true,
  });
  configured = true;
  return true;
}

export function isCloudinaryConfigured(): boolean {
  return !!CLOUD_NAME;
}

/**
 * Upload a clinic image to Cloudinary.
 * Returns the secure URL and public ID.
 */
export async function uploadClinicImage(
  fileBuffer: Buffer,
  clinicSlug: string,
  type: 'hero' | 'logo' | 'gallery' = 'hero'
): Promise<{ url: string; publicId: string } | null> {
  if (!ensureConfig()) return null;

  const result = await cloudinary.uploader.upload(
    `data:image/webp;base64,${fileBuffer.toString('base64')}`,
    {
      folder: `tmslist/clinics/${clinicSlug}`,
      public_id: `${type}-${Date.now()}`,
      transformation: type === 'logo'
        ? [{ width: 200, height: 200, crop: 'fill', gravity: 'auto' }]
        : [{ width: 1200, height: 750, crop: 'fill', gravity: 'auto' }],
      quality: 'auto:good',
      format: 'auto',
      // Strip EXIF for privacy
      exif: false,
    }
  );

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Generate responsive image URLs for a Cloudinary image.
 */
export function getResponsiveUrl(publicId: string, width: number): string {
  if (!ensureConfig()) return '';
  return cloudinary.url(publicId, {
    transformation: [
      { width, crop: 'scale' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
}

/**
 * Generate srcset string for responsive images.
 */
export function getCloudinarySrcSet(publicId: string): string {
  if (!ensureConfig()) return '';
  const widths = [400, 600, 800, 1200];
  return widths
    .map(w => `${getResponsiveUrl(publicId, w)} ${w}w`)
    .join(', ');
}

/**
 * Upload an AI-generated image to Cloudinary.
 * Accepts base64 data and a cache key for deduplication.
 * Returns the CDN URL.
 */
export async function uploadAiImage(
  base64Data: string,
  mimeType: string,
  cacheKey: string,
): Promise<string | null> {
  if (!ensureConfig()) return null;

  try {
    // Convert cache key to a safe public_id (e.g., "ai-img:city:new-york-ny" -> "city/new-york-ny")
    const parts = cacheKey.replace('ai-img:', '').split(':');
    const folder = parts[0] || 'hero';
    const name = parts.slice(1).join('-') || `img-${Date.now()}`;

    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${base64Data}`,
      {
        folder: `tmslist/ai/${folder}`,
        public_id: name,
        overwrite: false, // Don't re-upload if already exists
        transformation: [
          { width: 1200, height: 675, crop: 'fill', gravity: 'auto' },
        ],
        quality: 'auto:good',
        format: 'auto',
        resource_type: 'image',
      }
    );

    return result.secure_url;
  } catch (err: any) {
    // If image already exists (overwrite: false), fetch the existing URL
    if (err?.http_code === 409 || err?.message?.includes('already exists')) {
      const parts = cacheKey.replace('ai-img:', '').split(':');
      const folder = parts[0] || 'hero';
      const name = parts.slice(1).join('-') || `img-${Date.now()}`;
      const publicId = `tmslist/ai/${folder}/${name}`;
      try {
        const info = await cloudinary.api.resource(publicId);
        return info.secure_url;
      } catch {
        return null;
      }
    }
    console.error('Cloudinary AI image upload failed:', err);
    return null;
  }
}

/**
 * Delete an image from Cloudinary.
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  if (!ensureConfig()) return false;
  const result = await cloudinary.uploader.destroy(publicId);
  return result.result === 'ok';
}

/**
 * Upload a doctor profile photo.
 */
export async function uploadDoctorPhoto(
  fileBuffer: Buffer,
  doctorSlug: string
): Promise<{ url: string; publicId: string } | null> {
  if (!ensureConfig()) return null;

  const result = await cloudinary.uploader.upload(
    `data:image/webp;base64,${fileBuffer.toString('base64')}`,
    {
      folder: 'tmslist/doctors',
      public_id: doctorSlug,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      ],
      quality: 'auto:good',
      format: 'auto',
      exif: false,
    }
  );

  return { url: result.secure_url, publicId: result.public_id };
}
