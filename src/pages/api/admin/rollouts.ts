import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Rollout strategy management is not yet backed by a schema table.
// Return an empty list so the admin UI renders a clean empty state
// rather than crashing or falling back to demo data.
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Forbidden' }, 403);
  }
  return json({ data: [], rollouts: [] });
};
