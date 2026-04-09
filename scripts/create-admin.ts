/**
 * Create admin user in the database.
 * Usage: DATABASE_URL=... npx tsx scripts/create-admin.ts
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../src/db/schema';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const email = process.argv[2] || 'admin@tmslist.com';
const password = process.argv[3] || 'TmsList2026!';
const name = process.argv[4] || 'Admin';

async function main() {
  const sql = neon(DATABASE_URL!);
  const db = drizzle(sql);

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = await db.insert(users).values({
      email,
      passwordHash,
      name,
      role: 'admin',
    }).returning({ id: users.id, email: users.email });

    console.log(`✅ Admin user created:`);
    console.log(`   Email: ${email}`);
    console.log(`   ID: ${result[0]?.id}`);
    console.log(`\n⚠️  Change the default password after first login!`);
  } catch (err: any) {
    if (err.message?.includes('unique')) {
      console.log(`ℹ️  User ${email} already exists.`);
    } else {
      console.error('Error:', err.message);
    }
  }
}

main();
