import type { APIRoute } from 'astro';
import { generateCityImage, generateTreatmentImage, generateHeroImage, generateImage } from '../../../utils/gemini';
import { uploadAiImage, isCloudinaryConfigured } from '../../../utils/cloudinary';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor', 'clinic_owner')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = getClientIp(request);
  const rateLimited = await strictRateLimit(ip, 10, '1 h', 'ai:generate-image');
  if (rateLimited) return rateLimited;
  const type = url.searchParams.get('type'); // city, treatment, hero
  const subject = url.searchParams.get('subject');
  const state = url.searchParams.get('state') || '';

  if (!type || !subject) {
    return new Response(JSON.stringify({ error: 'Missing type or subject parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build a cache key for Cloudinary deduplication
  const slug = subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const cacheKey = `ai-img:${type}:${slug}`;

  let imageResult: { base64: string; mimeType: string } | null = null;
  let prompt = '';

  switch (type) {
    case 'city':
      prompt = `Create a clean, modern, minimalist watercolor-style illustration of ${subject}${state ? `, ${state}` : ''} city skyline. Use soft violet and blue tones. No text. White background. Medical wellness aesthetic. Professional and calming. Wide landscape aspect ratio.`;
      break;
    case 'treatment':
      prompt = `Create a clean, modern, minimalist medical illustration representing ${subject} treatment with TMS therapy. Use soft violet, blue, and teal tones. Abstract brain or neural pathway imagery. No text. White background. Professional medical aesthetic. Square format.`;
      break;
    case 'hero':
      prompt = `Create a wide, abstract, modern gradient background image for a medical wellness website about ${subject}. Soft flowing shapes in violet, blue, cyan, and white tones. Subtle neural network or brain wave pattern. No text. Minimalist and premium feel. Landscape format 16:9.`;
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid type. Use: city, treatment, hero' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  // Generate image via Gemini
  imageResult = await generateImage(prompt);

  if (!imageResult) {
    return new Response(JSON.stringify({ error: 'Image generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Try uploading to Cloudinary for CDN delivery
  if (isCloudinaryConfigured()) {
    try {
      const cdnUrl = await uploadAiImage(imageResult.base64, imageResult.mimeType, cacheKey);
      if (cdnUrl) {
        return new Response(JSON.stringify({ image: cdnUrl, source: 'cloudinary' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400, s-maxage=2592000', // 1 day client / 30 days CDN
          },
        });
      }
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to base64:', err);
    }
  }

  // Fallback: return base64 data URL if Cloudinary is not configured or upload failed
  const dataUrl = `data:${imageResult.mimeType};base64,${imageResult.base64}`;
  return new Response(JSON.stringify({ image: dataUrl, source: 'base64' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
};
