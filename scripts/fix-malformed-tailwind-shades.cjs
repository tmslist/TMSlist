#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TARGET = '#1B4B5A';
const TEAL_DARK = '#143844';
const TEAL_LIGHT = '#5BA8BD';

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.astro']);

function findFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP.has(e.name) && !e.name.startsWith('.')) findFiles(p, out);
    } else if (/\.(astro|tsx?|jsx?)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

function shadeToOpacity(shade) {
  const s = parseInt(shade, 10);
  if (s <= 50) return '/10';
  if (s <= 100) return '/15';
  if (s <= 200) return '/20';
  if (s <= 300) return '/30';
  if (s <= 400) return '/50';
  return '';
}

function isDarkShade(shade) {
  return parseInt(shade, 10) >= 700;
}

function isLightShade(shade) {
  return parseInt(shade, 10) <= 300;
}

function fixText(prefix, shade, attrLine) {
  // Detect if this text sits on a dark teal background within the same class string
  const onDarkBg = /bg-\[#1B4B5A\](?![\/0-9])|bg-\[#143844\]|bg-\[#0F2A36\]|bg-\[#1B4B5A\][6789]00|bg-\[#1B4B5A\]\/(?:[6-9]\d|100)/.test(attrLine);
  if (isLightShade(shade) && onDarkBg) {
    return `${prefix}text-white/80`;
  }
  if (isDarkShade(shade)) {
    return `${prefix}text-[${TEAL_DARK}]`;
  }
  if (isLightShade(shade) && prefix.includes('hover:')) {
    return `${prefix}text-[${TEAL_LIGHT}]`;
  }
  return `${prefix}text-[${TARGET}]`;
}

function fixGeneric(util, shade) {
  if (isDarkShade(shade)) {
    return `${util}-[${TEAL_DARK}]`;
  }
  const op = shadeToOpacity(shade);
  return `${util}-[${TARGET}]${op}`;
}

const TEXT_RE = /\b((?:[a-z-]+:)*)text-\[#1B4B5A\](\d{2,3})\b/g;
const GENERIC_RE = /\b((?:[a-z-]+:)?(?:bg|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret|accent|decoration|shadow))-\[#1B4B5A\](\d{2,3})\b/g;

function fixContent(content) {
  let changed = 0;
  // Process text- with line context
  content = content.replace(/^.*$/gm, (line) => {
    return line
      .replace(TEXT_RE, (m, prefix, shade) => {
        changed++;
        return fixText(prefix, shade, line);
      })
      .replace(GENERIC_RE, (m, util, shade) => {
        changed++;
        return fixGeneric(util, shade);
      });
  });
  return { content, changed };
}

function main() {
  const files = findFiles('src');
  let totalFiles = 0;
  let totalReplacements = 0;
  for (const f of files) {
    const orig = fs.readFileSync(f, 'utf8');
    if (!orig.includes('[#1B4B5A]')) continue;
    const { content, changed } = fixContent(orig);
    if (changed > 0 && content !== orig) {
      fs.writeFileSync(f, content);
      totalFiles++;
      totalReplacements += changed;
      console.log(`✓ ${f} (${changed})`);
    }
  }
  console.log(`\nFixed ${totalReplacements} occurrences across ${totalFiles} files.`);
}

main();
