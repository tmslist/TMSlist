import type { APIRoute } from 'astro';
import { generateCityImage, generateTreatmentImage, generateHeroImage } from '../../../utils/gemini';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
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

  let imageDataUrl: string | null = null;

  switch (type) {
    case 'city':
      imageDataUrl = await generateCityImage(subject, state);
      break;
    case 'treatment':
      imageDataUrl = await generateTreatmentImage(subject);
      break;
    case 'hero':
      imageDataUrl = await generateHeroImage(subject);
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid type. Use: city, treatment, hero' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  if (!imageDataUrl) {
    return new Response(JSON.stringify({ error: 'Image generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ image: imageDataUrl }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800', // Cache for 1 day / 1 week on CDN
    },
  });
};
