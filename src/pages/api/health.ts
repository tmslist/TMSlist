import type { APIRoute } from 'astro';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  const timestamp = new Date().toISOString();
  let dbHealthy = false;

  try {
    await db.execute(sql`SELECT 1`);
    dbHealthy = true;
  } catch (err) {
    console.error('Health check DB error:', err);
  }

  const status = dbHealthy ? 'ok' : 'degraded';
  const statusCode = dbHealthy ? 200 : 503;

  return new Response(JSON.stringify({ status, timestamp, db: dbHealthy }), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store',
    },
  });
};
