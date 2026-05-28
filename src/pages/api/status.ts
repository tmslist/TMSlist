import type { APIRoute } from 'astro';
import { db } from '../../db/index.js';
import { sql } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  const checks: Record<string, { status: string; latency?: number }> = {};
  const dbStart = Date.now();
  try { await db.execute(sql`SELECT 1`); checks.database = { status: 'ok', latency: Date.now() - dbStart }; }
  catch { checks.database = { status: 'error', latency: Date.now() - dbStart }; }

  const allOk = Object.values(checks).every(c => c.status === 'ok');
  return new Response(JSON.stringify({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }), { status: allOk ? 200 : 503, headers: { 'Content-Type': 'application/json' } });
};
