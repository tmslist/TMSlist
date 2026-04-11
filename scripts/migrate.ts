import { execSync } from 'child_process';
console.log('Running database migrations...');
try { execSync('npx drizzle-kit push', { stdio: 'inherit' }); console.log('Done.'); }
catch (e) { console.error('Migration failed:', e); process.exit(1); }
