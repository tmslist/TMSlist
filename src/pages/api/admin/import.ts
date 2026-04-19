import type { APIRoute } from 'astro';
import { z } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../../db';
import {
  clinics, doctors, treatments, auditLog,
  importBatches
} from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { strictRateLimit } from '../../../utils/rateLimit';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const importSchema = z.object({
  type: z.enum(['clinic', 'doctor', 'treatment']),
  rows: z.array(z.record(z.string(), z.unknown())),
  filename: z.string(),
});

async function logAction(
  userId: string,
  action: string,
  entityType: string,
  ids: string[],
  details?: Record<string, unknown>
) {
  await db.insert(auditLog).values({
    userId,
    action,
    entityType,
    entityId: ids.join(','),
    details: { ids, ...details },
  });
}

// GET: List import batch history
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '20'), 100));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const batches = await db
      .select()
      .from(importBatches)
      .orderBy(sql`${importBatches.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(importBatches);
    const total = Number(countResult[0]?.count ?? 0);

    return json({ data: batches, total });
  } catch (err) {
    console.error('List import batches error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Bulk CSV/JSON import
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // Rate limit: 5 imports per hour per admin
  const rateLimit = await strictRateLimit(session.userId, 5, '1 h');
  if (!rateLimit.allowed) {
    return json({ error: 'Rate limited. Try again later.', retryAfter: rateLimit.retryAfter }, 429);
  }

  try {
    const body = await request.json();
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: 'Invalid payload', details: parsed.error.flatten() }, 400);
    }

    const { type, rows, filename } = parsed.data;

    if (rows.length > 5000) {
      return json({ error: 'Maximum 5000 rows per import' }, 400);
    }

    // Create batch record
    const [batch] = await db.insert(importBatches).values({
      type,
      filename,
      totalRows: rows.length,
      status: 'processing',
      importedBy: session.userId,
    }).returning();

    const errors: Array<{ row: number; field: string; message: string }> = [];
    let successCount = 0;

    if (type === 'clinic') {
      for (let i = 0; i < rows.length; i++) {
        try {
          const r = rows[i] as Record<string, unknown>;
          const slug = String(r.slug || r.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          if (!r.name || !r.city || !r.state) {
            errors.push({ row: i + 1, field: 'name/city/state', message: 'Required fields missing' });
            continue;
          }
          await db.insert(clinics).values({
            name: String(r.name),
            slug: slug || undefined,
            providerType: r.provider_type ? String(r.provider_type) : undefined,
            address: r.address ? String(r.address) : undefined,
            city: String(r.city),
            state: String(r.state),
            zip: r.zip ? String(r.zip) : undefined,
            country: r.country ? String(r.country).toUpperCase() : 'US',
            phone: r.phone ? String(r.phone) : undefined,
            website: r.website ? String(r.website) : undefined,
            email: r.email ? String(r.email) : undefined,
            machines: r.machines ? String(r.machines).split(',').map((s: string) => s.trim()) : null,
            specialties: r.specialties ? String(r.specialties).split(',').map((s: string) => s.trim()) : null,
            insurances: r.insurances ? String(r.insurances).split(',').map((s: string) => s.trim()) : null,
            description: r.description ? String(r.description) : undefined,
            createdBy: { name: session.name || 'admin', submitted_at: new Date().toISOString(), source: 'import' as const },
          });
          successCount++;
        } catch (e) {
          errors.push({ row: i + 1, field: 'insert', message: String(e) });
        }
      }
    } else if (type === 'doctor') {
      for (let i = 0; i < rows.length; i++) {
        try {
          const r = rows[i] as Record<string, unknown>;
          if (!r.name) {
            errors.push({ row: i + 1, field: 'name', message: 'Doctor name required' });
            continue;
          }
          // Lookup clinic by slug or name
          let clinicIdValue: string | null = null;
          if (r.clinic_slug) {
            const clinicPattern = `%${r.clinic_slug}%`;
            const found = await db.execute(sql`
              SELECT id FROM clinics
              WHERE slug ILIKE ${clinicPattern} OR name ILIKE ${clinicPattern}
              LIMIT 1
            `);
            clinicIdValue = found.rows?.[0]?.id ?? null;
          }
          if (!clinicIdValue) {
            errors.push({ row: i + 1, field: 'clinic_slug', message: 'Clinic not found' });
            continue;
          }
          await db.insert(doctors).values({
            clinicId: clinicIdValue,
            name: String(r.name),
            firstName: r.first_name ? String(r.first_name) : null,
            lastName: r.last_name ? String(r.last_name) : null,
            credential: r.credential ? String(r.credential) : null,
            title: r.title ? String(r.title) : null,
            school: r.school ? String(r.school) : null,
            yearsExperience: r.years_experience ? Number(r.years_experience) : null,
            specialties: r.specialties ? String(r.specialties).split(',').map((s: string) => s.trim()) : null,
            bio: r.bio ? String(r.bio) : null,
          });
          successCount++;
        } catch (e) {
          errors.push({ row: i + 1, field: 'insert', message: String(e) });
        }
      }
    } else if (type === 'treatment') {
      for (let i = 0; i < rows.length; i++) {
        try {
          const r = rows[i] as Record<string, unknown>;
          if (!r.name || !r.slug) {
            errors.push({ row: i + 1, field: 'name/slug', message: 'Required fields missing' });
            continue;
          }
          await db.insert(treatments).values({
            name: String(r.name),
            slug: String(r.slug),
            fullName: r.full_name ? String(r.full_name) : null,
            description: r.description ? String(r.description) : null,
            fdaApproved: r.fda_approved === 'true' || r.fda_approved === true,
            conditions: r.conditions ? String(r.conditions).split(',').map((s: string) => s.trim()) : null,
            howItWorks: r.how_it_works ? String(r.how_it_works) : null,
            sessionDuration: r.session_duration ? String(r.session_duration) : null,
            treatmentCourse: r.treatment_course ? String(r.treatment_course) : null,
            insuranceCoverage: r.insurance_coverage ? String(r.insurance_coverage) : null,
          });
          successCount++;
        } catch (e) {
          errors.push({ row: i + 1, field: 'insert', message: String(e) });
        }
      }
    }

    await db.update(importBatches).set({
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 100),
      status: errors.length === rows.length ? 'failed' : 'completed',
      completedAt: new Date(),
    }).where(eq(importBatches.id, batch.id));

    await logAction(session.userId, 'bulk_import', type, [], {
      filename,
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
    });

    return json({
      success: true,
      batchId: batch.id,
      totalRows: rows.length,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
      status: errors.length === rows.length ? 'failed' : 'completed',
    });
  } catch (err) {
    console.error('Bulk import error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
