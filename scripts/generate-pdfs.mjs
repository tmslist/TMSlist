/**
 * Generate PDFs from HTML lead magnet templates using Puppeteer.
 * Run: node scripts/generate-pdfs.mjs
 *
 * Converts the rich HTML files in public/downloads/ to print-optimized PDFs.
 * Each PDF is styled for letter-size printing at 0.75in margins.
 */
import puppeteer from 'puppeteer';
const { launch } = puppeteer;
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS_DIR = path.join(__dirname, '../public/downloads');

const FILES = [
  // Patient guides
  { html: 'insurance-checklist.html',                    pdf: 'insurance-checklist.pdf' },
  { html: 'tms-buyers-guide.html',                      pdf: 'tms-buyers-guide.pdf' },
  { html: 'tms-vs-medication.html',                    pdf: 'tms-vs-medication.pdf' },
  // Provider lead magnets
  { html: 'tms-billing-cpt-codes-2026.html',            pdf: 'tms-billing-cpt-codes-2026.pdf' },
  { html: 'tms-patient-acquisition-playbook.html',      pdf: 'tms-patient-acquisition-playbook.pdf' },
  { html: 'tms-prior-authorization-template-kit.html', pdf: 'tms-prior-authorization-template-kit.pdf' },
  { html: 'starting-a-tms-clinic-business-plan.html',   pdf: 'starting-a-tms-clinic-business-plan.pdf' },
  { html: 'tms-patient-outcome-tracking-system.html', pdf: 'tms-patient-outcome-tracking-system.pdf' },
  { html: 'tms-technician-training-checklist.html',    pdf: 'tms-technician-training-checklist.pdf' },
  { html: 'tms-state-regulations-guide-2026.html',     pdf: 'tms-state-regulations-guide-2026.pdf' },
  { html: 'building-tms-referral-network.html',        pdf: 'building-tms-referral-network.pdf' },
];

async function generatePDFs() {
  console.log('🚀 Launching Puppeteer...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const { html, pdf } of FILES) {
    const htmlPath = path.join(DOWNLOADS_DIR, html);
    const pdfPath   = path.join(DOWNLOADS_DIR, pdf);

    if (!fs.existsSync(htmlPath)) {
      console.warn(`⚠️  HTML file not found: ${html}, skipping.`);
      continue;
    }

    const fileUrl = `file://${htmlPath}`;
    console.log(`📄 Generating PDF for: ${html}`);

    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // Give fonts time to load
    await page.waitForTimeout;

    await page.pdf({
      path:           pdfPath,
      format:         'Letter',
      printBackground: true,
      margin: {
        top:    '0.6in',
        bottom: '0.6in',
        left:   '0.6in',
        right:  '0.6in',
      },
      displayHeaderFooter: false,
      scale: 1,
    });

    const stats = fs.statSync(pdfPath);
    console.log(`✅  ${pdf} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  await browser.close();
  console.log('\n✨ All PDFs generated successfully!');
}

generatePDFs().catch(err => {
  console.error('❌ PDF generation failed:', err);
  process.exit(1);
});
