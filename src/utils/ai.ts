/**
 * AI utilities using OpenRouter (free models).
 * Falls back gracefully when API key is not set.
 */

const OPENROUTER_KEY = import.meta.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Free models on OpenRouter
const MODEL = 'meta-llama/llama-4-maverick:free';

async function chat(systemPrompt: string, userMessage: string, maxTokens = 1024): Promise<string> {
  if (!OPENROUTER_KEY) return '';

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://tmslist.com',
      'X-Title': 'TMS List',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) return '';

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * AI Clinic Matcher — takes patient preferences and returns matching clinic recommendations.
 */
export async function matchClinics(input: {
  condition: string;
  location: string;
  insurance?: string;
  preferences?: string;
  clinicSummaries: { name: string; city: string; state: string; machines: string[]; specialties: string[]; insurances: string[]; rating: number }[];
}): Promise<string> {
  const clinicList = input.clinicSummaries
    .slice(0, 20)
    .map((c, i) => `${i + 1}. ${c.name} (${c.city}, ${c.state}) — Rating: ${c.rating}, Devices: ${c.machines.join(', ')}, Treats: ${c.specialties.join(', ')}, Insurance: ${c.insurances.slice(0, 5).join(', ')}`)
    .join('\n');

  const result = await chat(
    'You are a TMS therapy clinic advisor. Based on the patient\'s needs, recommend the best 3 clinics from the list and explain why each is a good match. Be concise and helpful. Format as a numbered list.',
    `Patient needs:
- Condition: ${input.condition}
- Location: ${input.location}
${input.insurance ? `- Insurance: ${input.insurance}` : ''}
${input.preferences ? `- Preferences: ${input.preferences}` : ''}

Available clinics:
${clinicList}

Provide your top 3 recommendations with brief explanations.`
  );

  return result || 'AI matching is not available right now. Please browse clinics manually.';
}

/**
 * AI Review Summarizer — summarize multiple reviews into key themes.
 */
export async function summarizeReviews(reviews: { rating: number; body: string }[]): Promise<string> {
  if (reviews.length === 0) return '';

  const reviewText = reviews
    .slice(0, 30)
    .map((r, i) => `Review ${i + 1} (${r.rating}★): ${r.body}`)
    .join('\n\n');

  return chat(
    'Summarize these TMS clinic reviews into 3-4 key themes. Be concise. Mention what patients love and any common concerns. Format as brief bullet points.',
    reviewText,
    512
  );
}

/**
 * AI Content Generator — generate SEO landing page content for a city/condition combo.
 */
export async function generateLandingContent(opts: {
  city: string;
  state: string;
  condition: string;
  clinicCount: number;
}): Promise<{ title: string; metaDescription: string; content: string }> {
  const fallback = {
    title: `TMS Therapy for ${opts.condition} in ${opts.city}, ${opts.state}`,
    metaDescription: `Find TMS therapy providers treating ${opts.condition} in ${opts.city}, ${opts.state}.`,
    content: '',
  };

  const result = await chat(
    'Generate SEO content for a TMS therapy landing page. Return JSON only with fields: title (under 60 chars), metaDescription (under 155 chars), content (2-3 paragraphs of HTML with H2/H3 headings, factual and helpful).',
    `City: ${opts.city}, ${opts.state}\nCondition: ${opts.condition}\nNumber of clinics: ${opts.clinicCount}`,
    1024
  );

  try {
    const jsonStr = result.match(/\{[\s\S]*\}/)?.[0] || '';
    return jsonStr ? JSON.parse(jsonStr) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * AI Symptom Checker — evaluate if someone is a TMS candidate.
 */
export async function checkTmsCandidate(answers: {
  condition: string;
  medicationsTried: number;
  severity: string;
  duration: string;
  age: string;
}): Promise<{ score: number; recommendation: string; nextSteps: string[] }> {
  const fallback = { score: 0, recommendation: 'AI evaluation unavailable. Please consult a TMS specialist.', nextSteps: ['Find a TMS clinic near you'] };

  const result = await chat(
    'Based on FDA guidelines for TMS therapy candidacy, evaluate this patient profile. Return JSON only with: score (1-10, 10 = strongest candidate), recommendation (one paragraph), nextSteps (array of 2-3 items). This is informational only, not medical advice. Always recommend consulting a professional.',
    `- Primary condition: ${answers.condition}\n- Medications tried: ${answers.medicationsTried}\n- Severity: ${answers.severity}\n- Duration: ${answers.duration}\n- Age group: ${answers.age}`,
    512
  );

  try {
    const jsonStr = result.match(/\{[\s\S]*\}/)?.[0] || '';
    return jsonStr ? JSON.parse(jsonStr) : fallback;
  } catch {
    return fallback;
  }
}
