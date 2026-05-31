import type { APIRoute } from 'astro';
import { eq, desc, count, and, or, ilike, sql } from 'drizzle-orm';
import { db } from '../../../db';
import {
  doctors, users, subscriptions, clinics,
  sessions, clinicClaims, adminActionLog,
} from '../../../db/schema';
import { getSessionFromRequest, hasRole, createMagicToken, validateNPI } from '../../../utils/auth';
import { sendPasswordResetEmail } from '../../../utils/email';

const SITE_URL = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://tmslist.com';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const PLAN_OPTIONS = ['featured', 'premium', 'verified', 'pro', 'enterprise'] as const;
const STATUS_OPTIONS = ['active', 'canceled', 'past_due'] as const;
const ROLE_OPTIONS = ['admin', 'editor', 'viewer', 'clinic_owner', 'patient'] as const;

function generateToken(): string {
  return Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
}

// GET /api/admin/providers
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) return json({ error: 'Unauthorized' }, 401);

  try {
    const url = new URL(request.url);
    const singleId = url.searchParams.get('id');
    const activityUserId = url.searchParams.get('activity');

    // Activity log for a specific user
    if (activityUserId) {
      const logs = await db.select().from(adminActionLog)
        .where(eq(adminActionLog.userId, activityUserId))
        .orderBy(desc(adminActionLog.createdAt))
        .limit(50);
      return json({ logs });
    }

    // Single record fetch by id
    if (singleId) {
      const [row] = await db
        .select({
          doctor: doctors,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            clinicId: users.clinicId,
            emailVerified: users.emailVerified,
            npiNumber: users.npiNumber,
            failedLoginAttempts: users.failedLoginAttempts,
            lockedUntil: users.lockedUntil,
            lastLoginAt: users.lastLoginAt,
            createdAt: users.createdAt,
          },
          clinic: {
            id: clinics.id,
            name: clinics.name,
            city: clinics.city,
            state: clinics.state,
            verified: clinics.verified,
          },
          subscription: {
            id: subscriptions.id,
            plan: subscriptions.plan,
            status: subscriptions.status,
            currentPeriodEnd: subscriptions.currentPeriodEnd,
            stripeCustomerId: subscriptions.stripeCustomerId,
            stripeSubscriptionId: subscriptions.stripeSubscriptionId,
          },
        })
        .from(doctors)
        .leftJoin(users, eq(doctors.clinicId, users.clinicId))
        .leftJoin(clinics, eq(doctors.clinicId, clinics.id))
        .leftJoin(subscriptions, eq(doctors.clinicId, subscriptions.clinicId))
        .where(eq(doctors.id, singleId))
        .limit(1);

      if (!row) return json({ error: 'Provider not found' }, 404);
      return json({ provider: row });
    }

    const search = url.searchParams.get('search') || '';
    const plan = url.searchParams.get('plan') || '';
    const status = url.searchParams.get('status') || '';
    const clinicId = url.searchParams.get('clinicId') || '';
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '25'), 200));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));
    const sort = url.searchParams.get('sort') || 'createdAt';
    const order = url.searchParams.get('order') || 'desc';

    const conditions: ReturnType<typeof and>[] = [];
    if (search) {
      conditions.push(or(
        ilike(doctors.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.npiNumber, `%${search}%`),
      )!);
    }
    if (plan) conditions.push(sql`${subscriptions.plan} = ${plan}`);
    if (status) conditions.push(sql`${subscriptions.status} = ${status}`);
    if (clinicId) conditions.push(eq(doctors.clinicId, clinicId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sortCol = sort === 'name' ? doctors.name
      : sort === 'email' ? users.email
      : sort === 'plan' ? subscriptions.plan
      : sort === 'lastLogin' ? users.lastLoginAt
      : doctors.createdAt;

    const [countResult] = await db.select({ count: count() }).from(doctors).where(where);

    const rows = await db
      .select({
        doctor: doctors,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          clinicId: users.clinicId,
          emailVerified: users.emailVerified,
          npiNumber: users.npiNumber,
          failedLoginAttempts: users.failedLoginAttempts,
          lockedUntil: users.lockedUntil,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        },
        clinic: {
          id: clinics.id,
          name: clinics.name,
          city: clinics.city,
          state: clinics.state,
          verified: clinics.verified,
        },
        subscription: {
          id: subscriptions.id,
          plan: subscriptions.plan,
          status: subscriptions.status,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          stripeCustomerId: subscriptions.stripeCustomerId,
          stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        },
      })
      .from(doctors)
      .leftJoin(users, eq(doctors.clinicId, users.clinicId))
      .leftJoin(clinics, eq(doctors.clinicId, clinics.id))
      .leftJoin(subscriptions, eq(doctors.clinicId, subscriptions.clinicId))
      .where(where)
      .orderBy(order === 'asc' ? sortCol : desc(sortCol))
      .limit(limit).offset(offset);

    const allClinics = await db.select({ id: clinics.id, name: clinics.name, city: clinics.city })
      .from(clinics).orderBy(clinics.name).limit(200);

    return json({
      providers: rows,
      clinics: allClinics,
      total: Number(countResult?.count ?? 0),
      plans: PLAN_OPTIONS,
      statuses: STATUS_OPTIONS,
      roles: ROLE_OPTIONS,
    });
  } catch (err) {
    console.error('[/api/admin/providers GET]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST /api/admin/providers
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset-password') {
      const { userId, email } = body;
      if (!userId && !email) return json({ error: 'userId or email required' }, 400);
      const [user] = await db.select().from(users).where(email ? eq(users.email, email) : eq(users.id, userId!));
      if (!user) return json({ error: 'User not found' }, 404);
      const token = await createMagicToken(user.email, 'password-reset');
      const resetUrl = `${SITE_URL}/portal/reset-password?token=${token}`;
      await sendPasswordResetEmail({ to: user.email, resetUrl, userName: user.name || undefined });
      return json({ success: true, message: `Reset link sent to ${user.email}` });
    }

    if (action === 'change-plan') {
      const { doctorId, plan, status: subStatus } = body;
      if (!doctorId) return json({ error: 'doctorId required' }, 400);
      if (plan && !PLAN_OPTIONS.includes(plan)) return json({ error: 'Invalid plan' }, 400);
      if (subStatus && !STATUS_OPTIONS.includes(subStatus)) return json({ error: 'Invalid status' }, 400);
      const [doc] = await db.select({ clinicId: doctors.clinicId }).from(doctors).where(eq(doctors.id, doctorId));
      if (!doc) return json({ error: 'Doctor not found' }, 404);
      const updates: Record<string, unknown> = {};
      if (plan) updates.plan = plan;
      if (subStatus) updates.status = subStatus;
      const [updated] = await db.update(subscriptions).set(updates).where(eq(subscriptions.clinicId, doc.clinicId)).returning();
      return json({ subscription: updated });
    }

    if (action === 'claim-clinic') {
      const { doctorId, clinicId, verified } = body;
      if (!doctorId || !clinicId) return json({ error: 'doctorId and clinicId required' }, 400);
      await db.update(doctors).set({ clinicId }).where(eq(doctors.id, doctorId));
      // Upsert claim: update existing or insert new
      const existing = await db.select({ id: clinicClaims.id }).from(clinicClaims)
        .where(eq(clinicClaims.clinicId, clinicId)).limit(1);
      let claim;
      if (existing.length > 0) {
        [claim] = await db.update(clinicClaims).set({
          status: verified ? 'verified' : 'pending',
          verifiedAt: verified ? new Date() : null,
        }).where(eq(clinicClaims.id, existing[0].id)).returning();
      } else {
        [claim] = await db.insert(clinicClaims).values({
          clinicId,
          verificationToken: generateToken(),
          status: verified ? 'verified' : 'pending',
          verifiedAt: verified ? new Date() : null,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }).returning();
      }
      return json({ claim });
    }

    // Full create
    const {
      name, firstName, lastName, credential, title, school, yearsExperience,
      specialties, bio, imageUrl,
      email, role, npiNumber,
      clinicId: targetClinicId,
      plan, status: subStatus,
      newClinicName, newClinicCity, newClinicState,
    } = body;

    if (!name || !email) return json({ error: 'name and email are required' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Invalid email' }, 400);
    if (npiNumber && !validateNPI(npiNumber)) return json({ error: 'Invalid NPI number' }, 400);

    let resolvedClinicId = targetClinicId;
    if (!resolvedClinicId && newClinicName) {
      const slug = newClinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const [clinic] = await db.insert(clinics).values({ name: newClinicName, slug, city: newClinicCity || '', state: newClinicState || '', address: '' }).returning();
      resolvedClinicId = clinic.id;
    }
    if (!resolvedClinicId) return json({ error: 'clinicId or newClinicName required' }, 400);

    const [user] = await db.insert(users).values({
      email, name, role: role && ROLE_OPTIONS.includes(role) ? role : 'clinic_owner',
      clinicId: resolvedClinicId, emailVerified: true, emailVerifiedAt: new Date(),
      npiNumber: npiNumber || null,
    }).returning();

    const [doctor] = await db.insert(doctors).values({
      clinicId: resolvedClinicId, name,
      firstName: firstName || null, lastName: lastName || null,
      credential: credential || null, title: title || null, school: school || null,
      yearsExperience: yearsExperience ? Number(yearsExperience) : null,
      specialties: specialties || [], bio: bio || null, imageUrl: imageUrl || null,
    }).returning();

    let subscription = null;
    if (plan && PLAN_OPTIONS.includes(plan)) {
      [subscription] = await db.insert(subscriptions).values({
        clinicId: resolvedClinicId, plan,
        status: subStatus && STATUS_OPTIONS.includes(subStatus) ? subStatus : 'active',
      }).returning();
    }

    // Admin-created claim: skip email/verification token requirement
    await db.execute(sql`
      INSERT INTO clinic_claims (clinic_id, user_id, email, verification_token, status, verified_at, expires_at)
      VALUES (${resolvedClinicId}, ${user.id}, ${email}, ${generateToken()}, 'verified', NOW(), NOW() + INTERVAL '30 days')
      ON CONFLICT (clinic_id) DO UPDATE SET status = 'verified', verified_at = NOW(), user_id = EXCLUDED.user_id
    `);

    return json({ doctor, user, subscription, clinicId: resolvedClinicId }, 201);
  } catch (err) {
    console.error('[/api/admin/providers POST]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT /api/admin/providers
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const { doctorId, userId, subscriptionId, action } = body;

    if (action === 'reset-password') {
      const targetEmail = body.email || body.userEmail;
      if (!targetEmail) return json({ error: 'email required' }, 400);
      const [user] = await db.select().from(users).where(eq(users.email, targetEmail));
      if (!user) return json({ error: 'User not found' }, 404);
      const token = await createMagicToken(user.email, 'password-reset');
      const resetUrl = `${SITE_URL}/portal/reset-password?token=${token}`;
      await sendPasswordResetEmail({ to: user.email, resetUrl, userName: user.name || undefined });
      return json({ success: true, message: `Reset link sent to ${user.email}` });
    }

    if (action === 'toggle-lock') {
      const targetUserId = userId || body.targetUserId;
      if (!targetUserId) return json({ error: 'userId required' }, 400);
      const [user] = await db.select().from(users).where(eq(users.id, targetUserId));
      if (!user) return json({ error: 'User not found' }, 404);
      const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
      const [updated] = await db.update(users).set({
        lockedUntil: isLocked ? null : new Date(Date.now() + 15 * 60 * 1000),
        failedLoginAttempts: isLocked ? 0 : 5,
      }).where(eq(users.id, targetUserId)).returning();
      return json({ user: updated, locked: !isLocked });
    }

    if (action === 'change-plan') {
      const { plan, status: subStatus } = body;
      if (!plan || !PLAN_OPTIONS.includes(plan)) return json({ error: 'Invalid plan' }, 400);
      let targetSubId = subscriptionId;
      if (!targetSubId && doctorId) {
        const [doc] = await db.select({ clinicId: doctors.clinicId }).from(doctors).where(eq(doctors.id, doctorId));
        if (doc) {
          const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.clinicId, doc.clinicId));
          if (sub) targetSubId = sub.id;
        }
      }
      if (!targetSubId) return json({ error: 'No subscription found to update' }, 404);
      const [updated] = await db.update(subscriptions).set({
        plan, status: subStatus && STATUS_OPTIONS.includes(subStatus) ? subStatus : undefined,
      }).where(eq(subscriptions.id, targetSubId)).returning();
      return json({ subscription: updated });
    }

    if (doctorId) {
      const allowedDoctorFields = ['name', 'firstName', 'lastName', 'credential', 'title', 'school', 'yearsExperience', 'specialties', 'bio', 'imageUrl', 'clinicId'];
      const doctorUpdates: Record<string, unknown> = {};
      for (const field of allowedDoctorFields) {
        if (body[field] !== undefined) doctorUpdates[field] = body[field];
      }
      if (Object.keys(doctorUpdates).length > 0) {
        await db.update(doctors).set(doctorUpdates).where(eq(doctors.id, doctorId));
      }
    }

    if (userId) {
      const allowedUserFields = ['email', 'name', 'role', 'npiNumber', 'emailVerified'];
      const userUpdates: Record<string, unknown> = {};
      for (const field of allowedUserFields) {
        if (body[field] !== undefined) userUpdates[field] = body[field];
      }
      if (Object.keys(userUpdates).length > 0) {
        await db.update(users).set(userUpdates).where(eq(users.id, userId));
      }
    }

    if (subscriptionId) {
      const allowedSubFields = ['plan', 'status', 'stripeCustomerId', 'stripeSubscriptionId', 'currentPeriodEnd'];
      const subUpdates: Record<string, unknown> = {};
      for (const field of allowedSubFields) {
        if (body[field] !== undefined) subUpdates[field] = body[field];
      }
      if (Object.keys(subUpdates).length > 0) {
        await db.update(subscriptions).set(subUpdates).where(eq(subscriptions.id, subscriptionId));
      }
    }

    let doctor = null, user = null, subscription = null;
    if (doctorId) [doctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId));
    if (userId) [user] = await db.select().from(users).where(eq(users.id, userId));
    if (subscriptionId) [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId));

    return json({ doctor, user, subscription });
  } catch (err) {
    console.error('[/api/admin/providers PUT]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE /api/admin/providers
export const DELETE: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id || body.doctorId || body.userId;
    if (!id) return json({ error: 'id required' }, 400);

    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user) {
      await db.update(sessions).set({ revokedAt: new Date(), revokedBy: session.userId })
        .where(and(eq(sessions.userId, user.id), sql`revoked_at IS NULL`));
      await db.update(users).set({ deletedAt: new Date() }).where(eq(users.id, user.id));
      return json({ success: true });
    }

    const [doctor] = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.id, id));
    if (doctor) {
      await db.delete(doctors).where(eq(doctors.id, id));
      return json({ success: true });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    console.error('[/api/admin/providers DELETE]', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
