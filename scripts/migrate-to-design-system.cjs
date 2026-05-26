#!/usr/bin/env node
/**
 * Admin Design System Migration Script
 *
 * Automatically replaces hardcoded hex values with design system tokens
 * Usage: node scripts/migrate-to-design-system.cjs [--dry-run] [--verbose]
 */

const fs = require('fs');
const path = require('path');

// Color replacements map
const REPLACEMENTS = [
  // Old blue accent → Brand teal
  { from: '#4F7CFF', to: '#2E7A8F', description: 'Old accent → Brand teal' },
  { from: 'rgba(79,124,255,', to: 'rgba(46,122,143,', description: 'Old blue rgba → Teal rgba' },

  // Background colors
  { from: '#111418', to: 'var(--admin-bg-surface, #111418)', description: 'Use design token' },
  { from: '#161B22', to: 'var(--admin-bg-elevated, #161B22)', description: 'Use design token' },
  { from: '#1C2128', to: 'var(--admin-bg-overlay, #1C2128)', description: 'Use design token' },

  // Border colors
  { from: '#1E242C', to: 'var(--admin-border-subtle, #21262D)', description: 'Use design token' },
  { from: '#21262D', to: 'var(--admin-border-subtle, #21262D)', description: 'Use design token' },
  { from: '#30363D', to: 'var(--admin-border-default, #30363D)', description: 'Use design token' },
  { from: '#484F58', to: 'var(--admin-border-emphasis, #484F58)', description: 'Use design token' },

  // Text colors
  { from: '#E6EAF0', to: 'var(--admin-text-primary, #E6EDF3)', description: 'Use design token' },
  { from: '#E6EDF3', to: 'var(--admin-text-primary, #E6EDF3)', description: 'Use design token' },
  { from: '#9BA4B2', to: 'var(--admin-text-secondary, #8B949E)', description: 'Use design token' },
  { from: '#8B949E', to: 'var(--admin-text-secondary, #8B949E)', description: 'Use design token' },
  { from: '#6B7380', to: 'var(--admin-text-tertiary, #6E7681)', description: 'Use design token' },
  { from: '#6E7681', to: 'var(--admin-text-tertiary, #6E7681)', description: 'Use design token' },

  // Semantic colors
  { from: '#F87171', to: 'var(--admin-error, #F85149)', description: 'Error red' },
  { from: '#F85149', to: 'var(--admin-error, #F85149)', description: 'Use design token' },
  { from: '#3FB950', to: 'var(--admin-success, #3FB950)', description: 'Use design token' },
  { from: '#D29922', to: 'var(--admin-warning, #D29922)', description: 'Use design token' },
  { from: '#58A6FF', to: 'var(--admin-info, #58A6FF)', description: 'Use design token' },

  // Misc patterns
  { from: '#2A323C', to: 'var(--admin-border-default, #30363D)', description: 'Subtle divider' },
];

// Files/directories to skip
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'build'];

// Recursively find all TS/TSX/JS/JSX/ASTRO/CSS files
function findFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name) && !entry.name.startsWith('.')) {
        findFiles(fullPath, files);
      }
    } else if (/\.(tsx?|jsx?|astro|css)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function processFile(filePath, dryRun = false, verbose = false) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return { error: err.message };
  }

  const originalContent = content;
  let changes = [];

  for (const { from, to, description } of REPLACEMENTS) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const matches = content.match(regex);

    if (matches && matches.length > 0) {
      content = content.replace(regex, to);
      changes.push({ from, to, count: matches.length, description });
    }
  }

  if (changes.length > 0) {
    if (!dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    if (verbose) {
      console.log(`\n📄 ${filePath}`);
      changes.forEach(c => {
        console.log(`   • ${c.description}: ${c.count}x "${c.from}" → "${c.to}"`);
      });
    }
    return { file: filePath, changes };
  }

  return { skipped: true };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  console.log('\n🎨 Admin Design System Migration Script');
  console.log('='.repeat(50));

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }

  const allFiles = findFiles('src');

  console.log(`Found ${allFiles.length} files to check`);

  let processed = 0;
  let modified = 0;
  let errors = 0;
  const results = [];

  for (const file of allFiles) {
    processed++;
    const result = processFile(file, dryRun, verbose);
    if (result.error) {
      errors++;
      console.error(`❌ Error processing ${file}: ${result.error}`);
    } else if (!result.skipped) {
      modified++;
      results.push(result);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`Files checked: ${processed}`);
  console.log(`Files modified: ${modified}`);
  console.log(`Errors: ${errors}`);

  if (modified > 0 && dryRun) {
    console.log('\n⚠️  Run without --dry-run to apply changes');
  }

  if (results.length > 0) {
    console.log('\n📝 Modified files:');
    results.forEach(r => {
      console.log(`   • ${r.file} (${r.changes.length} change(s))`);
    });
  }

  console.log('\n✅ Migration complete!\n');
}

main();