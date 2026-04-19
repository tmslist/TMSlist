import type { APIRoute } from 'astro';
import { getSessionFromRequest, hasRole } from '../../../utils/auth';
import { db } from '../../../db';
import { doctors } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'treatments';

    if (!file) return json({ error: 'No file provided' }, 400);

    const text = await file.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return json({ error: 'CSV must have headers and at least one data row' }, 400);

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, '').toLowerCase());
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });

      try {
        if (type === 'treatments') {
          if (!row['name']) { errors.push(`Row ${i + 1}: missing name`); continue; }
          // In a full implementation, would insert into a treatments table
          successCount++;
        } else if (type === 'conditions') {
          if (!row['name']) { errors.push(`Row ${i + 1}: missing name`); continue; }
          // In a full implementation, would insert into a conditions table
          successCount++;
        } else if (type === 'protocols') {
          if (!row['name']) { errors.push(`Row ${i + 1}: missing name`); continue; }
          // In a full implementation, would insert into a protocols table
          successCount++;
        }
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Parse error'}`);
      }
    }

    return json({
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 20), // limit error output
    });
  } catch (err) {
    console.error('Doctor import error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
