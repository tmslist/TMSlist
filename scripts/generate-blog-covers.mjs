#!/usr/bin/env node
/**
 * Generate branded SVG cover banners for every blog post.
 * - Editorial warm palette: ink #0A1628 / ink2 #1E2A3B / warm #C9654A / paper #FBFAF7
 * - Per-post hook headline (short, subtle, evocative)
 * - Category-driven accent layout
 * - Writes to public/images/blog-covers/{slug}.svg
 * - Rewrites the `image:` frontmatter line in each post
 */
import fs from "node:fs";
import path from "node:path";

const BLOG_DIR = "src/content/blog";
const OUT_DIR = "public/images/blog-covers";
fs.mkdirSync(OUT_DIR, { recursive: true });

// ───────────────────────────────────────────────────────────────────
// Hook headlines — short, subtle, hand-curated per post.
// Goal: 3–7 words, declarative, no clickbait. Sets tone, not content.
// ───────────────────────────────────────────────────────────────────
const HOOKS = {
  "ai-guided-tms-targeting-2026": "Smarter coils, sharper minds.",
  "at-home-tms-devices-effectiveness": "Convenience meets a hard ceiling.",
  "can-i-drive-after-tms": "Yes — and here is why.",
  "choosing-tms-clinic-red-flags": "Read the room before booking.",
  "combining-tms-with-therapy": "The 1+1 that becomes 3.",
  "deep-tms-vs-standard-tms-comparison": "Two coils. One brain. Real differences.",
  "does-tms-cause-memory-loss": "What the data quietly confirms.",
  "history-of-tms-from-faraday-to-fda": "From a 19th-century coil to FDA clearance.",
  "how-long-does-tms-last": "Months, sometimes years — depends on what you do next.",
  "how-to-find-tms-clinic-guide": "A method, not a search bar.",
  "how-to-prepare-for-tms": "The first session is easier than the wait.",
  "real-cost-of-tms-therapy-2026": "What you will actually pay this year.",
  "stanford-neuromodulation-therapy-snt-2026": "Five days. New protocol. Real numbers.",
  "theta-burst-stimulation-faster-tms": "Three minutes. Same circuits.",
  "theta-burst-vs-standard-tms": "Speed versus tradition — and the verdict.",
  "tms-and-alcohol": "Where the lines actually are.",
  "tms-and-cognitive-function": "Sharper thinking is often the bonus.",
  "tms-and-exercise-physical-activity": "Movement that compounds the magnetic pulse.",
  "tms-and-genetics-response-prediction": "Will your DNA call the response?",
  "tms-and-ketamine-together": "The pairing patients keep asking about.",
  "tms-and-meditation-mindfulness": "Stillness that amplifies the signal.",
  "tms-and-pregnancy-safety-considerations": "A drug-free option, examined honestly.",
  "tms-and-psychotherapy-combination": "Stimulation opens the door. Therapy walks through it.",
  "tms-and-sleep-quality-outcomes": "Rest is a treatment lever.",
  "tms-and-weight-changes": "What patients actually report on the scale.",
  "tms-at-home-devices-2026": "What consumer hardware can — and cannot — do.",
  "tms-booster-sessions-maintenance-gains": "Hold the gains you fought for.",
  "tms-booster-sessions-maintenance-protocols": "A maintenance plan, not a refresher.",
  "tms-cost-2026-full-breakdown": "City by city. Plan by plan.",
  "tms-cost-insurance-denied-appeal": "Denials are a starting point, not an ending.",
  "tms-covered-by-medicare-2026-update": "What changed under Medicare this year.",
  "tms-depression-relapse-signs": "Spot the creep before it returns.",
  "tms-during-pregnancy-safety-data": "Reading the safety record without alarm.",
  "tms-for-adhd": "Targeting attention from the outside in.",
  "tms-for-adolescents": "What every parent should ask first.",
  "tms-for-alzheimers": "A magnetic question for an old disease.",
  "tms-for-anxiety-fda-breakthrough": "Anxiety joins the FDA breakthrough list.",
  "tms-for-athletes-performance-mental-health": "Recovery, performance, and the quiet edge.",
  "tms-for-autism-spectrum": "Promise, with the caveats spelled out.",
  "tms-for-binge-eating-disorder": "Quieting the urge at the source.",
  "tms-for-bipolar-depression": "Promise, paired with caution.",
  "tms-for-bipolar-disorder": "Where evidence ends and discretion begins.",
  "tms-for-chronic-pain": "Off-label, on-target.",
  "tms-for-eating-disorders": "Targeting the loop, not the symptom.",
  "tms-for-fibromyalgia": "Where the pain begins, not where it lands.",
  "tms-for-first-responders-trauma": "For the people who answer the call.",
  "tms-for-graduate-students-academia": "The crisis academia keeps quiet about.",
  "tms-for-healthcare-workers-burnout": "Care for the caregivers.",
  "tms-for-insomnia": "When sleep needs more than a pill.",
  "tms-for-migraine": "FDA-cleared, drug-free relief.",
  "tms-for-multiple-sclerosis": "Fatigue, mood, cognition — addressed at once.",
  "tms-for-ocd-deep-tms-results": "Two-year data tells the durable story.",
  "tms-for-ocd-versus-medication": "Two paths, side by side.",
  "tms-for-older-adults-geriatric-depression": "Depression doesn't belong to aging.",
  "tms-for-panic-disorder": "Breaking the cycle without sedation.",
  "tms-for-parkinsons": "Motor and mood, treated together.",
  "tms-for-postpartum-depression": "A drug-free path for new mothers.",
  "tms-for-preterm-labor-stress": "Safety, benefits, and current research.",
  "tms-for-ptsd": "When standard treatment runs out of room.",
  "tms-for-smoking-cessation": "Targeting the craving circuitry.",
  "tms-for-social-anxiety": "Quieting the room before the room fills.",
  "tms-for-stroke-rehabilitation": "Plasticity, persuaded.",
  "tms-for-suicidal-ideation": "Rapid relief for the highest-stakes hours.",
  "tms-for-tinnitus": "Can magnets quiet the ringing?",
  "tms-for-treatment-resistant-depression": "What patients deserve to know first.",
  "tms-for-veterans-va-coverage-guide": "VA coverage, in plain language.",
  "tms-for-veterans-va-coverage": "VA pathways for veterans, mapped.",
  "tms-in-children-and-adolescents-fda": "Where the FDA draws the line.",
  "tms-in-europe-vs-us": "Two continents, two playbooks.",
  "tms-industry-lobbying-advocacy": "Who is fighting for access.",
  "tms-insurance-appeals-complete-guide": "Appeals are a process, not a hope.",
  "tms-maintenance-therapy-how-long-results-last": "Make the response durable.",
  "tms-neuroplasticity-rewiring-mental-health": "How a circuit relearns itself.",
  "tms-physics-neuroscience-magnetic-fields": "How a magnetic field reaches a neuron.",
  "tms-side-effects-complete-guide": "What is normal — and what is not.",
  "tms-side-effects-headache": "What actually happens, and what doesn't.",
  "tms-success-rates-2026": "Real numbers, real definitions.",
  "tms-vs-deep-brain-stimulation": "External pulse vs. surgical electrode.",
  "tms-vs-ect-comparing-brain-stimulation": "Two stimulants, one decision.",
  "tms-vs-medication": "Honest tradeoffs, side by side.",
  "tms-vs-rtms-terminology-explained": "Same field, different cadence.",
  "understanding-tms-motor-threshold": "Why your dose is yours alone.",
  "what-affects-tms-success": "The factors that move the curve.",
  "what-is-mapping-session": "What actually happens before treatment begins.",
  "what-tms-actually-feels-like": "Real patients describe every session.",
  "what-to-expect-first-tms-session": "A walk-through, minute by minute.",
};

