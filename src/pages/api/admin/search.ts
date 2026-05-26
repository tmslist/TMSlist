import type { APIRoute } from 'astro';
import { ilike, or, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { clinics, doctors, users, leads, blogPosts } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth.js';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return json({ results: [] });

  const like = `%${q.replace(/[%_]/g, m => '\\' + m)}%`;
  const limit = 6;

  try {
    const [clinicRows, doctorRows, userRows, leadRows, postRows] = await Promise.all([
      db.select({ id: clinics.id, slug: clinics.slug, name: clinics.name, city: clinics.city, country: clinics.country })
        .from(clinics)
        .where(or(ilike(clinics.name, like), ilike(clinics.slug, like), ilike(clinics.city, like)))
        .limit(limit),
      db.select({ id: doctors.id, slug: doctors.slug, name: doctors.name, title: doctors.title })
        .from(doctors)
        .where(or(ilike(doctors.name, like), ilike(doctors.slug, like)))
        .limit(limit),
      db.select({ id: users.id, email: users.email, name: users.name, role: users.role })
        .from(users)
        .where(or(ilike(users.email, like), ilike(users.name, like)))
        .limit(limit),
      db.select({ id: leads.id, name: leads.name, email: leads.email, status: leads.status })
        .from(leads)
        .where(or(ilike(leads.name, like), ilike(leads.email, like)))
        .limit(limit),
      db.select({ id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title, status: blogPosts.status })
        .from(blogPosts)
        .where(or(ilike(blogPosts.title, like), ilike(blogPosts.slug, like)))
        .limit(limit),
    ]);

    const results = [
      ...clinicRows.map(r => ({
        type: 'clinic' as const,
        title: r.name,
        subtitle: [r.city, r.country].filter(Boolean).join(', '),
        href: `/admin/clinics?id=${r.id}`,
        publicHref: `/clinic/${r.slug}/`,
      })),
      ...doctorRows.map(r => ({
        type: 'doctor' as const,
        title: r.name,
        subtitle: r.title || 'Doctor',
        href: `/admin/doctors?id=${r.id}`,
        publicHref: r.slug ? `/doctor/${r.slug}/` : undefined,
      })),
      ...userRows.map(r => ({
        type: 'user' as const,
        title: r.name || r.email,
        subtitle: `${r.email} · ${r.role}`,
        href: `/admin/users?id=${r.id}`,
      })),
      ...leadRows.map(r => ({
        type: 'lead' as const,
        title: r.name || r.email,
        subtitle: `${r.email}${r.status ? ` · ${r.status}` : ''}`,
        href: `/admin/leads?id=${r.id}`,
      })),
      ...postRows.map(r => ({
        type: 'blog' as const,
        title: r.title,
        subtitle: `Blog · ${r.status || 'draft'}`,
        href: `/admin/blog?slug=${r.slug}`,
        publicHref: `/blog/${r.slug}/`,
      })),
    ];

    return json({ results });
  } catch (err) {
    console.error('admin search error', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
