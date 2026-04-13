import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../utils/auth';

export const prerender = false;

// Max 5MB
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor', 'clinic_owner')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (file.size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large (max 5MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type. Use JPEG, PNG, WebP, or AVIF.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // When BLOB_READ_WRITE_TOKEN is configured, use Vercel Blob
    // For now, return a placeholder response indicating upload capability
    const blobToken = import.meta.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      // Dynamic import to avoid build errors when token is not set
      const { put } = await import('@vercel/blob');
      // Sanitize filename to prevent path traversal and injection attacks
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 200);
      const blob = await put(safeName, file, {
        access: 'public',
        token: blobToken,
      });
      return new Response(JSON.stringify({ url: blob.url }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fallback: store locally (dev mode)
    return new Response(JSON.stringify({
      error: 'Image upload requires BLOB_READ_WRITE_TOKEN. Set up Vercel Blob storage.',
    }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
