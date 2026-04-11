import type { APIRoute } from 'astro';
import { checkRateLimit } from '../../../utils/rateLimit';

export const prerender = false;

const OPENROUTER_KEY = import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
const ANTHROPIC_KEY = import.meta.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

const TMS_SYSTEM_PROMPT = `You are the TMS List Treatment Advisor, an AI assistant specializing in Transcranial Magnetic Stimulation (TMS) therapy. You help patients understand TMS and find the right treatment.

IMPORTANT RULES:
- You are NOT a doctor. Always recommend consulting a healthcare professional for medical decisions.
- Be compassionate, clear, and evidence-based.
- Focus on FDA-cleared indications (depression, OCD) while acknowledging off-label uses.
- When asked about costs, reference typical ranges: $200-$400/session, 36 sessions standard course, most insurance covers it after 2-4 failed medications.
- When asked about clinics, recommend they use tmslist.com/map to find nearby providers.
- Keep responses concise (2-3 paragraphs max).
- If someone seems in crisis, provide the 988 Suicide & Crisis Lifeline number.

KEY TMS FACTS:
- FDA-cleared for treatment-resistant depression (2008) and OCD (2018)
- 50-60% of patients achieve significant improvement, 30% achieve full remission
- Standard course: 36 sessions over 6-8 weeks, 19-minute sessions with TBS protocol
- Side effects are mild: headache, scalp discomfort (no systemic side effects)
- Non-invasive, no anesthesia, patients drive themselves home
- Main devices: NeuroStar, BrainsWay (deep TMS), MagVenture, CloudTMS
- Insurance criteria: typically requires 2-4 failed antidepressant trials
- NOT suitable for: patients with metal implants in head, seizure disorders, or certain medical devices`;

export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkRateLimit(request, 'api');
  if (blocked) return blocked;

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate and sanitize input: max 2000 chars per message, strip HTML tags
    for (const msg of messages) {
      if (typeof msg.content !== 'string') continue;
      if (msg.content.length > 2000) {
        return new Response(JSON.stringify({ error: 'Message too long. Maximum 2000 characters.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      msg.content = msg.content.replace(/<[^>]*>/g, '');
    }

    // Limit conversation history to last 10 messages
    const recentMessages = messages.slice(-10);

    // Try Anthropic first, fall back to OpenRouter
    if (ANTHROPIC_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: TMS_SYSTEM_PROMPT,
          messages: recentMessages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.content?.[0]?.text || 'I apologize, I could not generate a response. Please try again.';
        return new Response(JSON.stringify({ message: content }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Fallback to OpenRouter
    if (OPENROUTER_KEY) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
          'HTTP-Referer': 'https://tmslist.com',
          'X-Title': 'TMS List Chatbot',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-maverick:free',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: TMS_SYSTEM_PROMPT },
            ...recentMessages,
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        return new Response(JSON.stringify({ message: content }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ message: 'AI advisor is temporarily unavailable. Please browse our FAQ at tmslist.com/questions or call a clinic directly.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('AI chat error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
