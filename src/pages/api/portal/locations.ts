import type { APIRoute } from 'astro';
import { validateSessionStrict } from '../../../utils/auth';
import { db } from '../../../db';
import { locations, users } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';
import { checkLocationLimit } from '../../../db/subscriptions';

export const prerender = false;

async function getUserClinicId(userId: string): Promise<string | null> {
  const rows = await db.select({ clinicId: users.clinicId }).from(users).where(eq(users.id, userId)).limit(1);
  return rows[0]?.clinicId || null;
}

// Allowed fields for location updates
const ALLOWED_FIELDS = [
  'name', 'address', 'city', 'state', 'zip', 'country',
  'lat', 'lng', 'phone', 'email', 'openingHours', 'isActive',
] as const;

// GET /api/portal/locations — list all locations for user's clinic
export const GET: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const clinicId = await getUserClinicId(session.userId);
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rows = await db
      .select()
      .from(locations)
      .where(and(eq(locations.clinicId, clinicId), eq(locations.isActive, true)))
      .orderBy(locations.createdAt);

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal locations GET error:', err);
    return new Response(JSON.stringify({ error: 'Failed to load locations' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/portal/locations — create a new location
export const POST: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const clinicId = await getUserClinicId(session.userId);
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check location limit
    const existingLocations = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.clinicId, clinicId), eq(locations.isActive, true)));

    const limitCheck = await checkLocationLimit(clinicId, existingLocations.length);
    if (!limitCheck.allowed) {
      return new Response(JSON.stringify({
        error: 'Location limit reached',
        message: `Your ${limitCheck.limit === 0 ? 'current plan does not support additional locations' : `plan allows up to ${limitCheck.limit} additional location${limitCheck.limit === 1 ? '' : 's'}`}. Upgrade to unlock more.`,
        limit: limitCheck.limit,
        current: limitCheck.current,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    // Build insert data from allowed fields
    const insertData: Record<string, unknown> = { clinicId };
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        insertData[field] = body[field];
      }
    }

    const [created] = await db.insert(locations).values(insertData).returning();

    return new Response(JSON.stringify(created), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal locations POST error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create location' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// PUT /api/portal/locations?id=xxx — update a location
export const PUT: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const clinicId = await getUserClinicId(session.userId);
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const locationId = url.searchParams.get('id');
    if (!locationId) {
      return new Response(JSON.stringify({ error: 'Location ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify location belongs to user's clinic
    const [existing] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, locationId), eq(locations.clinicId, clinicId)))
      .limit(1);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    await db.update(locations).set(updateData).where(eq(locations.id, locationId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal locations PUT error:', err);
    return new Response(JSON.stringify({ error: 'Failed to update location' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/portal/locations?id=xxx — soft-delete a location
export const DELETE: APIRoute = async ({ request }) => {
  const session = await validateSessionStrict(request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const clinicId = await getUserClinicId(session.userId);
    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'No clinic linked' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const locationId = url.searchParams.get('id');
    if (!locationId) {
      return new Response(JSON.stringify({ error: 'Location ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify location belongs to user's clinic
    const [existing] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, locationId), eq(locations.clinicId, clinicId)))
      .limit(1);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Location not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Soft delete
    await db.update(locations).set({ isActive: false, updatedAt: new Date() }).where(eq(locations.id, locationId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Portal locations DELETE error:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete location' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
