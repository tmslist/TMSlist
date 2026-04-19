import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors, doctorEarnings, doctorExpenses, users, auditLog } from '../../../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function verifyDoctorAccess(session: Awaited<ReturnType<typeof getSessionFromRequest>>) {
  if (!session) return null;
  if (hasRole(session, 'admin')) return { isAdmin: true, userId: session.userId };

  const userRows = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = userRows[0];
  if (!user || !user.clinicId) return null;

  const doctorRows = await db.select().from(doctors).where(eq(doctors.clinicId, user.clinicId)).limit(1);
  if (doctorRows[0]) return { isAdmin: false, userId: session.userId, doctorId: doctorRows[0].id };
  return null;
}

async function logAudit(userId: string, action: string, entityType: string, entityId?: string, details?: Record<string, unknown>) {
  try {
    await db.insert(auditLog).values({ userId, action, entityType, entityId, details });
  } catch (err) {
    console.error('[audit] Failed to log:', err);
  }
}

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);

  try {
    let doctorId: string;
    if ('doctorId' in doctorCtx) {
      doctorId = doctorCtx.doctorId;
    } else {
      return json({ error: 'Doctor not found' }, 404);
    }

    const [earningsList, expensesList] = await Promise.all([
      db.select().from(doctorEarnings)
        .where(eq(doctorEarnings.doctorId, doctorId))
        .orderBy(desc(doctorEarnings.period)),

      db.select().from(doctorExpenses)
        .where(eq(doctorExpenses.doctorId, doctorId))
        .orderBy(desc(doctorExpenses.date)),
    ]);

    // Calculate totals
    const totalRevenue = earningsList.reduce((sum, e) => sum + Number(e.revenueGenerated ?? 0), 0);
    const totalSessions = earningsList.reduce((sum, e) => sum + Number(e.sessionsCompleted ?? 0), 0);
    const totalPatients = earningsList.reduce((sum, e) => sum + Number(e.patientsSeen ?? 0), 0);
    const totalExpenses = expensesList.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

    return json({
      earnings: earningsList,
      expenses: expensesList,
      summary: {
        totalRevenue,
        totalSessions,
        totalPatients,
        totalExpenses,
        netEarnings: totalRevenue - totalExpenses,
      },
    });
  } catch (err) {
    console.error('Doctor earnings GET error:', err);
    return json({ error: 'Failed to load earnings' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);

  try {
    const body = await request.json();
    const { action } = body;

    let doctorId: string;
    if ('doctorId' in doctorCtx) {
      doctorId = doctorCtx.doctorId;
    } else {
      return json({ error: 'Doctor not found' }, 404);
    }

    if (action === 'expense') {
      const { category, description, amount, date } = body;
      if (!category || !description || !amount) {
        return json({ error: 'category, description, and amount are required' }, 400);
      }

      const result = await db.insert(doctorExpenses).values({
        doctorId,
        category,
        description,
        amount: Math.round(amount), // cents
        date: date ? new Date(date) : new Date(),
      }).returning();

      await logAudit(doctorCtx.userId, 'create', 'doctor_expense', result[0].id);
      return json(result[0], 201);
    }

    if (action === 'earnings') {
      const { period, sessionsCompleted, patientsSeen, revenueGenerated } = body;
      if (!period) return json({ error: 'period is required (format: YYYY-MM)' }, 400);

      // Upsert earnings record
      const existing = await db.select().from(doctorEarnings)
        .where(and(eq(doctorEarnings.doctorId, doctorId), eq(doctorEarnings.period, period)))
        .limit(1);

      if (existing[0]) {
        const updateData: Record<string, unknown> = {};
        if (sessionsCompleted !== undefined) updateData.sessionsCompleted = sessionsCompleted;
        if (patientsSeen !== undefined) updateData.patientsSeen = patientsSeen;
        if (revenueGenerated !== undefined) updateData.revenueGenerated = revenueGenerated;

        const updated = await db.update(doctorEarnings)
          .set(updateData)
          .where(eq(doctorEarnings.id, existing[0].id))
          .returning();
        await logAudit(doctorCtx.userId, 'update', 'doctor_earnings', existing[0].id);
        return json(updated[0]);
      } else {
        const result = await db.insert(doctorEarnings).values({
          doctorId,
          period,
          sessionsCompleted: sessionsCompleted ?? 0,
          patientsSeen: patientsSeen ?? 0,
          revenueGenerated: revenueGenerated ?? 0,
        }).returning();
        await logAudit(doctorCtx.userId, 'create', 'doctor_earnings', result[0].id);
        return json(result[0], 201);
      }
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (err) {
    console.error('Doctor earnings POST error:', err);
    return json({ error: 'Failed to create record' }, 500);
  }
};
