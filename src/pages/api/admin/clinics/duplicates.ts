import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { clinics } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';
import { sql, eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async ({ url }) => {
  const session = getSessionFromRequest(url);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const threshold = parseInt(url.searchParams.get('threshold') ?? '2');

    // Find potential duplicates by matching on normalized name + same city + same state
    // Also detect by similar slug patterns
    const result = await db.execute(sql`
      SELECT
        c1.id AS id1, c1.name AS name1, c1.slug AS slug1, c1.city AS city1, c1.state AS state1,
        c1.address AS address1, c1.phone AS phone1, c1.website AS website1,
        c2.id AS id2, c2.name AS name2, c2.slug AS slug2, c2.city AS city2, c2.state AS state2,
        c2.address AS address2, c2.phone AS phone2, c2.website AS website2,
        GREATEST(
          CASE WHEN LOWER(c1.name) = LOWER(c2.name) THEN 3 ELSE 0 END +
          CASE WHEN c1.city = c2.city AND c1.state = c2.state THEN 2 ELSE 0 END +
          CASE WHEN SIMILARITY(c1.name, c2.name) > 0.7 THEN 2 ELSE 0 END +
          CASE WHEN c1.phone IS NOT NULL AND c1.phone = c2.phone THEN 3 ELSE 0 END +
          CASE WHEN c1.address IS NOT NULL AND c2.address IS NOT NULL AND
                   LEVENSHTEIN(LOWER(c1.address), LOWER(c2.address)) < 10 THEN 2 ELSE 0 END
        , 0) AS score
      FROM clinics c1
      JOIN clinics c2 ON c1.id < c2.id
      WHERE c1.deleted_at IS NULL AND c2.deleted_at IS NULL
        AND (
          LOWER(c1.name) = LOWER(c2.name)
          OR SIMILARITY(c1.name, c2.name) > 0.7
          OR (c1.phone IS NOT NULL AND c1.phone = c2.phone AND c1.phone != '')
          OR (c1.city = c2.city AND c1.state = c2.state AND
              LEVENSHTEIN(LOWER(c1.name), LOWER(c2.name)) < 5)
        )
      ORDER BY score DESC, c1.name
      LIMIT 100
    `);

    const rows = result.rows as Array<{
      id1: string; name1: string; slug1: string; city1: string; state1: string;
      address1: string | null; phone1: string | null; website1: string | null;
      id2: string; name2: string; slug2: string; city2: string; state2: string;
      address2: string | null; phone2: string | null; website2: string | null;
      score: number;
    }>;

    // Remove false positives that score below threshold
    const duplicates = rows.filter(r => r.score >= threshold);

    return json({ duplicates, total: duplicates.length });
  } catch (err) {
    // If pg_trgm extension not available, fall back to simple duplicate detection
    try {
      const allClinics = await db.select({
        id: clinics.id,
        name: clinics.name,
        slug: clinics.slug,
        city: clinics.city,
        state: clinics.state,
        address: clinics.address,
        phone: clinics.phone,
        website: clinics.website,
      }).from(clinics).where(sql`${clinics.deletedAt} IS NULL`);

      const duplicates: Array<{
        id1: string; name1: string; slug1: string; city1: string; state1: string;
        address1: string | null; phone1: string | null; website1: string | null;
        id2: string; name2: string; slug2: string; city2: string; state2: string;
        address2: string | null; phone2: string | null; website2: string | null;
        score: number;
      }> = [];

      for (let i = 0; i < allClinics.length; i++) {
        for (let j = i + 1; j < allClinics.length; j++) {
          const a = allClinics[i];
          const b = allClinics[j];
          let score = 0;
          if (a.name.toLowerCase() === b.name.toLowerCase()) score += 3;
          else continue; // only exact name matches for fallback
          if (a.city === b.city && a.state === b.state) score += 2;
          if (a.phone && a.phone === b.phone && a.phone !== '') score += 3;
          if (score >= threshold) {
            duplicates.push({
              id1: a.id, name1: a.name, slug1: a.slug, city1: a.city, state1: a.state,
              address1: a.address, phone1: a.phone, website1: a.website,
              id2: b.id, name2: b.name, slug2: b.slug, city2: b.city, state2: b.state,
              address2: b.address, phone2: b.phone, website2: b.website,
              score,
            });
          }
        }
      }

      return json({ duplicates, total: duplicates.length, fallback: true });
    } catch (fallbackErr) {
      console.error('Duplicate detection error:', err, fallbackErr);
      return json({ error: 'Failed to detect duplicates' }, 500);
    }
  }
};