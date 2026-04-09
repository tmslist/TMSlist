import type { APIRoute } from 'astro';
import { autoVerifyDoctor, verifyNpi } from '../../../utils/npi';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { getCached, setCache } from '../../../utils/redis';
import { sql } from 'drizzle-orm';

export const prerender = false;

/**
 * Verify a doctor's credentials via the NPI Registry.
 * Can be triggered by admin or clinic owner.
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'clinic_owner', 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { doctorId, npiNumber, firstName, lastName, state, credential } = await request.json();

    // If NPI number provided, verify directly
    if (npiNumber) {
      const cacheKey = `npi:${npiNumber}`;
      const cached = await getCached<any>(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const result = await verifyNpi(npiNumber);
      if (!result) {
        return new Response(JSON.stringify({ verified: false, error: 'NPI number not found' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const response = { verified: result.status === 'active', npiData: result, confidence: 'high' };
      await setCache(cacheKey, response, 86400); // 24h cache

      // Update doctor record if doctorId provided
      if (doctorId) {
        try {
          await db.execute(sql`
            UPDATE doctors SET
              npi_number = ${npiNumber},
              npi_verified = true,
              npi_verified_at = now(),
              credential = COALESCE(${result.credential}, credential)
            WHERE id = ${doctorId}::uuid
          `);
        } catch {
          // Columns may not exist yet
        }
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Auto-verify by name + state
    if (!firstName || !lastName) {
      return new Response(JSON.stringify({ error: 'Provide npiNumber or firstName + lastName' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await autoVerifyDoctor({ firstName, lastName, state, credential });

    // Update doctor record
    if (doctorId && result.verified && result.npiData) {
      try {
        await db.execute(sql`
          UPDATE doctors SET
            npi_number = ${result.npiData.npi},
            npi_verified = true,
            npi_verified_at = now()
          WHERE id = ${doctorId}::uuid
        `);
      } catch {
        // Columns may not exist yet
      }
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('NPI verification error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
