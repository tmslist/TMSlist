/**
 * Patches @tailwindcss/node to disable its ESM cache loader registration.
 * The ESM cache loader conflicts with Astro's prerendering chunked output,
 * causing "Cannot find module" errors during static builds.
 *
 * Run via: node scripts/patch-tailwind.cjs
 * Or automatically via the "postinstall" npm script.
 */
const fs = require('fs');
const path = require('path');

const files = [
  'node_modules/@tailwindcss/node/dist/index.mjs',
  'node_modules/@tailwindcss/node/dist/index.js',
];

let patched = 0;

for (const rel of files) {
  const abs = path.join(__dirname, '..', rel);
  if (!fs.existsSync(abs)) continue;

  let content = fs.readFileSync(abs, 'utf-8');

  // ESM version: if(!process.versions.bun){let e=...;ce.register?.(...)}
  const esmPattern = /if\(!process\.versions\.bun\)\{[^}]*register\?\.[^}]*\}/;
  if (esmPattern.test(content)) {
    content = content.replace(esmPattern, '/* esm-cache-loader disabled for Astro compat */');
    fs.writeFileSync(abs, content);
    patched++;
    continue;
  }

  // CJS version: process.versions.bun||_t.register?.(...)
  const cjsPattern = /process\.versions\.bun\|\|_t\.register\?\.\([^)]*\)/;
  if (cjsPattern.test(content)) {
    content = content.replace(cjsPattern, 'true /* esm-cache-loader disabled */');
    fs.writeFileSync(abs, content);
    patched++;
  }
}

if (patched > 0) {
  console.log(`Patched ${patched} @tailwindcss/node file(s) — ESM cache loader disabled`);
}