// ───────────────────────────────────────────────────────────────────
// Category styling
// ───────────────────────────────────────────────────────────────────
const CATEGORY_LABEL = {
  "research": "Research",
  "treatment": "Treatment",
  "patient-guide": "Patient Guide",
  "faq": "FAQ",
  "insurance": "Insurance",
};

// Each category gets a slightly different accent treatment.
// All sit on the editorial ink palette so they read as one family.
const CATEGORY_ACCENT = {
  "research":      { warm: "#C9654A", glow: "#D4806A", motif: "wave" },
  "treatment":     { warm: "#C9654A", glow: "#E89A75", motif: "pulse" },
  "patient-guide": { warm: "#D4806A", glow: "#C9654A", motif: "rings" },
  "faq":           { warm: "#C9654A", glow: "#D4806A", motif: "quote" },
  "insurance":     { warm: "#C9654A", glow: "#D4806A", motif: "shield" },
};

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────
function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Wrap a hook into up to 3 lines. Display font is large; keep ~22 chars/line.
function wrapHook(hook, maxCharsPerLine = 26, maxLines = 3) {
  const words = hook.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if ((cur + " " + w).length <= maxCharsPerLine) cur += " " + w;
    else { lines.push(cur); cur = w; if (lines.length === maxLines - 1) break; }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  // If we ran out and there were more words, append remainder to last line
  const consumed = lines.join(" ").split(/\s+/).length;
  if (consumed < words.length) {
    const tail = words.slice(consumed).join(" ");
    lines[lines.length - 1] = (lines[lines.length - 1] + " " + tail).trim();
  }
  return lines;
}

