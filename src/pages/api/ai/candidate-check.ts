import type { APIRoute } from 'astro';
import { checkTmsCandidate } from '../../../utils/ai';
import { checkRateLimit } from '../../../utils/rateLimit';
import { z } from 'zod';

export const prerender = false;

const candidateSchema = z.object({
  condition: z.string().min(2).max(200),
  medicationsTried: z.coerce.number().int().min(0).max(20),
  severity: z.enum(['mild', 'moderate', 'severe']),
  duration: z.string().max(100),
  age: z.string().max(50),
});

export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = candidateSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await checkTmsCandidate(parsed.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Candidate check error:', err);
    return new Response(JSON.stringify({ error: 'Evaluation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
