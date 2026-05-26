import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit';
import { fetch } from 'undici';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  // Rate-limit per IP to cap Google Places billing exposure (each
  // autocomplete keystroke is a paid request).
  const rateLimited = await strictRateLimit(getClientIp(request), 60, '1 m', 'places:autocomplete');
  if (rateLimited) return rateLimited;

  try {
    const url = new URL(request.url);
    const input = url.searchParams.get('input');

    if (!input || input.length < 2) {
      return json({ predictions: [] });
    }

    const apiKey = import.meta.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return json({ error: 'Google Places API key not configured' }, 503);
    }

    // `AbortSignal.timeout` is a static method — must be CALLED with a duration
    // to actually return a signal. The previous code passed the unbound method
    // reference, which silently disabled the timeout.
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) {
      return json({ error: 'Google API error', status: res.status }, 502);
    }

    const data = await res.json() as {
      predictions?: Array<{
        place_id: string;
        description: string;
        structured_formatting: { main_text: string; secondary_text: string };
      }>;
      status: string;
      error_message?: string;
    };

    if (data.status === 'REQUEST_DENIED') {
      return json({ error: data.error_message || 'API key issue', predictions: [] }, 400);
    }

    return json({
      predictions: (data.predictions || []).map(p => ({
        description: p.description,
        mainText: p.structured_formatting.main_text,
        secondaryText: p.structured_formatting.secondary_text,
      })),
    });
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      return json({ error: 'Request timeout' }, 504);
    }
    console.error('Places autocomplete error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};