function motifSvg(motif, accent) {
  switch (motif) {
    case "pulse":
      return `
        <g opacity="0.55" stroke="${accent.warm}" stroke-width="2" fill="none">
          <circle cx="980" cy="160" r="40" opacity="0.9"/>
          <circle cx="980" cy="160" r="80" opacity="0.5"/>
          <circle cx="980" cy="160" r="130" opacity="0.25"/>
          <circle cx="980" cy="160" r="190" opacity="0.12"/>
        </g>`;
    case "rings":
      return `
        <g opacity="0.5" stroke="${accent.warm}" stroke-width="1.5" fill="none">
          <ellipse cx="1020" cy="500" rx="220" ry="60"/>
          <ellipse cx="1020" cy="500" rx="160" ry="42"/>
          <ellipse cx="1020" cy="500" rx="100" ry="26"/>
        </g>`;
    case "quote":
      return `
        <g opacity="0.18" fill="${accent.warm}">
          <text x="940" y="240" font-family="Bricolage Grotesque, Georgia, serif" font-size="380" font-weight="700">"</text>
        </g>`;
    case "shield":
      return `
        <g opacity="0.35" stroke="${accent.warm}" stroke-width="2" fill="none">
          <path d="M980 120 L1080 160 L1080 280 Q1080 360 980 410 Q880 360 880 280 L880 160 Z"/>
          <path d="M980 170 L1050 200 L1050 280 Q1050 330 980 365 Q910 330 910 280 L910 200 Z" opacity="0.5"/>
        </g>`;
    case "wave":
    default:
      return `
        <g opacity="0.55" stroke="${accent.warm}" stroke-width="2" fill="none">
          <path d="M780 220 Q840 160 900 220 T1020 220 T1140 220"/>
          <path d="M780 260 Q840 200 900 260 T1020 260 T1140 260" opacity="0.7"/>
          <path d="M780 300 Q840 240 900 300 T1020 300 T1140 300" opacity="0.45"/>
          <path d="M780 340 Q840 280 900 340 T1020 340 T1140 340" opacity="0.25"/>
        </g>`;
  }
}

