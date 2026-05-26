import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { clinics } from '../../../../db/schema';
import { getSessionFromRequest, hasRole } from '../../../../utils/auth';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const GET: APIRoute = async () => {
  const templateHeaders = [
    'name', 'address', 'city', 'state', 'zip', 'phone', 'website',
    'email', 'description', 'lat', 'lng', 'npi', 'machines', 'specialties', 'insurances',
  ];
  const sampleRow = [
    'Acme TMS Clinic', '123 Main St', 'San Francisco', 'CA', '94102',
    '(415) 555-0100', 'https://acme-tms.com', 'contact@acme-tms.com',
    'Leading TMS therapy provider in the Bay Area.', '37.7749', '-122.4194',
    '1234567890', 'NeuroStar|BrainsWay', 'Depression|Anxiety|OCD',
    'Blue Cross Blue Shield|Aetna',
  ];
  const csv = [templateHeaders.join(','), sampleRow.join(',')].join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="clinic-import-template.csv"',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = getSessionFromRequest(request);
  if (!session) return json({ error: 'Unauthorized' }, 401);
  if (!hasRole(session, 'admin', 'editor')) return json({ error: 'Forbidden' }, 403);

  try {
    const { rows, mapping } = await request.json() as {
      headers: string[];
      rows: string[][];
      mapping: Record<string, string>;
    };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return json({ error: 'No rows to import' }, 400);
    }

    if (rows.length > 1000) {
      return json({ error: 'Maximum 1000 rows per import. Please split your file.' }, 400);
    }

    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const data: Record<string, unknown> = {};

      for (const [colIdx, field] of Object.entries(mapping)) {
        const val = row[parseInt(colIdx)]?.trim();
        if (!val) continue;

        if (['lat', 'lng', 'npi'].includes(field)) {
          data[field] = val;
        } else if (['machines', 'specialties', 'insurances'].includes(field)) {
          data[field] = val.split('|').map(s => s.trim()).filter(Boolean);
        } else {
          data[field] = val;
        }
      }

      if (!data.name || !data.city || !data.state) {
        errors.push(`Row ${i + 1}: missing required fields (name, city, or state)`);
        continue;
      }

      const nameStr = String(data.name);
      const timestamp = Date.now().toString(36);
      const slug = `${nameStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${timestamp}`;

      try {
        await db.insert(clinics).values({
          name: nameStr,
          address: data.address as string | undefined,
          city: String(data.city),
          state: String(data.state),
          zip: data.zip as string | undefined,
          phone: data.phone as string | undefined,
          website: data.website as string | undefined,
          email: data.email as string | undefined,
          description: data.description as string | undefined,
          slug,
          lat: data.lat ? String(data.lat) : undefined,
          lng: data.lng ? String(data.lng) : undefined,
          npi: data.npi ? String(data.npi) : undefined,
          machines: (data.machines as string[]) || [],
          specialties: (data.specialties as string[]) || [],
          insurances: (data.insurances as string[]) || [],
          createdBy: { name: 'CSV Import', source: 'import' },
        });
        imported++;
      } catch (insertErr: any) {
        if (insertErr?.code === '23505') {
          errors.push(`Row ${i + 1}: duplicate slug for "${nameStr}"`);
        } else {
          errors.push(`Row ${i + 1}: failed to insert`);
        }
      }
    }

    return json({ success: true, imported, errors: errors.slice(0, 20) });
  } catch (err) {
    console.error('CSV import error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
};
