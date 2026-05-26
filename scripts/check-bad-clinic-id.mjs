import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL);

const colInfo = await sql`
  select column_name, data_type, udt_name
  from information_schema.columns
  where table_name = 'users' and column_name = 'clinic_id'
`;
console.log("users.clinic_id type:", colInfo);

const u = await sql`select id, email, role, clinic_id::text as clinic_id from users where clinic_id is not null`;
console.log("users with clinic_id:");
console.table(u);

const c = await sql`select id::text as id, slug, name from clinics where id::text like 'import-%' limit 10`;
console.log("clinics with import- prefix:", c.length);
console.table(c);

const ct = await sql`select column_name, data_type, udt_name from information_schema.columns where table_name = 'clinics' and column_name = 'id'`;
console.log("clinics.id type:", ct);

await sql.end();
