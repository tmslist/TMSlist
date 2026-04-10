import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { checkRateLimit } from '../../../utils/rateLimit';
import { z } from 'zod';

export const prerender = false;

const OPENROUTER_KEY = import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
const ANTHROPIC_KEY = import.meta.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

const generateSchema = z.object({
  type: z.enum(['city_roundup', 'insurance_guide', 'treatment_guide', 'research_summary', 'cost_guide']),
  city: z.string().optional(),
  state: z.string().optional(),
  insurance: z.string().optional(),
  condition: z.string().optional(),
  topic: z.string().optional(),
  clinicCount: z.number().optional(),
});

const PROMPTS: Record<string, string> = {
  city_roundup: `Write a comprehensive, SEO-optimized article about the best TMS therapy clinics in {city}, {state}. Include:
- H2: Overview of TMS therapy availability in {city}
- H2: Top {clinicCount} TMS Clinics in {city} (numbered list with brief descriptions)
- H2: Insurance coverage for TMS in {state}
- H2: What to expect from your first TMS appointment
- H2: FAQ (3-4 questions)
Format as HTML. Be factual, compassionate, and helpful. 800-1200 words.`,

  insurance_guide: `Write a detailed guide about {insurance} coverage for TMS therapy. Include:
- H2: Does {insurance} Cover TMS Therapy?
- H2: Eligibility Requirements
- H2: How to Get Prior Authorization
- H2: Out-of-Pocket Cost Estimates
- H2: What to Do If Your Claim Is Denied
- H2: FAQ
Format as HTML. Be specific and actionable. 800-1200 words.`,

  treatment_guide: `Write an evidence-based guide about TMS therapy for {condition}. Include:
- H2: Understanding {condition} and TMS
- H2: How TMS Works for {condition}
- H2: Clinical Evidence and Success Rates
- H2: What to Expect During Treatment
- H2: Side Effects and Risks
- H2: FAQ
Format as HTML. Cite FDA clearance status. Be factual. 800-1200 words.`,

  research_summary: `Write a research summary about the latest TMS therapy developments regarding {topic}. Include:
- H2: Key Findings
- H2: Clinical Implications
- H2: What This Means for Patients
Format as HTML. Be factual and reference recent studies. 500-800 words.`,

  cost_guide: `Write a comprehensive guide about TMS therapy costs in {state}. Include:
- H2: Average TMS Cost in {state}
- H2: Insurance Coverage Breakdown
- H2: Self-Pay Options and Discounts
- H2: Financing and Payment Plans
- H2: How to Reduce Your Out-of-Pocket Cost
Format as HTML. Include realistic price ranges. 600-1000 words.`,
};

/**
 * AI Blog Content Generator — admin only.
 * Generates SEO-optimized blog content using AI.
 */
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const blocked = await checkRateLimit(request, 'api');
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate topic length and strip HTML from all string inputs
    const stringFields = ['city', 'state', 'insurance', 'condition', 'topic'] as const;
    for (const field of stringFields) {
      const val = parsed.data[field];
      if (typeof val === 'string') {
        if (val.length > 500) {
          return new Response(JSON.stringify({ error: `${field} too long. Maximum 500 characters.` }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        (parsed.data as any)[field] = val.replace(/<[^>]*>/g, '');
      }
    }

    let prompt = PROMPTS[parsed.data.type] || PROMPTS.city_roundup;
    prompt = prompt
      .replace(/\{city\}/g, parsed.data.city || '')
      .replace(/\{state\}/g, parsed.data.state || '')
      .replace(/\{insurance\}/g, parsed.data.insurance || '')
      .replace(/\{condition\}/g, parsed.data.condition || '')
      .replace(/\{topic\}/g, parsed.data.topic || '')
      .replace(/\{clinicCount\}/g, String(parsed.data.clinicCount || 10));

    let content = '';

    // Try Anthropic first
    if (ANTHROPIC_KEY) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
            system: 'You are an expert medical content writer specializing in TMS therapy. Write accurate, compassionate, SEO-optimized content. Always include a disclaimer that this is informational content and patients should consult healthcare professionals.',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          content = data.content?.[0]?.text || '';
        }
      } catch { /* Anthropic unavailable — fall through to OpenRouter */ }
    }

    // Fallback to OpenRouter
    if (!content && OPENROUTER_KEY) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_KEY}`,
            'HTTP-Referer': 'https://tmslist.com',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-4-maverick:free',
            max_tokens: 4096,
            messages: [
              { role: 'system', content: 'You are an expert medical content writer specializing in TMS therapy.' },
              { role: 'user', content: prompt },
            ],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          content = data.choices?.[0]?.message?.content || '';
        }
      } catch { /* OpenRouter unavailable */ }
    }

    if (!content) {
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract title from first H1/H2
    const titleMatch = content.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : `TMS Therapy: ${parsed.data.type.replace(/_/g, ' ')}`;

    // Generate meta description
    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const metaDescription = plainText.substring(0, 155).replace(/\s+\S*$/, '') + '...';

    // Generate slug
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);

    return new Response(JSON.stringify({
      title,
      slug,
      metaDescription,
      content,
      type: parsed.data.type,
      generatedAt: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Blog generation error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
