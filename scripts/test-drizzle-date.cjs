const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql, gte } = require('drizzle-orm');
const { leads } = require('../src/db/schema.ts');
const client = postgres(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);
(async () => {
  try {
    const since = new Date(Date.now() - 86400000);
    const r = await db.select({ c: sql`count(*)` }).from(leads).where(gte(leads.createdAt, since));
    console.log('OK', r);
  } catch(e) { console.error('FAIL', e.message); }
  await client.end();
})();
