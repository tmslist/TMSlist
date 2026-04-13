import type { APIRoute } from 'astro';
import { validateNPI } from '../../../utils/auth';
import { z } from 'zod';

export const prerender = false;

const NPI_REGISTRY_API = 'https://npiregistry.cms.hns.com/api/?number={NPI}&version=2.1';

const npiApiResponseSchema = z.object({
  result_count: z.number(),
  results: z.array(z.object({
    first_name: z.string(),
    last_name: z.string(),
    enumeration_type: z.string(),
    npi: z.string(),
    credential: z.string().optional(),
  })).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const npi = body.npi as string;

    if (!npi || typeof npi !== 'string') {
      return new Response(JSON.stringify({ error: 'NPI number is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Strip non-digits
    const cleanNpi = npi.replace(/\D/g, '');

    // Format validation
    if (!/^\d{10}$/.test(cleanNpi)) {
      return new Response(JSON.stringify({ error: 'NPI must be exactly 10 digits', code: 'INVALID_FORMAT' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Checksum validation
    if (!validateNPI(cleanNpi)) {
      return new Response(JSON.stringify({ error: 'Invalid NPI checksum — please check the number', code: 'INVALID_CHECKSUM' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify against NPPES registry
    try {
      const apiUrl = NPI_REGISTRY_API.replace('{NPI}', cleanNpi);
      const res = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (res.status === 200) {
        const data = await res.json();
        const parsed = npiApiResponseSchema.safeParse(data);

        if (parsed.success && parsed.data.result_count && parsed.data.results?.[0]) {
          const provider = parsed.data.results[0];
          return new Response(JSON.stringify({
            valid: true,
            verified: true,
            npi: cleanNpi,
            provider: {
              firstName: provider.first_name,
              lastName: provider.last_name,
              credential: provider.credential,
              type: provider.enumeration_type,
            },
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch {
      // NPPES API unavailable — accept checksum-valid NPIs
    }

    // NPPES check failed but checksum valid
    return new Response(JSON.stringify({
      valid: true,
      verified: false,
      npi: cleanNpi,
      note: 'NPI format valid but could not be verified against the registry. Please ensure it is correct.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('NPI lookup error:', err);
    return new Response(JSON.stringify({ error: 'Failed to verify NPI' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
