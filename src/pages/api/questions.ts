import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const filePath = join(process.cwd(), 'src/data/questions-comprehensive.json');
    const data = readFileSync(filePath, 'utf-8');
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000', // 1 day client / 30 days CDN
      },
    });
  } catch (err) {
    console.error('Failed to load questions data:', err);
    return new Response(JSON.stringify({ error: 'Questions data unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
