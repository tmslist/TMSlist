import type { APIRoute } from 'astro';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../../../db';
import { mediaLibrary, auditLog } from '../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { v2 as cloudinary } from 'cloudinary';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// GET: List media items
export const GET: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const folder = url.searchParams.get('folder') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const limit = Math.max(1, Math.min(parseInt(url.searchParams.get('limit') || '30'), 100));
    const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0'));

    const conditions = [];
    if (folder) conditions.push(eq(mediaLibrary.folder, folder));
    if (search) conditions.push(sql`${mediaLibrary.filename} ILIKE ${'%' + search + '%'}`);

    const items = await db.select().from(mediaLibrary)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${mediaLibrary.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return json({ data: items });
  } catch (err) {
    console.error('Media library error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// POST: Upload media
export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || '';
    const tags = formData.get('tags') as string || '';
    const altText = formData.get('alt_text') as string || '';

    if (!file) return json({ error: 'No file provided' }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const b64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: `tmslist/${folder || 'general'}`,
      resource_type: 'auto',
    });

    const [record] = await db.insert(mediaLibrary).values({
      filename: file.name,
      url: result.secure_url,
      mimeType: file.type,
      sizeBytes: result.bytes,
      folder,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : null,
      altText,
      width: result.width,
      height: result.height,
      uploadedBy: session.userId,
    }).returning();

    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'upload_media',
      entityType: 'media_library',
      entityId: record.id,
      details: { filename: file.name, folder },
    });

    return json({ success: true, media: record }, 201);
  } catch (err) {
    console.error('Upload media error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// PUT: Update media metadata
export const PUT: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return json({ error: 'Media ID required' }, 400);

    const allowed = ['folder', 'tags', 'altText'] as const;
    const safe: Record<string, unknown> = {};
    for (const k of allowed) {
      if (k in updates) safe[k] = updates[k];
    }

    await db.update(mediaLibrary).set(safe).where(eq(mediaLibrary.id, id));
    return json({ success: true });
  } catch (err) {
    console.error('Update media error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};

// DELETE: Remove media
export const DELETE: APIRoute = async ({ request, url }) => {
  const session = getSessionFromRequest(request);
  if (!session || !hasRole(session, 'admin')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'Media ID required' }, 400);

    const item = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, id)).limit(1);
    if (item[0]) {
      // Extract public_id from URL for Cloudinary deletion
      const urlParts = item[0].url.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex >= 0) {
        const publicId = urlParts.slice(uploadIndex + 1).join('/').replace(/\.[^.]+$/, '');
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch { /* ignore deletion failures */ }
      }
    }

    await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: 'delete_media',
      entityType: 'media_library',
      entityId: id,
    });

    return json({ success: true });
  } catch (err) {
    console.error('Delete media error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
