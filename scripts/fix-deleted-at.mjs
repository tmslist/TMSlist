import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL);

await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at timestamptz`;
await sql`ALTER TABLE leads   ADD COLUMN IF NOT EXISTS deleted_at timestamptz`;

const rows = await sql`
  select table_name, column_name, data_type
  from information_schema.columns
  where (table_name in ('reviews','leads')) and column_name = 'deleted_at'
`;
console.log("after alter:");
console.table(rows);
await sql.end();
