import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { getSessionFromRequest, hasRole, createInviteToken } from '../../../../utils/auth';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin')) return json({ error: 'Forbidden' }, 403);

  try {
    const body = await request.json();
    const { email, name, role = 'editor', permissions = [] } = body;

    if (!email || !name) {
      return json({ error: 'email and name are required' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing) {
      return json({ error: 'User with this email already exists' }, 400);
    }

    // Create invite token with metadata
    const token = await createInviteToken(normalizedEmail, {
      name: name.trim(),
      role,
      permissions,
      invitedBy: session.userId,
    });

    // Send invite email
    const inviteUrl = `${process.env.SITE_URL || 'https://tmslist.com'}/admin/accept-invite?token=${token}`;
    const emailHtml = `
      <h1>You've been invited to join TMS List Admin</h1>
      <p>Hi ${name},</p>
      <p>You've been invited to join the TMS List admin panel as a <strong>${role}</strong>.</p>
      <p><a href="${inviteUrl}">Click here to accept your invitation and set your password</a></p>
      <p>This link expires in 7 days.</p>
    `;

    try {
      const { sendTransactionalEmail } = await import('../../../../utils/email');
      await sendTransactionalEmail({
        to: normalizedEmail,
        subject: 'You are invited to join TMS List Admin',
        html: emailHtml,
      });
    } catch (emailErr) {
      console.error('[admin/invite] Failed to send email:', emailErr);
      // Token was created — surface the error but don't block
      return json({ error: 'Invitation token created but email failed to send. Please try again.' }, 500);
    }

    return json({ success: true, message: 'Invitation sent' }, 201);
  } catch (err) {
    console.error('Invite error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
