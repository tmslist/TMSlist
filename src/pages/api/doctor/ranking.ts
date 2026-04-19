import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors, doctorRankings, users } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

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

export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  const doctorCtx = await verifyDoctorAccess(session);
  if (!doctorCtx) return json({ error: 'Unauthorized' }, 401);
  try {
    let doctorId: string;
    if ('doctorId' in doctorCtx) doctorId = doctorCtx.doctorId;
    else return json({ error: 'Doctor not found' }, 404);
    const history = await db.select({
      rank: doctorRankings.rank,
      metric: doctorRankings.metric,
      recordedAt: doctorRankings.recordedAt,
    })
      .from(doctorRankings)
      .where(eq(doctorRankings.doctorId, doctorId))
      .orderBy(desc(doctorRankings.recordedAt));
    return json({
      currentRank: history[0]?.rank ?? null,
      history: history.map(r => ({
        rank: r.rank,
        metric: r.metric,
        recordedAt: r.recordedAt?.toISOString(),
      })),
    });
  } catch (err) { console.error(err); return json({ error: 'Failed to load ranking' }, 500); }
};
