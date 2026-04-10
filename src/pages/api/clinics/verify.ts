import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { clinicClaims, clinics, users } from '../../../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword } from '../../../utils/auth';
import { checkRateLimit } from '../../../utils/rateLimit';

export const prerender = false;

export const GET: APIRoute = async ({ request, url, redirect }) => {
  const blocked = await checkRateLimit(request, 'form');
  if (blocked) return blocked;

  const token = url.searchParams.get('token');
  if (!token || token.length !== 64) {
    return redirect('/error?msg=invalid-token');
  }

  try {
    // Find valid, non-expired claim
    const claim = await db.select()
      .from(clinicClaims)
      .where(and(
        eq(clinicClaims.verificationToken, token),
        eq(clinicClaims.status, 'pending'),
        gt(clinicClaims.expiresAt, new Date()),
      ))
      .limit(1);

    if (!claim[0]) {
      return redirect('/error?msg=expired-or-invalid-token');
    }

    // Mark claim as verified
    await db.update(clinicClaims)
      .set({ status: 'verified', verifiedAt: new Date() })
      .where(eq(clinicClaims.id, claim[0].id));

    // Create or find user account for this email
    const existingUser = await db.select().from(users)
      .where(eq(users.email, claim[0].email)).limit(1);

    let userId: string;
    if (existingUser[0]) {
      userId = existingUser[0].id;
      // Update role to clinic_owner if not admin
      if (existingUser[0].role !== 'admin') {
        await db.update(users)
          .set({ role: 'clinic_owner', clinicId: claim[0].clinicId })
          .where(eq(users.id, existingUser[0].id));
      }
    } else {
      // Create new clinic_owner account with a readable temp password
      const rawPassword = `TMS-${crypto.randomUUID().slice(0, 8)}`;
      const tempPassword = await hashPassword(rawPassword);
      const newUser = await db.insert(users).values({
        email: claim[0].email,
        passwordHash: tempPassword,
        role: 'clinic_owner',
        clinicId: claim[0].clinicId,
      }).returning({ id: users.id });
      userId = newUser[0]!.id;

      // Send temp password to the clinic owner
      const { sendWelcomeEmail } = await import('../../../utils/email');
      sendWelcomeEmail(claim[0].email, rawPassword).catch((err) => console.error("[bg-task] Fire-and-forget failed:", err?.message));
    }

    // Update claim with userId
    await db.update(clinicClaims)
      .set({ userId })
      .where(eq(clinicClaims.id, claim[0].id));

    return redirect('/admin/login?verified=true');
  } catch (err) {
    console.error('Verification error:', err);
    return redirect('/error?msg=verification-failed');
  }
};
