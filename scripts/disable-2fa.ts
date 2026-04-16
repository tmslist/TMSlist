/**
 * Disable 2FA for a user by email.
 * Usage: DATABASE_URL=... npx tsx scripts/disable-2fa.ts user@example.com
 */
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: npx tsx scripts/disable-2fa.ts user@example.com');
  process.exit(1);
}

async function main() {
  const sql = postgres(DATABASE_URL!);

  try {
    const result = await sql`
      UPDATE users
      SET totp_enabled = false, totp_secret = NULL, totp_verified_at = NULL, updated_at = NOW()
      WHERE email = ${email}
      RETURNING id, email, totp_enabled
    `;

    if (result.length === 0) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    console.log(`✅ 2FA disabled for: ${result[0].email}`);
    console.log(`   totp_enabled: ${result[0].totp_enabled}`);
  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    sql.end();
  }
}

main();
