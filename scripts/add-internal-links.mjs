#!/usr/bin/env node
/**
 * add-internal-links.mjs
 * Adds 8-10 contextual internal links to all blog posts that are underlinked.
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BLOG_DIR = join(ROOT, 'src/content/blog');

// Linkable blog slugs
const BLOG_LINKS = [
  'tms-for-anxiety-fda-breakthrough',
  'tms-for-depression',
  'tms-vs-medication',
  'tms-vs-ect-comparing-brain-stimulation',
  'tms-vs-ect-comparison-guide',
  'theta-burst-vs-standard-tms',
  'theta-burst-stimulation-ibs-tms',
  'choosing-tms-clinic-red-flags',
  'how-to-prepare-for-tms',
  'combining-tms-with-therapy',
  'real-cost-of-tms-therapy-2026',
  'tms-cost-insurance-guide-2026',
  'tms-cost-insurance-denied-appeal',
  'going-back-to-work-during-tms',
  'what-tms-actually-feels-like',
  'what-to-expect-first-tms-session',
  'preparing-for-first-tms-session',
  'how-long-does-tms-last',
  'tms-side-effects-headache',
  'tms-side-effects-complete-guide',
  'does-tms-cause-memory-loss',
  'can-i-drive-after-tms',
  'maintenance-tms-guide',
  'ai-guided-tms-targeting-2026',
  'combining-tms-with-therapy',
  'tms-for-ptsd',
  'tms-for-ocd-deep-tms-results',
  'tms-for-bipolar-depression',
  'tms-for-veterans-va-coverage',
  'tms-during-pregnancy-safety-data',
  'tms-for-postpartum-depression',
  'tms-for-insomnia',
  'tms-for-migraine',
  'tms-for-adolescents',
  'tms-for-ocd-versus-medication',
  'tms-for-panic-disorder',
  'tms-for-treatment-resistant-depression',
  'deep-tms-vs-standard-tms-comparison',
  'tms-neuroplasticity-rewiring-mental-health',
  'what-is-mapping-session',
  'understanding-tms-motor-threshold',
  'tms-success-rates-2026',
  'what-affects-tms-success',
  'tms-depression-relapse-signs',
  'tms-booster-sessions-maintenance-gains',
  'tms-booster-sessions-maintenance-protocols',
  'stanford-neuromodulation-therapy-snt-2026',
  'tms-physics-neuroscience-magnetic-fields',
  'history-of-tms-from-faraday-to-fda',
  'at-home-tms-devices-effectiveness',
  'tms-at-home-devices-2026',
  'tms-insurance-appeals-complete-guide',
  'tms-covered-by-medicare-2026-update',
  'how-to-find-tms-clinic-guide',
  'questions-to-ask-tms-clinic',
  'tms-vs-rtms-terminology-explained',
  'tms-vs-deep-brain-stimulation',
  'tms-for-social-anxiety',
  'tms-for-smoking-cessation',
  'tms-for-stroke-rehabilitation',
  'tms-for-parkinsons',
  'tms-for-tinnitus',
  'tms-for-multiple-sclerosis',
  'tms-for-autism-spectrum',
  'tms-for-alzheimers',
  'tms-for-chronic-pain',
  'tms-for-eating-disorders',
  'tms-for-fibromyalgia',
  'tms-for-binge-eating-disorder',
  'tms-for-first-responders-trauma',
  'tms-for-healthcare-workers-burnout',
  'tms-for-graduate-students-academia',
  'tms-for-athletes-performance-mental-health',
  'tms-for-older-adults-geriatric-depression',
  'tms-for-preterm-labor-stress',
  'tms-for-suicidal-ideation',
  'tms-in-children-and-adolescents-fda',
  'tms-in-europe-vs-us',
  'tms-industry-lobbying-advocacy',
  'tms-and-ketamine-together',
  'tms-and-alcohol',
  'tms-and-sleep-quality-outcomes',
  'tms-and-psychotherapy-combination',
  'tms-and-cognitive-function',
  'tms-and-exercise-physical-activity',
  'tms-and-genetics-response-prediction',
  'tms-and-meditation-mindfulness',
  'tms-and-weight-changes',
  'tms-for-veterans-ptsd-military',
  'neurostar-tms-device-review-2026',
  'brainsway-deep-tms-comprehensive-guide',
  'magventure-tms-device-overview',
];

// Link templates per category
const SITE_LINKS = [
  { text: 'take our TMS candidate quiz', url: '/quiz/' },
  { text: 'find a TMS clinic near you', url: '/clinic/' },
  { text: 'search for TMS specialists', url: '/specialists/' },
  { text: 'find TMS providers in your area', url: '/near-me/' },
  { text: 'browse TMS treatment comparisons', url: '/treatments/' },
  { text: 'check your insurance coverage', url: '/insurance/' },
  { text: 'compare TMS clinics', url: '/compare-clinics/' },
  { text: 'view our complete insurance guide', url: '/blog/tms-cost-insurance-guide-2026/' },
  { text: 'read our TMS success rates guide', url: '/blog/tms-success-rates-2026/' },
  { text: 'learn about TMS vs medications', url: '/blog/tms-vs-medication/' },
  { text: 'understand TMS side effects', url: '/blog/tms-side-effects-complete-guide/' },
  { text: 'prepare for your first TMS session', url: '/blog/how-to-prepare-for-tms/' },
  { text: 'find answers to common TMS questions', url: '/quiz/' },
];

function getRelatedBlogLinks(topic, existingLinks) {
  const topicLower = topic.toLowerCase();
  const links = [];
  const usedSlugs = new Set(existingLinks.map(l => l.split('/').pop().replace('/', '')));

  // Find relevant blog posts based on topic keywords
  const keywords = {
    'anxiety': ['tms-for-anxiety-fda-breakthrough', 'tms-for-panic-disorder', 'tms-for-social-anxiety'],
    'depression': ['tms-vs-medication', 'tms-success-rates-2026', 'tms-for-treatment-resistant-depression'],
    'ocd': ['tms-for-ocd-deep-tms-results', 'tms-for-ocd-versus-medication'],
    'ptsd': ['tms-for-ptsd', 'tms-for-veterans-ptsd-military'],
    'veteran': ['tms-for-veterans-va-coverage', 'tms-for-veterans-ptsd-military'],
    'pain': ['tms-for-chronic-pain', 'tms-for-fibromyalgia'],
    'sleep': ['tms-for-insomnia', 'tms-and-sleep-quality-outcomes'],
    'pregnancy': ['tms-during-pregnancy-safety-data', 'tms-for-postpartum-depression'],
    'insurance': ['tms-cost-insurance-guide-2026', 'tms-insurance-appeals-complete-guide', 'tms-covered-by-medicare-2026-update'],
    'device': ['neurostar-tms-device-review-2026', 'brainsway-deep-tms-comprehensive-guide', 'magventure-tms-device-overview'],
    'cost': ['real-cost-of-tms-therapy-2026', 'tms-cost-insurance-guide-2026'],
    'protocol': ['theta-burst-vs-standard-tms', 'deep-tms-vs-standard-tms-comparison', 'stanford-neuromodulation-therapy-snt-2026'],
    'child': ['tms-for-adolescents', 'tms-in-children-and-adolescents-fda'],
    'elderly': ['tms-for-older-adults-geriatric-depression'],
    'bipolar': ['tms-for-bipolar-depression', 'tms-for-bipolar-disorder'],
    'stroke': ['tms-for-stroke-rehabilitation'],
    'migraine': ['tms-for-migraine'],
    'tinnitus': ['tms-for-tinnitus'],
    'parkinson': ['tms-for-parkinsons'],
    'ms': ['tms-for-multiple-sclerosis'],
    'autism': ['tms-for-autism-spectrum'],
    'alzheimers': ['tms-for-alzheimers'],
    'eating': ['tms-for-eating-disorders', 'tms-for-binge-eating-disorder'],
    'fibromyalgia': ['tms-for-fibromyalgia'],
    'ect': ['tms-vs-ect-comparing-brain-stimulation', 'tms-vs-ect-comparison-guide'],
    'medication': ['tms-vs-medication'],
    'tms': ['what-tms-actually-feels-like', 'how-to-prepare-for-tms', 'what-to-expect-first-tms-session'],
  };

  for (const [keyword, slugs] of Object.entries(keywords)) {
    if (topicLower.includes(keyword)) {
      for (const slug of slugs) {
        if (!usedSlugs.has(slug)) {
          const text = formatLinkText(slug);
          links.push({ text, url: `/blog/${slug}/` });
          usedSlugs.add(slug);
          if (links.length >= 5) break;
        }
      }
    }
    if (links.length >= 5) break;
  }

  // Add generic links if needed
  if (links.length < 5) {
    for (const slug of BLOG_LINKS) {
      if (!usedSlugs.has(slug) && links.length < 8) {
        const text = formatLinkText(slug);
        links.push({ text, url: `/blog/${slug}/` });
        usedSlugs.add(slug);
      }
    }
  }

  return links;
}

function formatLinkText(slug) {
  const text = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  return text;
}

function countExistingLinks(content) {
  const matches = content.match(/]\(\/[^)]+\)/g) || [];
  return matches.filter(m =>
    /\]\(\/(blog|quiz|clinic|specialists|near-me|treatments|insurance|protocols|research|alternatives)/.test(m)
  ).length;
}

function addLinksToFile(filepath) {
  let content = readFileSync(filepath, 'utf8');
  const existingCount = countExistingLinks(content);

  // Extract title from frontmatter
  const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract existing links
  const existingLinks = [];
  const linkMatches = content.match(/]\(\/[^)]+\)/g) || [];
  linkMatches.forEach(m => {
    const url = m.match(/]\(([^)]+)\)/)[1];
    existingLinks.push(url);
  });

  // If already has 8+ links, skip
  if (existingCount >= 8) {
    return { status: 'skipped', count: existingCount, reason: 'already has enough links' };
  }

  // Generate new links
  const topicLinks = getRelatedBlogLinks(title, existingLinks);
  const siteLinks = SITE_LINKS.filter(l => !existingLinks.includes(l.url)).slice(0, 3);
  const allLinks = [...topicLinks.slice(0, 6), ...siteLinks].slice(0, 10 - existingCount);

  if (allLinks.length === 0) {
    return { status: 'skipped', count: existingCount, reason: 'no more links needed' };
  }

  // Find a good insertion point (end of an existing section, before FAQ or final heading)
  const faqMatch = content.match(/(## .*FAQ.*\n\n)/i);
  const lastH2Match = content.match(/\n(## [^#\n]+)\n(?!#)/g);

  let insertText = '\n\n' + allLinks.map(l => `For more information, see our guide to [${l.text}](${l.url}).`).join('\n') + '\n';

  if (faqMatch) {
    const idx = content.indexOf(faqMatch[1]) + faqMatch[1].length;
    content = content.slice(0, idx) + insertText + content.slice(idx);
  } else if (lastH2Match) {
    const lastIdx = content.lastIndexOf(lastH2Match[lastH2Match.length - 1]);
    if (lastIdx > 0) {
      const nextSection = content.indexOf('\n## ', lastIdx + 10);
      if (nextSection > 0) {
        content = content.slice(0, nextSection) + insertText + content.slice(nextSection);
      } else {
        content += insertText;
      }
    } else {
      content += insertText;
    }
  } else {
    content += insertText;
  }

  // Fix any duplicate links that were already in the content
  content = content.replace(/https:\/\/tmslist\.com/g, '');

  writeFileSync(filepath, content, 'utf8');

  return { status: 'ok', count: existingCount + allLinks.length, added: allLinks.length };
}

function main() {
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  let processed = 0, updated = 0, skipped = 0;

  console.log(`\n📚 Adding internal links to ${files.length} blog posts...\n`);

  for (const file of files) {
    const filepath = join(BLOG_DIR, file);
    const result = addLinksToFile(filepath);
    processed++;

    if (result.status === 'ok') {
      updated++;
      console.log(`  ✅ ${file}: ${result.count} links (+${result.added})`);
    } else {
      skipped++;
      console.log(`  ⏭  ${file}: ${result.reason}`);
    }
  }

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Updated:   ${updated}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`─────────────────────────────────────────────\n`);
}

main();