import type { APIRoute } from 'astro';
import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { healthChecks, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List all health checks
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const checks = await db
      .select()
      .from(healthChecks)
      .orderBy(desc(healthChecks.lastCheckedAt));

    return json({ data: checks });
  } catch (err) {
    console.error('Health checks GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Trigger a health check for a specific service and update the table
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { service } = body;
    if (!service) return json({ error: 'service is required' }, 400);

    const start = Date.now();
    let status: 'ok' | 'degraded' | 'down' = 'ok';
    let errorMessage: string | null = null;

    // Ping PostgreSQL
    if (service === 'postgresql') {
      try {
        await db.execute(sql`SELECT 1`);
      } catch (e: unknown) {
        status = 'down';
        errorMessage = e instanceof Error ? e.message : String(e);
      }
    }

    // Redis check (placeholder if redis is not configured)
    if (service === 'redis') {
      try {
        const redisUrl = import.meta.env.REDIS_URL || process.env.REDIS_URL;
        if (!redisUrl) {
          status = 'degraded';
          errorMessage = 'REDIS_URL not configured';
        } else {
          // Basic connectivity check via fetch if available
          const res = await fetch(`${redisUrl}/ping`, { signal: AbortSignal.timeout }).catch(() => null);
          if (!res?.ok) {
            status = 'degraded';
            errorMessage = 'Redis ping failed';
          }
        }
      } catch (e: unknown) {
        status = 'down';
        errorMessage = e instanceof Error ? e.message : String(e);
      }
    }

    // Other service checks
    if (service === 'stripe') {
      const stripeKey = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        status = 'degraded';
        errorMessage = 'STRIPE_SECRET_KEY not configured';
      }
    }

    if (service === 'resend') {
      const resendKey = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
      if (!resendKey) {
        status = 'degraded';
        errorMessage = 'RESEND_API_KEY not configured';
      }
    }

    if (service === 'cloudinary') {
      const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        status = 'degraded';
        errorMessage = 'CLOUDINARY_CLOUD_NAME not configured';
      }
    }

    const responseTimeMs = Date.now() - start;

    // Upsert: update existing row or insert new one
    const existing = await db
      .select()
      .from(healthChecks)
      .where(eq(healthChecks.service, service))
      .limit(1);

    let record;
    if (existing[0]) {
      [record] = await db
        .update(healthChecks)
        .set({
          status,
          responseTimeMs,
          lastCheckedAt: new Date(),
          errorMessage,
        })
        .where(eq(healthChecks.service, service))
        .returning();
    } else {
      [record] = await db
        .insert(healthChecks)
        .values({
          service,
          status,
          responseTimeMs,
          lastCheckedAt: new Date(),
          errorMessage,
        })
        .returning();
    }

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'trigger_health_check',
      entityType: 'health_check',
      entityId: record.id,
      details: { service, status, responseTimeMs },
    });

    return json({ success: true, data: record });
  } catch (err) {
    console.error('Health checks POST error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};