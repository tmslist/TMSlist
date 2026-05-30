import { defineMiddleware } from 'astro:middleware';
import { getSessionFromRequest, hasRole } from '../utils/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;

  // Only intercept /api/admin/* routes
  if (!url.pathname.startsWith('/api/admin')) {
    return next();
  }

  const session = getSessionFromRequest(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const path = url.pathname;

  // Define role requirements per endpoint pattern
  const roleMap: Array<{ pattern: RegExp; roles: string[] }> = [
    // Users& sessions — admin only
    { pattern: /^\/api\/admin\/users/, roles: ['admin'] },
    { pattern: /^\/api\/admin\/sessions/, roles: ['admin'] },

    // Clinic management — admin or editor
    { pattern: /^\/api\/admin\/clinics/, roles: ['admin', 'editor'] },

    // Reviews & leads — admin or editor
    { pattern: /^\/api\/admin\/reviews/, roles: ['admin', 'editor'] },
    { pattern: /^\/api\/admin\/leads/, roles: ['admin', 'editor'] },

    // Billing — admin only
    { pattern: /^\/api\/admin\/billing/, roles: ['admin'] },
    { pattern: /^\/api\/admin\/invoicing/, roles: ['admin'] },

    // Content management — admin or editor
    { pattern: /^\/api\/admin\/blog/, roles: ['admin', 'editor'] },
    { pattern: /^\/api\/admin\/newsletter/, roles: ['admin', 'editor'] },

    // Settings — admin only
    { pattern: /^\/api\/admin\/settings/, roles: ['admin'] },

    // Dashboard analytics — admin or editor
    { pattern: /^\/api\/admin\/analytics/, roles: ['admin', 'editor'] },
  ];

  for (const { pattern, roles } of roleMap) {
    if (pattern.test(path)) {
      if (!hasRole(session, ...roles)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      break;
    }
  }

  return next();
});
