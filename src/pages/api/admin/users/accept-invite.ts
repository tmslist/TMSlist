import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { users, magicTokens } from '../../../../db/schema';
import { createSession, hashPassword } from '../../../../utils/auth';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { createHash } from 'crypto';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return json({ error: 'token and password are required' }, 400);
    }

    if (password.length < 8) {
      return json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Verify invite token
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const [invite] = await db.select().from(magicTokens)
      .where(and(
        eq(magicTokens.token, tokenHash),
        eq(magicTokens.purpose, 'invite'),
        isNull(magicTokens.usedAt),
        gt(magicTokens.expiresAt, new Date()),
      ))
      .limit(1);

    if (!invite) {
      return json({ error: 'Invalid or expired invitation' }, 400);
    }

    // Get invite metadata
    const metadata = (invite.metadata || {}) as {
      name?: string;
      role?: string;
      permissions?: {
        can_edit?: boolean;
        can_delete?: boolean;
        can_export?: boolean;
        can_manage_users?: boolean;
        can_billing?: boolean;
      };
    };

    // Create user account
    const hashedPassword = await hashPassword(password);
    const [user] = await db.insert(users).values({
      email: invite.email,
      name: metadata.name || 'New User',
      passwordHash: hashedPassword,
      role: (metadata.role as any) || 'editor',
      permissions: metadata.permissions,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      onboardingCompletedAt: new Date(),
    }).returning();

    // Mark token as used atomically
    await db.update(magicTokens)
      .set({ usedAt: new Date() })
      .where(eq(magicTokens.id, invite.id));

    // Create session for the new user
    const { cookie } = await createSession(
      { userId: user.id, email: user.email, role: user.role },
      {
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '',
      }
    );

    return new Response(JSON.stringify({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    });
  } catch (err) {
    console.error('Accept invite error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};