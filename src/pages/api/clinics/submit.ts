import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinics } from '../../../db/schema';
import { clinicSubmitSchema } from '../../../db/validation';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = clinicSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { submitterName, submitterEmail, ...clinicData } = parsed.data;
    const slug = `${clinicData.name}-${clinicData.city}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const result = await db.insert(clinics).values({
      ...clinicData,
      slug,
      verified: false,
      createdBy: {
        name: submitterName,
        email: submitterEmail,
        submitted_at: new Date().toISOString(),
        source: 'website_form' as const,
      },
    }).returning({ id: clinics.id, slug: clinics.slug });

    return new Response(JSON.stringify({ success: true, clinic: result[0] }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Clinic submit error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
