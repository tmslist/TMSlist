import type { APIRoute } from 'astro';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { doctors, doctorBoardCertifications, doctorMedicalLicenses } from '../../../db/schema';
import { getSessionFromRequest } from '../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: fetch own doctor profile
export const GET: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  if (!session.clinicId) return json({ error: 'No clinic linked' }, 404);

  try {
    const rows = await db.select().from(doctors).where(eq(doctors.clinicId, session.clinicId)).limit(1);
    if (!rows[0]) return json({ error: 'No doctor record found' }, 404);

    const [certs, licenses] = await Promise.all([
      db.select().from(doctorBoardCerts).where(eq(doctorBoardCerts.doctorId, rows[0].id)),
      db.select().from(doctorMedicalLicenses).where(eq(doctorMedicalLicenses.doctorId, rows[0].id)),
    ]);

    return json({ ...rows[0], certifications: certs, medicalLicenses: licenses });
  } catch (err) {
    console.error('Doctor profile GET error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: update own doctor profile
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  if (!session.clinicId) return json({ error: 'No clinic linked' }, 403);

  try {
    const body = await request.json();
    const { name, credential, title, school, yearsExperience, bio, specialties, imageUrl } = body;

    const rows = await db.select({ id: doctors.id }).from(doctors).where(eq(doctors.clinicId, session.clinicId)).limit(1);
    if (!rows[0]) return json({ error: 'No doctor record found' }, 404);

    await db.update(doctors).set({
      ...(name !== undefined && { name }),
      ...(credential !== undefined && { credential }),
      ...(title !== undefined && { title }),
      ...(school !== undefined && { school }),
      ...(yearsExperience !== undefined && { yearsExperience }),
      ...(bio !== undefined && { bio }),
      ...(specialties !== undefined && { specialties }),
      ...(imageUrl !== undefined && { imageUrl }),
      updatedAt: new Date(),
    }).where(eq(doctors.id, rows[0].id));

    return json({ success: true });
  } catch (err) {
    console.error('Doctor profile PUT error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
