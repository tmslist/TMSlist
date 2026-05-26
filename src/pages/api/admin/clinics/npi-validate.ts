import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { clinics } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';
import { eq, and, isNull, sql } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// NPI validation via CMS NPI Registry API (public, no key required)
async function validateNPI(npi: string): Promise<{
  valid: boolean;
  name?: string;
  city?: string;
  state?: string;
  error?: string;
}> {
  try {
    const npiClean = npi.replace(/\D/g, '');
    if (npiClean.length !== 10) return { valid: false, error: 'NPI must be 10 digits' };
    if (!['1', '2'].includes(npiClean[0])) return { valid: false, error: 'NPI must start with 1 or 2' };

    const url = `https://npiregistry.cms.hhs.gov/api/?number=${npiClean}&version=2.1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout,
    });

    if (!res.ok) throw new Error(`CMS API returned ${res.status}`);

    const data = await res.json() as { results?: Array<{
      basic: { first_name?: string; last_name?: string; organization_name?: string };
      addresses: Array<{ city?: string; state?: string }>;
    }> };

    if (!data.results || data.results.length === 0) {
      return { valid: false, error: 'NPI not found in CMS Registry' };
    }

    const result = data.results[0];
    const name = result.basic.organization_name ||
      `${result.basic.first_name ?? ''} ${result.basic.last_name ?? ''}`.trim();

    return {
      valid: true,
      name,
      city: result.addresses[0]?.city,
      state: result.addresses[0]?.state,
    };
  } catch (err: any) {
    if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
      return { valid: false, error: 'CMS registry timed out — please try again' };
    }
    return { valid: false, error: 'Could not reach CMS NPI Registry' };
  }
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1');
    const pageSize = 50;
    const offset = (page - 1) * pageSize;

    // Find clinics with NPI set but not verified, or without NPI
    const [clinicsWithoutNPI, clinicsWithUnverifiedNPI, totalWithoutNPI, totalUnverified] = await Promise.all([
      db.select({
        id: clinics.id,
        name: clinics.name,
        city: clinics.city,
        state: clinics.state,
        npi: clinics.npi,
      }).from(clinics)
        .where(and(isNull(clinics.deletedAt), sql`${clinics.npi} IS NULL`))
        .limit(pageSize).offset(offset),

      db.select({
        id: clinics.id,
        name: clinics.name,
        city: clinics.city,
        state: clinics.state,
        npi: clinics.npi,
      }).from(clinics)
        .where(and(isNull(clinics.deletedAt), sql`${clinics.npi} IS NOT NULL`))
        .limit(pageSize).offset(0),

      db.select({ count: sql<number>`count(*)` }).from(clinics)
        .where(and(isNull(clinics.deletedAt), sql`${clinics.npi} IS NULL`)),

      db.select({ count: sql<number>`count(*)` }).from(clinics)
        .where(and(isNull(clinics.deletedAt), sql`${clinics.npi} IS NOT NULL`)),
    ]);

    return json({
      withoutNpi: clinicsWithoutNPI,
      withUnverifiedNpi: clinicsWithUnverifiedNPI.slice(0, 20),
      totalWithoutNpi: Number(totalWithoutNPI[0]?.count ?? 0),
      totalUnverified: Number(totalUnverified[0]?.count ?? 0),
      page,
    });
  } catch (err) {
    console.error('NPI queue error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json() as { npi?: string; clinicId?: string };

    if (body.npi) {
      // Validate a specific NPI
      const result = await validateNPI(body.npi);
      return json(result);
    }

    if (body.clinicId) {
      // Verify NPI for a specific clinic
      const [clinic] = await db.select({ id: clinics.id, npi: clinics.npi, name: clinics.name })
        .from(clinics).where(eq(clinics.id, body.clinicId)).limit(1);

      if (!clinic) return json({ error: 'Clinic not found' }, 404);
      if (!clinic.npi) return json({ valid: false, error: 'Clinic has no NPI set' });

      const result = await validateNPI(clinic.npi);
      if (result.valid) {
        await db.update(clinics).set({ verified: true }).where(eq(clinics.id, body.clinicId));
      }

      return json({ ...result, clinicId: body.clinicId, clinicName: clinic.name });
    }

    return json({ error: 'npi or clinicId required' }, 400);
  } catch (err) {
    console.error('NPI verify error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};