function buildCover({ slug, title, category, hook }) {
  const cat = CATEGORY_LABEL[category] || "Article";
  const accent = CATEGORY_ACCENT[category] || CATEGORY_ACCENT.treatment;

  const lines = wrapHook(hook, 26, 3);
  // Vertical centering for 1–3 lines
  const lineHeight = 78;
  const startY = 360 - ((lines.length - 1) * lineHeight) / 2;

  // Subtle dot pattern coordinates (deterministic, no JS-side randomness in output)
  // Use a pattern element instead.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0A1628"/>
      <stop offset="55%"  stop-color="#142033"/>
      <stop offset="100%" stop-color="#1E2A3B"/>
    </linearGradient>
    <radialGradient id="warmGlow" cx="0.85" cy="0.15" r="0.7">
      <stop offset="0%"  stop-color="${accent.glow}" stop-opacity="0.32"/>
      <stop offset="55%" stop-color="${accent.warm}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#0A1628" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="warmGlow2" cx="0.05" cy="0.95" r="0.55">
      <stop offset="0%"  stop-color="${accent.warm}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#0A1628" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1.2" cy="1.2" r="1.2" fill="#FBFAF7" fill-opacity="0.05"/>
    </pattern>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent.warm}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${accent.warm}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- base -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect width="1200" height="630" fill="url(#warmGlow)"/>
  <rect width="1200" height="630" fill="url(#warmGlow2)"/>

  <!-- decorative motif (top-right area) -->
  ${motifSvg(accent.motif, accent)}

  <!-- top wordmark -->
  <g transform="translate(80,80)">
    <text font-family="Bricolage Grotesque, Plus Jakarta Sans, system-ui, sans-serif"
          font-size="20" font-weight="700" fill="#FBFAF7" letter-spacing="0.18em">TMSLIST</text>
    <text x="115" y="0" font-family="Plus Jakarta Sans, system-ui, sans-serif"
          font-size="14" font-weight="500" fill="#FBFAF7" fill-opacity="0.45" letter-spacing="0.04em">— editorial</text>
  </g>

  <!-- category badge -->
  <g transform="translate(80,150)">
    <rect x="0" y="0" rx="999" ry="999" width="${22 + cat.length * 9.6}" height="34"
          fill="${accent.warm}" fill-opacity="0.16" stroke="${accent.warm}" stroke-opacity="0.55" stroke-width="1"/>
    <text x="14" y="22" font-family="Plus Jakarta Sans, system-ui, sans-serif"
          font-size="12" font-weight="700" fill="${accent.glow}" letter-spacing="0.18em">
      ${escapeXml(cat.toUpperCase())}
    </text>
  </g>

  <!-- accent rule -->
  <rect x="80" y="220" width="120" height="3" fill="url(#rule)"/>

  <!-- hook lines -->
  <g font-family="Bricolage Grotesque, Georgia, serif" fill="#FBFAF7">
    ${lines.map((ln, i) => `
    <text x="80" y="${startY + i * lineHeight}" font-size="64" font-weight="700" letter-spacing="-0.02em">${escapeXml(ln)}</text>`).join("")}
  </g>

  <!-- footer line -->
  <g transform="translate(80,560)" font-family="Plus Jakarta Sans, system-ui, sans-serif">
    <text font-size="14" font-weight="500" fill="#FBFAF7" fill-opacity="0.55" letter-spacing="0.06em">
      ${escapeXml(truncate(title, 78))}
    </text>
    <text x="0" y="26" font-size="12" font-weight="500" fill="${accent.glow}" fill-opacity="0.85" letter-spacing="0.1em">
      tmslist.com
    </text>
  </g>

  <!-- thin border accent bottom-right -->
  <line x1="1080" y1="595" x2="1160" y2="595" stroke="${accent.warm}" stroke-width="2" stroke-opacity="0.55"/>
</svg>
`;
}

function truncate(s, n) {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

function fallbackHook(title) {
  // If a hook is missing, derive a clean short hook from the title.
  let t = title.replace(/^TMS\s+(and|for|vs\.?|in)\s+/i, "");
  t = t.split(/[:\-—]/)[0].trim();
  if (t.length > 38) t = t.slice(0, 36).trimEnd() + "…";
  return t;
}

// ───────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────
const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
let written = 0, frontmatterUpdated = 0, missingHook = 0;

for (const f of files) {
  const filepath = path.join(BLOG_DIR, f);
  const txt = fs.readFileSync(filepath, "utf8");
  const fmMatch = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;
  const fm = fmMatch[1];
  const title = (fm.match(/^title:\s*["']?(.*?)["']?\s*$/m) || [])[1] || "";
  const category = (fm.match(/^category:\s*["']?(.*?)["']?\s*$/m) || [])[1] || "";
  const slug = f.replace(/\.md$/, "");

  let hook = HOOKS[slug];
  if (!hook) { hook = fallbackHook(title); missingHook++; }

  const svg = buildCover({ slug, title, category, hook });
  const outPath = path.join(OUT_DIR, `${slug}.svg`);
  fs.writeFileSync(outPath, svg);
  written++;

  // Rewrite the image: line in frontmatter
  const newImage = `image: "/images/blog-covers/${slug}.svg"`;
  let newTxt;
  if (/^image:\s*.*$/m.test(fm)) {
    newTxt = txt.replace(/^image:\s*.*$/m, newImage);
  } else {
    // insert after category if present, else before closing ---
    newTxt = txt.replace(/^---\n([\s\S]*?)\n---/, (_, body) => `---\n${body}\n${newImage}\n---`);
  }
  if (newTxt !== txt) {
    fs.writeFileSync(filepath, newTxt);
    frontmatterUpdated++;
  }
}

console.log(`Wrote ${written} cover SVGs to ${OUT_DIR}`);
console.log(`Updated frontmatter on ${frontmatterUpdated} posts`);
if (missingHook) console.log(`(${missingHook} posts used a fallback hook — review HOOKS map)`);
