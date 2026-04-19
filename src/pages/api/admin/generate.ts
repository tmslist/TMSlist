import type { APIRoute } from 'astro';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return new Response(JSON.stringify({ received: true, body }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};