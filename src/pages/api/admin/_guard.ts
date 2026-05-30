import { getSessionFromRequest, hasRole, hasPermission } from '../../../utils/auth';
import type { JWTPayload } from '../../../utils/auth';

export function adminGuard(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) return { error: 'Unauthorized', status: 401 };
  return { session };
}

export function requireRole(...roles: string[]) {
  return (request: Request): { session: JWTPayload } | { error: string; status: number } => {
    const { session } = adminGuard(request);
    if ('error' in session) return session;
    if (!hasRole(session, ...roles)) {
      return { error: 'Forbidden', status: 403 };
    }
    return { session };
  };
}

export function requirePermission(permission: string) {
  return (request: Request): { session: JWTPayload } | { error: string; status: number } => {
    const { session } = adminGuard(request);
    if ('error' in session) return session;
    if (!hasPermission(session, permission)) {
      return { error: 'Forbidden', status: 403 };
    }
    return { session };
  };
}
