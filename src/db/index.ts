import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use unpooled connection as primary — pooler may hit Neon free data transfer quota
const sql = postgres(
  import.meta.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL_UNPOOLED ||
  import.meta.env.DATABASE_URL || process.env.DATABASE_URL!,
  { max: 10, idle_timeout: 20, connect_timeout: 30 }
);

export const db = drizzle(sql, { schema });
export { sql };

export * from './schema';
