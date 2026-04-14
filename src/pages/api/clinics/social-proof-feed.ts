import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { leads, clinics } from '../../../db/schema';
import { desc, gte, isNotNull, eq } from 'drizzle-orm';

export const prerender = false;

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return '1 day ago';
}

export const GET: APIRoute = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentLeads = await db
      .select({
        name: leads.name,
        clinicId: leads.clinicId,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(gte(leads.createdAt, oneDayAgo))
      .orderBy(desc(leads.createdAt))
      .limit(10);

    // Get clinic cities for the leads that have clinicId
    const clinicIds = recentLeads
      .map((l) => l.clinicId)
      .filter((id): id is string => !!id);

    let clinicMap: Record<string, string> = {};
    if (clinicIds.length > 0) {
      const clinicRows = await db
        .select({ id: clinics.id, city: clinics.city })
        .from(clinics);
      clinicMap = Object.fromEntries(clinicRows.map((c) => [c.id, c.city]));
    }

    const feed = recentLeads
      .filter((l) => l.name) // must have a name
      .map((l) => {
        const firstName = (l.name || '').split(' ')[0];
        const city = l.clinicId ? clinicMap[l.clinicId] || 'your area' : 'your area';
        return {
          name: firstName,
          city,
          timeAgo: timeAgo(l.createdAt),
        };
      })
      .slice(0, 10);

    return new Response(JSON.stringify(feed), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    console.error('Social proof feed error:', err);
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
