#!/usr/bin/env node
// One-shot: apply drizzle/0012_saved_clinics_text_id.sql against the live DB.
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Prefer .env.local then .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFiles = ['.env.local', '.env'];
for (const f of envFiles) {
  const p = path.join(__dirname, '..', f);
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
    }
  }
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const sql = postgres(url, { max: 1, ssl: 'require' });

const migration = fs.readFileSync(
  path.join(__dirname, '..', 'drizzle', '0012_saved_clinics_text_id.sql'),
  'utf8'
);

const statements = migration
  .split('--> statement-breakpoint')
  .map(s => s.replace(/^\s*--.*$/gm, '').trim())
  .filter(Boolean);

try {
  for (const stmt of statements) {
    console.log('→', stmt.replace(/\s+/g, ' ').slice(0, 120));
    await sql.unsafe(stmt);
  }
  console.log('\n✅ saved_clinics migration applied.');
} catch (err) {
  console.error('❌', err.message);
  process.exit(1);
} finally {
  await sql.end();
}
