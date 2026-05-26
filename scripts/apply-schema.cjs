// Apply schema additively: CREATE IF NOT EXISTS for tables/indexes,
// DO blocks for types, and tolerant FK adds. No drops, no alters of
// existing columns. Runs each statement in its own try/catch.
const fs = require('fs');
const postgres = require('postgres');

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) { console.error('no DATABASE_URL'); process.exit(1); }

const raw = fs.readFileSync('/tmp/full-schema.sql', 'utf8');

// Split on blank lines / semicolons at end of line.
const statements = raw
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0);

function rewrite(stmt) {
  // Add semicolon back
  if (!stmt.endsWith(';')) stmt += ';';

  if (/^CREATE TYPE\s/i.test(stmt)) {
    // Wrap in DO block ignoring duplicate_object
    return `DO $do$ BEGIN ${stmt.replace(/;$/, '')}; EXCEPTION WHEN duplicate_object THEN NULL; END $do$;`;
  }
  if (/^CREATE TABLE\s/i.test(stmt)) {
    return stmt.replace(/^CREATE TABLE\s/i, 'CREATE TABLE IF NOT EXISTS ');
  }
  if (/^CREATE\s+(UNIQUE\s+)?INDEX\s/i.test(stmt)) {
    return stmt.replace(/^CREATE\s+(UNIQUE\s+)?INDEX\s/i, (m, u) => `CREATE ${u || ''}INDEX IF NOT EXISTS `);
  }
  if (/^ALTER TABLE\s/i.test(stmt)) {
    // FK adds — use DO block to ignore "already exists" / "column doesn't exist" failures
    return `DO $do$ BEGIN ${stmt.replace(/;$/, '')}; EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN RAISE NOTICE 'skip: %', SQLERRM; END $do$;`;
  }
  return stmt;
}

(async () => {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  let ok = 0, skip = 0, fail = 0;
  for (const s of statements) {
    const rewritten = rewrite(s);
    try {
      await sql.unsafe(rewritten);
      ok++;
    } catch (e) {
      const msg = e.message || String(e);
      if (/already exists|duplicate/i.test(msg)) { skip++; continue; }
      fail++;
      const head = s.slice(0, 80).replace(/\s+/g, ' ');
      console.error(`FAIL: ${head}\n      ${msg}`);
    }
  }
  console.log(`\nDone. ok=${ok} skip=${skip} fail=${fail} total=${statements.length}`);
  await sql.end();
})();
