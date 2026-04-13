/**
 * Create admin user in the database.
 * Usage: DATABASE_URL=... npx tsx scripts/create-admin.ts
 */
import postgres from 'postgres';
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
  const sql = postgres(DATABASE_URL!);

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    // Upsert: creates admin, or updates existing user's password + role to admin
    const result = await sql`
      INSERT INTO users (id, email, name, role, password_hash, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${email},
        ${name},
        'admin',
        ${passwordHash},
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        password_hash = ${passwordHash},
        updated_at = NOW()
      RETURNING id, email, role
    `;

    console.log(`✅ Admin user created/updated:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${result[0].role}`);
    console.log(`\n🔑 Log in at /admin/login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    sql.end();
  }
}

main();
