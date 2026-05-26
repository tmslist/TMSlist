import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL);

const tables = ["clinics", "reviews", "leads", "users"];
for (const t of tables) {
  const rows = await sql`
    select column_name from information_schema.columns
    where table_name = ${t} and column_name = 'deleted_at'
  `;
  console.log(`${t}.deleted_at exists:`, rows.length > 0);
}
await sql.end();
