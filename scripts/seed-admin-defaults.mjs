// Seed sensible defaults for the new admin tables.
// Idempotent — uses ON CONFLICT DO NOTHING on natural keys.
// Run: node --env-file=.env.local scripts/seed-admin-defaults.mjs

import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
const sql = postgres(url, { max: 1 });

// ─── points_rules ────────────────────────────────────────────
const POINTS_RULES = [
  ['profile_completed', 'Clinic completes their profile', 50, null],
  ['first_review_received', 'Clinic receives their first review', 25, null],
  ['review_received', 'Clinic receives a verified review', 5, 25],
  ['review_response', 'Clinic responds to a review', 3, 15],
  ['photo_uploaded', 'Clinic uploads a photo', 2, 10],
  ['claim_verified', 'Clinic claim verified by admin', 100, null],
  ['lead_responded_under_24h', 'Lead responded to within 24 hours', 10, 50],
  ['insurance_plan_added', 'Clinic adds an insurance plan', 5, 20],
  ['blog_post_published', 'Clinic publishes a blog post', 15, null],
  ['referral_completed', 'Clinic completes a referral', 20, null],
];

// ─── badge_templates ────────────────────────────────────────
const BADGE_TEMPLATES = [
  ['verified_clinic', 'Verified Clinic', 'Identity and credentials verified by TMS List staff', 'shield-check', 'emerald', 'gold', { type: 'manual' }],
  ['fast_responder', 'Fast Responder', 'Responds to leads within 1 hour on average', 'zap', 'amber', 'silver', { type: 'auto', metric: 'avg_response_minutes', op: '<=', value: 60 }],
  ['top_rated', 'Top Rated', 'Maintains 4.5+ star average across 25+ reviews', 'star', 'yellow', 'gold', { type: 'auto', metric: 'rating_avg', op: '>=', value: 4.5, minReviews: 25 }],
  ['fda_cleared', 'FDA-Cleared Devices', 'Uses FDA-cleared TMS devices exclusively', 'badge', 'blue', 'silver', { type: 'manual' }],
  ['accepts_insurance', 'Accepts Insurance', 'Accepts at least one major insurance plan', 'credit-card', 'teal', 'bronze', { type: 'auto', metric: 'insurance_count', op: '>=', value: 1 }],
  ['research_active', 'Research Active', 'Actively participates in clinical research', 'flask', 'violet', 'gold', { type: 'manual' }],
  ['saint_certified', 'SAINT Protocol Certified', 'Certified to perform SAINT protocol', 'award', 'rose', 'platinum', { type: 'manual' }],
  ['veteran_friendly', 'Veteran Friendly', 'Specializes in care for veterans (TRICARE / VA)', 'flag', 'indigo', 'silver', { type: 'manual' }],
];

// ─── achievements ───────────────────────────────────────────
const ACHIEVEMENTS = [
  ['first_review', 'First Review', 'Receive your first review', 'star', 'engagement', 25],
  ['ten_reviews', 'Trusted Voice', 'Receive 10 verified reviews', 'star', 'engagement', 100],
  ['fifty_reviews', 'Community Favorite', 'Receive 50 verified reviews', 'star', 'engagement', 500],
  ['profile_complete', 'Profile Pro', 'Complete every section of your clinic profile', 'check-circle', 'profile', 100],
  ['fast_responder', 'Lightning Fast', 'Respond to 10 leads within an hour', 'zap', 'leads', 200],
  ['lead_streak_30', 'On a Roll', 'Respond to leads daily for 30 days straight', 'flame', 'leads', 300],
  ['five_year_member', '5-Year Member', 'Active TMS List member for 5 years', 'calendar', 'tenure', 500],
];

// ─── ai_models ──────────────────────────────────────────────
const AI_MODELS = [
  ['anthropic', 'claude-opus-4-7', 'Claude Opus 4.7 (1M)', ['text','vision','tools','reasoning'], '0.015', '0.075', 1000000, true],
  ['anthropic', 'claude-sonnet-4-6', 'Claude Sonnet 4.6', ['text','vision','tools'], '0.003', '0.015', 200000, true],
  ['anthropic', 'claude-haiku-4-5-20251001', 'Claude Haiku 4.5', ['text','vision'], '0.0008', '0.004', 200000, true],
  ['openai', 'gpt-4o', 'GPT-4o', ['text','vision','tools'], '0.0025', '0.010', 128000, false],
];

