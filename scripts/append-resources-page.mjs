/**
 * Idempotently append a "Resources Library" final page to every lead-magnet HTML.
 * Run: node scripts/append-resources-page.mjs
 *
 * Adds (or replaces, on re-run) a single full-bleed final spread that promotes
 * every other free resource on tmslist.com. Identified by the comment marker
 * <!-- TMSLIST_RESOURCES_LIBRARY_BLOCK --> ... <!-- /TMSLIST_RESOURCES_LIBRARY_BLOCK -->
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS_DIR = path.join(__dirname, '../public/downloads');

const RESOURCES = [
  { slug: 'tms-buyers-guide',                     title: "The Complete TMS Buyer's Guide",         desc: 'Everything to choose the right TMS provider.',     audience: 'Patient',  pdf: true  },
  { slug: 'insurance-checklist',                  title: 'Insurance Coverage Checklist',           desc: 'A step-by-step walkthrough to get TMS covered.',   audience: 'Patient',  pdf: true  },
  { slug: 'tms-vs-medication',                    title: 'TMS vs Medication Comparison',           desc: 'Outcomes, side effects and cost, side by side.',   audience: 'Patient',  pdf: true  },
  { slug: 'tms-billing-cpt-codes-2026',           title: 'TMS Billing & CPT Codes 2026',           desc: 'Reimbursement reference for billers and coders.',  audience: 'Provider', pdf: true  },
  { slug: 'tms-prior-authorization-template-kit', title: 'Prior Authorization Template Kit',       desc: 'Approval-ready letter and appeal templates.',      audience: 'Provider', pdf: true  },
  { slug: 'tms-patient-acquisition-playbook',     title: 'Patient Acquisition Playbook',           desc: 'Channels, scripts and funnels that convert.',      audience: 'Provider', pdf: true  },
  { slug: 'starting-a-tms-clinic-business-plan',  title: 'Starting a TMS Clinic — Business Plan',  desc: 'Full plan with pro-forma, equipment and staffing.',audience: 'Provider', pdf: true  },
  { slug: 'tms-patient-outcome-tracking-system',  title: 'Patient Outcome Tracking System',        desc: 'PHQ-9 / GAD-7 workflow with templates.',           audience: 'Provider', pdf: true  },
  { slug: 'tms-technician-training-checklist',    title: 'Technician Training Checklist',          desc: 'Onboard new TMS technicians faster.',              audience: 'Provider', pdf: true  },
  { slug: 'tms-state-regulations-guide-2026',     title: 'State Regulations Guide 2026',           desc: 'Compliance and licensure by state.',               audience: 'Provider', pdf: true  },
  { slug: 'building-tms-referral-network',        title: 'Building a TMS Referral Network',        desc: 'Outreach scripts and CRM cadence that work.',      audience: 'Provider', pdf: true  },
];

const START = '<!-- TMSLIST_RESOURCES_LIBRARY_BLOCK -->';
const END   = '<!-- /TMSLIST_RESOURCES_LIBRARY_BLOCK -->';

function block(currentSlug) {
  const others = RESOURCES.filter(r => r.slug !== currentSlug);
  const cards = others.map(r => `
        <a class="lib-card lib-${r.audience.toLowerCase()}" href="https://tmslist.com/downloads/${r.slug}.pdf">
          <div class="lib-card-tag">${r.audience}</div>
          <div class="lib-card-title">${r.title}</div>
          <div class="lib-card-desc">${r.desc}</div>
          <div class="lib-card-link">tmslist.com/downloads/${r.slug}.pdf →</div>
        </a>`).join('');

  return `${START}
<style>
  .lib-page { page-break-before: always; background: linear-gradient(165deg, #0b1027 0%, #1e1b4b 45%, #312e81 100%); color: #fff; min-height: 9.4in; padding: 0.55in 0.55in 0.45in; position: relative; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
  .lib-page::before { content: ''; position: absolute; top: -120px; right: -90px; width: 360px; height: 360px; background: radial-gradient(circle, rgba(129,140,248,0.25), transparent 70%); border-radius: 50%; }
  .lib-page::after  { content: ''; position: absolute; bottom: -120px; left: -90px; width: 360px; height: 360px; background: radial-gradient(circle, rgba(14,165,233,0.18), transparent 70%); border-radius: 50%; }
  .lib-page-inner { position: relative; z-index: 1; }
  .lib-eyebrow { display: inline-block; padding: 4px 11px; border-radius: 999px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); font-size: 7.5pt; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #c7d2fe; margin-bottom: 0.18in; }
  .lib-h1 { font-size: 26pt; font-weight: 900; line-height: 1.05; letter-spacing: -0.5px; margin-bottom: 0.08in; }
  .lib-h1 em { color: #818cf8; font-style: normal; }
  .lib-sub { font-size: 9.5pt; color: rgba(255,255,255,0.72); max-width: 5.6in; margin-bottom: 0.22in; line-height: 1.5; }
  .lib-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
  .lib-card { display: block; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 9px; padding: 10px 11px; text-decoration: none; color: inherit; break-inside: avoid; position: relative; }
  .lib-card-tag { position: absolute; top: 8px; right: 9px; font-size: 6.2pt; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
  .lib-patient .lib-card-tag  { background: rgba(34,197,94,0.18);  color: #86efac; border: 1px solid rgba(34,197,94,0.35); }
  .lib-provider .lib-card-tag { background: rgba(129,140,248,0.18); color: #c7d2fe; border: 1px solid rgba(129,140,248,0.35); }
  .lib-card-title { font-size: 9.5pt; font-weight: 800; margin: 4px 0 3px; padding-right: 56px; line-height: 1.2; color: #fff; }
  .lib-card-desc  { font-size: 7.6pt; color: rgba(255,255,255,0.65); line-height: 1.35; margin-bottom: 6px; min-height: 22px; }
  .lib-card-link  { font-size: 7pt; color: #818cf8; font-weight: 700; letter-spacing: 0.2px; }
  .lib-cta { margin-top: 0.22in; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .lib-cta-text { font-size: 8.5pt; color: rgba(255,255,255,0.78); }
  .lib-cta-text strong { color: #fff; font-size: 9.5pt; display: block; margin-bottom: 2px; }
  .lib-cta-btn { font-size: 9pt; font-weight: 800; color: #0b1027; background: #fff; padding: 8px 14px; border-radius: 8px; text-decoration: none; white-space: nowrap; }
  .lib-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 0.2in; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 7.5pt; color: rgba(255,255,255,0.5); }
  .lib-foot strong { color: rgba(255,255,255,0.85); font-weight: 800; }
</style>
<div class="lib-page">
  <div class="lib-page-inner">
    <div class="lib-eyebrow">The Free Resources Library</div>
    <h2 class="lib-h1">Keep going — there's <em>more where this came from</em>.</h2>
    <p class="lib-sub">This guide is one piece of a free library we publish for patients researching TMS and providers running TMS clinics. Every resource below is a full PDF — no fluff, no upsell.</p>

    <div class="lib-grid">${cards}
    </div>

    <div class="lib-cta">
      <div class="lib-cta-text">
        <strong>Browse the full library online</strong>
        New guides, calculators and templates added each quarter.
      </div>
      <a class="lib-cta-btn" href="https://tmslist.com/resources/">tmslist.com/resources →</a>
    </div>

    <div class="lib-foot">
      <span>© TMS List — Free education for patients & providers.</span>
      <span><strong>tmslist.com</strong></span>
    </div>
  </div>
</div>
${END}`;
}

function processFile(htmlPath, slug) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const regex = new RegExp(`${START}[\\s\\S]*?${END}`, 'g');
  if (regex.test(html)) html = html.replace(regex, '');
  const newBlock = block(slug);
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${newBlock}\n</body>`);
  } else {
    html = html + '\n' + newBlock + '\n';
  }
  fs.writeFileSync(htmlPath, html);
}

for (const r of RESOURCES) {
  const htmlPath = path.join(DOWNLOADS_DIR, `${r.slug}.html`);
  if (!fs.existsSync(htmlPath)) {
    console.warn(`⚠️  Missing: ${r.slug}.html`);
    continue;
  }
  processFile(htmlPath, r.slug);
  console.log(`✅ ${r.slug}.html updated`);
}
console.log('\n✨ Resources library page injected into all HTML lead magnets.');
