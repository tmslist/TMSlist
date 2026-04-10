/**
 * Gemini API utility for image generation and content.
 * Uses Gemini's Imagen model for generating medical/wellness imagery.
 */

const GEMINI_API_KEY = import.meta.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

interface GeminiImageResponse {
  candidates?: {
    content: {
      parts: {
        inlineData?: {
          mimeType: string;
          data: string; // base64
        };
        text?: string;
      }[];
    };
  }[];
  error?: { message: string };
}

/**
 * Generate an image using Gemini's image generation capability.
 * Returns a base64-encoded image string or null on failure.
 */
export async function generateImage(prompt: string): Promise<{ base64: string; mimeType: string } | null> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set. Skipping image generation.');
    return null;
  }
  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            responseMimeType: 'image/png',
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: GeminiImageResponse = await response.json();

    if (data.error) {
      console.error('Gemini API error:', data.error.message);
      return null;
    }

    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return {
        base64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
      };
    }

    return null;
  } catch (err) {
    console.error('Gemini image generation failed:', err);
    return null;
  }
}

/**
 * Generate a city skyline/landmark illustration for location pages.
 */
export async function generateCityImage(city: string, state: string): Promise<string | null> {
  const prompt = `Create a clean, modern, minimalist watercolor-style illustration of the ${city}, ${state} city skyline. Use soft violet and blue tones. No text. White background. Medical wellness aesthetic. Professional and calming. Wide landscape aspect ratio.`;

  const result = await generateImage(prompt);
  if (result) {
    return `data:${result.mimeType};base64,${result.base64}`;
  }
  return null;
}

/**
 * Generate a treatment condition illustration.
 */
export async function generateTreatmentImage(condition: string): Promise<string | null> {
  const prompt = `Create a clean, modern, minimalist medical illustration representing ${condition} treatment with TMS therapy. Use soft violet, blue, and teal tones. Abstract brain or neural pathway imagery. No text. White background. Professional medical aesthetic. Square format.`;

  const result = await generateImage(prompt);
  if (result) {
    return `data:${result.mimeType};base64,${result.base64}`;
  }
  return null;
}

/**
 * Generate a hero background image for a page.
 */
export async function generateHeroImage(topic: string): Promise<string | null> {
  const prompt = `Create a wide, abstract, modern gradient background image for a medical wellness website about ${topic}. Soft flowing shapes in violet, blue, cyan, and white tones. Subtle neural network or brain wave pattern. No text. Minimalist and premium feel. Landscape format 16:9.`;

  const result = await generateImage(prompt);
  if (result) {
    return `data:${result.mimeType};base64,${result.base64}`;
  }
  return null;
}

/**
 * Generate text content using Gemini.
 */
export async function generateText(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set. Skipping text generation.');
    return null;
  }
  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}