// ─── ai_templates ───────────────────────────────────────────
const AI_TEMPLATES = [
  ['blog_outline', 'Blog Outline Generator', 'Generates an SEO-friendly outline for a TMS-related blog post.',
   'You are an editor for a clinical TMS therapy directory. Produce factually grounded, jargon-light outlines.',
   'Topic: {{topic}}\nTarget reader: {{reader}}\nDesired length: {{words}} words.\nReturn an outline with H2/H3 headings.',
   ['topic','reader','words']],
  ['clinic_description', 'Clinic Description Rewrite', 'Rewrites a clinic-supplied blurb in our editorial voice.',
   'Rewrite descriptions in a warm, factual editorial voice. Avoid superlatives unsupported by evidence.',
   'Original: {{original}}\nClinic name: {{clinic}}\nLocation: {{location}}\nKey specialties: {{specialties}}',
   ['original','clinic','location','specialties']],
  ['review_summary', 'Review Theme Summary', 'Summarises themes across a clinic\'s reviews.',
   'Summarise review themes neutrally. Cite only what reviewers said.',
   'Reviews JSON:\n{{reviews}}\n\nReturn 3 strengths and 2 areas to improve.',
   ['reviews']],
  ['lead_reply_draft', 'Lead Reply Draft', 'Drafts an empathetic first reply to a patient lead.',
   'You write the first reply from a clinic to a patient lead. Be warm, brief, and ask one clarifying question.',
   'Lead: {{lead_name}}\nCondition: {{condition}}\nLocation: {{location}}\nMessage: {{message}}',
   ['lead_name','condition','location','message']],
];

// ─── email_templates ────────────────────────────────────────
const EMAIL_TEMPLATES = [
  ['welcome_user', 'Welcome — Patient', 'Welcome to TMS List, {{name}}',
   '<p>Hi {{name}},</p><p>Thanks for joining TMS List. We\'ll help you find the right TMS clinic.</p><p>— The TMS List team</p>',
   'Hi {{name}},\n\nThanks for joining TMS List. We\'ll help you find the right TMS clinic.\n\n— The TMS List team',
   ['name']],
  ['welcome_clinic', 'Welcome — Clinic Owner', 'Your TMS List clinic listing is live, {{clinicName}}',
   '<p>Hi {{ownerName}},</p><p>Your listing for <strong>{{clinicName}}</strong> is live. <a href="{{dashboardUrl}}">Open your dashboard</a> to add photos and respond to leads.</p>',
   'Hi {{ownerName}},\n\nYour listing for {{clinicName}} is live. Open your dashboard at {{dashboardUrl}} to add photos and respond to leads.',
   ['ownerName','clinicName','dashboardUrl']],
  ['lead_received', 'New Patient Lead', 'New lead from {{leadName}} for {{clinicName}}',
   '<p>You have a new patient lead.</p><p><strong>From:</strong> {{leadName}}<br/><strong>Condition:</strong> {{condition}}<br/><strong>Message:</strong> {{message}}</p><p><a href="{{leadUrl}}">View lead</a></p>',
   'You have a new patient lead.\n\nFrom: {{leadName}}\nCondition: {{condition}}\nMessage: {{message}}\n\nView at: {{leadUrl}}',
   ['leadName','clinicName','condition','message','leadUrl']],
  ['review_received', 'New Review', '{{rating}}★ review from {{reviewerName}}',
   '<p>{{clinicName}} just received a {{rating}}-star review from {{reviewerName}}.</p><blockquote>{{reviewBody}}</blockquote><p><a href="{{reviewUrl}}">Respond</a></p>',
   '{{clinicName}} just received a {{rating}}-star review from {{reviewerName}}:\n\n"{{reviewBody}}"\n\nRespond at: {{reviewUrl}}',
   ['clinicName','rating','reviewerName','reviewBody','reviewUrl']],
  ['password_reset', 'Reset Your Password', 'Reset your TMS List password',
   '<p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="{{resetUrl}}">Reset password</a></p><p>If you didn\'t request this, ignore this email.</p>',
   'Click the link below to reset your password (expires in 1 hour):\n\n{{resetUrl}}\n\nIf you didn\'t request this, ignore this email.',
   ['resetUrl']],
  ['magic_link', 'Sign In to TMS List', 'Your sign-in link for TMS List',
   '<p>Click below to sign in. The link expires in 15 minutes.</p><p><a href="{{magicUrl}}">Sign in</a></p>',
   'Click below to sign in (expires in 15 minutes):\n\n{{magicUrl}}',
   ['magicUrl']],
];

