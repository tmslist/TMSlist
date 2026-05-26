import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { users, auditLog } from '../../../db/schema';
import {
  getSessionFromRequest,
  verifyPassword,
  hashPassword,
  isPasswordStrongEnough,
  invalidateAllUserSessions,
} from '../../../utils/auth.js';
import { strictRateLimit, getClientIp } from '../../../utils/rateLimit.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  const ip = getClientIp(request);
  const rateLimited = await strictRateLimit(ip, 5, '15 m', 'auth:change-password');
  if (rateLimited) return rateLimited;

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const currentPassword = (body.currentPassword || '').trim();
  const newPassword = (body.newPassword || '').trim();

  if (!currentPassword || !newPassword) {
    return json({ error: 'Current and new password are required' }, 400);
  }
  if (!isPasswordStrongEnough(newPassword)) {
    return json(
      { error: 'Password must be at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters' },
      400,
    );
  }

  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) return json({ error: 'User not found' }, 404);

    const ok = await verifyPassword(currentPassword, user.passwordHash);
    if (!ok) return json({ error: 'Current password is incorrect' }, 400);

    const passwordHash = await hashPassword(newPassword);
    await db.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await invalidateAllUserSessions(user.id);

    await db.insert(auditLog).values({
      userId: user.id,
      action: 'change_password',
      entityType: 'user',
      entityId: user.id,
      details: { email: user.email, reason: 'self-service-change' },
    });

    return json({ success: true });
  } catch (err) {
    console.error('Change password error:', err);
    return json({ error: 'Failed to change password' }, 500);
  }
};
