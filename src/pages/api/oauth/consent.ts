import type { APIRoute } from 'astro';
import { getSessionFromRequest } from '../../../utils/auth';
import { randomBytes } from 'crypto';

export const prerender = false;

// In-memory store for authorization codes
// For production, use Supabase database or Redis
const authCodes = new Map<string, {
  clientId: string;
  userId: string;
  scope: string;
  expiresAt: number;
}>();

function generateCode(): string {
  return randomBytes(32).toString('hex');
}

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await request.formData();
  const action = formData.get('action') as string;

  // Handle cancel - redirect back to Supabase with error
  if (action !== 'approve') {
    const redirectUri = formData.get('redirect_uri') as string;
    const state = formData.get('state') as string;
    const params = new URLSearchParams({
      error: 'access_denied',
      state: state || '',
    });
    return new Response(null, {
      status: 302,
      headers: { Location: `${redirectUri}?${params}` },
    });
  }

  const clientId = formData.get('client_id') as string;
  const redirectUri = formData.get('redirect_uri') as string;
  const scope = formData.get('scope') as string;
  const state = formData.get('state') as string;

  if (!clientId || !redirectUri) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // Generate authorization code
  const code = generateCode();

  // Store code (expires in 10 minutes)
  authCodes.set(code, {
    clientId,
    userId: session.userId,
    scope,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  // Redirect back to Supabase's authorization callback with the code
  const params = new URLSearchParams({
    code,
    state: state || '',
  });

  return new Response(null, {
    status: 302,
    headers: { Location: `${redirectUri}?${params}` },
  });
};

// Export for token endpoint to use
export { authCodes };