// ─── help_categories ────────────────────────────────────────
const HELP_CATEGORIES = [
  ['getting-started', 'Getting Started', 'Account setup, finding clinics, first steps', 'rocket', 1],
  ['for-patients', 'For Patients', 'Choosing a clinic, insurance, what to expect', 'user', 2],
  ['for-clinics', 'For Clinics', 'Claiming your listing, managing leads, billing', 'building', 3],
  ['insurance-cost', 'Insurance & Cost', 'Coverage questions, payment plans, financial assistance', 'credit-card', 4],
  ['account-billing', 'Account & Billing', 'Subscriptions, invoices, account settings', 'settings', 5],
  ['privacy-data', 'Privacy & Data', 'How we handle your data, GDPR, account deletion', 'shield', 6],
];

(async () => {
  let total = 0;

  for (const [event, description, points, dailyCap] of POINTS_RULES) {
    await sql`INSERT INTO points_rules (event, description, points, daily_cap)
              VALUES (${event}, ${description}, ${points}, ${dailyCap})
              ON CONFLICT (event) DO NOTHING`;
    total++;
  }

  for (const [key, name, description, icon, color, tier, criteria] of BADGE_TEMPLATES) {
    await sql`INSERT INTO badge_templates (key, name, description, icon, color, tier, criteria)
              VALUES (${key}, ${name}, ${description}, ${icon}, ${color}, ${tier}, ${sql.json(criteria)})
              ON CONFLICT (key) DO NOTHING`;
    total++;
  }

  for (const [key, name, description, icon, category, points] of ACHIEVEMENTS) {
    await sql`INSERT INTO achievements (key, name, description, icon, category, points)
              VALUES (${key}, ${name}, ${description}, ${icon}, ${category}, ${points})
              ON CONFLICT (key) DO NOTHING`;
    total++;
  }

  for (const [provider, modelId, displayName, capabilities, inCost, outCost, ctx, enabled] of AI_MODELS) {
    await sql`INSERT INTO ai_models (provider, model_id, display_name, capabilities, input_cost_per_1k, output_cost_per_1k, context_window, enabled)
              VALUES (${provider}, ${modelId}, ${displayName}, ${sql.json(capabilities)}, ${inCost}, ${outCost}, ${ctx}, ${enabled})
              ON CONFLICT (provider, model_id) DO NOTHING`;
    total++;
  }

  for (const [key, name, description, sysPrompt, userPrompt, vars] of AI_TEMPLATES) {
    await sql`INSERT INTO ai_templates (key, name, description, system_prompt, user_prompt_template, variables)
              VALUES (${key}, ${name}, ${description}, ${sysPrompt}, ${userPrompt}, ${sql.json(vars)})
              ON CONFLICT (key) DO NOTHING`;
    total++;
  }

  for (const [key, name, subject, html, txt, vars] of EMAIL_TEMPLATES) {
    await sql`INSERT INTO email_templates (key, name, subject, body_html, body_text, variables)
              VALUES (${key}, ${name}, ${subject}, ${html}, ${txt}, ${sql.json(vars)})
              ON CONFLICT (key) DO NOTHING`;
    total++;
  }

  for (const [slug, name, description, icon, sortOrder] of HELP_CATEGORIES) {
    await sql`INSERT INTO help_categories (slug, name, description, icon, sort_order)
              VALUES (${slug}, ${name}, ${description}, ${icon}, ${sortOrder})
              ON CONFLICT (slug) DO NOTHING`;
    total++;
  }

  console.log(`✓ Attempted ${total} seed inserts (existing rows skipped via ON CONFLICT DO NOTHING).`);
  console.log(`  - ${POINTS_RULES.length} points rules`);
  console.log(`  - ${BADGE_TEMPLATES.length} badge templates`);
  console.log(`  - ${ACHIEVEMENTS.length} achievements`);
  console.log(`  - ${AI_MODELS.length} AI models`);
  console.log(`  - ${AI_TEMPLATES.length} AI templates`);
  console.log(`  - ${EMAIL_TEMPLATES.length} email templates`);
  console.log(`  - ${HELP_CATEGORIES.length} help categories`);

  await sql.end();
})();
