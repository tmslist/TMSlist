import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { uploadDoctorPhoto, isCloudinaryConfigured } from '../../../utils/cloudinary';

export const prerender = false;

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!hasRole(session, 'admin', 'editor')) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (!isCloudinaryConfigured()) {
    return json({ error: 'Cloudinary is not configured on this server.' }, 503);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid form data' }, 400);
  }

  const file = formData.get('file') as File | null;
  const slug = (formData.get('slug') as string | null) || `doctor-${Date.now()}`;

  if (!file) {
    return json({ error: 'No file provided' }, 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return json({
      error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    }, 400);
  }

  if (file.size > MAX_SIZE_BYTES) {
    return json({
      error: `File too large. Maximum size is 2 MB. Received: ${(file.size / 1024 / 1024).toFixed(1)} MB`,
    }, 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadDoctorPhoto(buffer, slug);

    if (!result) {
      return json({ error: 'Upload to Cloudinary failed' }, 500);
    }

    return json({ url: result.url, publicId: result.publicId }, 201);
  } catch (err) {
    console.error('Doctor image upload error:', err);
    return json({ error: 'Upload failed. Please try again.' }, 500);
  }
};
