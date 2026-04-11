import postgres from 'postgres';
import { readFileSync } from 'fs';

// Load .env manually
const envFile = readFileSync('.env', 'utf-8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^(\w+)=["']?(.+?)["']?$/);
  if (match) process.env[match[1]] = match[2];
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function main() {
  try {
    const result = await sql`SELECT current_database() as db, count(*)::int as tables FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Connected:', result);

    const tableList = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('Tables:', tableList.map(r => r.table_name));
  } catch (e: any) {
    console.error('Connection error:', e.message);
  } finally {
    await sql.end();
  }
}

main();
