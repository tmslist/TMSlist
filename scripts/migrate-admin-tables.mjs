// One-off: create the 16 new admin tables added to schema.ts.
// Idempotent CREATE TABLE IF NOT EXISTS — safe to re-run.
// Run with: node --env-file=.env.local scripts/migrate-admin-tables.mjs

import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set. Source .env.local first.');
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

const STATEMENTS = [
  // achievements
  `CREATE TABLE IF NOT EXISTS achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    icon text,
    category text,
    points integer NOT NULL DEFAULT 0,
    criteria jsonb,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  // ai_models
  `CREATE TABLE IF NOT EXISTS ai_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    model_id text NOT NULL,
    display_name text NOT NULL,
    capabilities jsonb,
    input_cost_per_1k numeric(10, 6),
    output_cost_per_1k numeric(10, 6),
    context_window integer,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_models_provider_model ON ai_models(provider, model_id)`,

  // ai_templates
  `CREATE TABLE IF NOT EXISTS ai_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    system_prompt text,
    user_prompt_template text NOT NULL,
    default_model_id uuid REFERENCES ai_models(id),
    variables jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,

  // ai_usage_logs
  `CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id uuid REFERENCES ai_models(id),
    template_id uuid REFERENCES ai_templates(id),
    user_id uuid REFERENCES users(id),
    prompt_tokens integer,
    completion_tokens integer,
    cost_cents numeric(10, 4),
    latency_ms integer,
    status text DEFAULT 'success',
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model ON ai_usage_logs(model_id)`,

  // automation_workflows
  `CREATE TABLE IF NOT EXISTS automation_workflows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    trigger text NOT NULL,
    trigger_config jsonb,
    steps jsonb NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    last_run_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,

  // automation_workflow_logs
  `CREATE TABLE IF NOT EXISTS automation_workflow_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id uuid NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
    status text NOT NULL,
    duration_ms integer,
    payload jsonb,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_automation_logs_workflow ON automation_workflow_logs(workflow_id)`,
  `CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON automation_workflow_logs(created_at)`,

  // badge_templates
  `CREATE TABLE IF NOT EXISTS badge_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    tier text DEFAULT 'bronze',
    criteria jsonb,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  // badge_awards
  `CREATE TABLE IF NOT EXISTS badge_awards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id uuid NOT NULL REFERENCES badge_templates(id) ON DELETE CASCADE,
    recipient_type text NOT NULL,
    recipient_id uuid NOT NULL,
    awarded_by uuid REFERENCES users(id),
    note text,
    awarded_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_badge_awards_recipient ON badge_awards(recipient_type, recipient_id)`,
  `CREATE INDEX IF NOT EXISTS idx_badge_awards_template ON badge_awards(template_id)`,

  // email_templates
  `CREATE TABLE IF NOT EXISTS email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    name text NOT NULL,
    subject text NOT NULL,
    body_html text NOT NULL,
    body_text text,
    variables jsonb,
    active boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  // help_categories
  `CREATE TABLE IF NOT EXISTS help_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    icon text,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  // help_articles
  `CREATE TABLE IF NOT EXISTS help_articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES help_categories(id) ON DELETE SET NULL,
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    body text NOT NULL,
    published boolean NOT NULL DEFAULT false,
    view_count integer NOT NULL DEFAULT 0,
    helpful_count integer NOT NULL DEFAULT 0,
    unhelpful_count integer NOT NULL DEFAULT 0,
    author_id uuid REFERENCES users(id),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published)`,

  // integrations
  `CREATE TABLE IF NOT EXISTS integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    name text NOT NULL,
    config jsonb,
    status text NOT NULL DEFAULT 'disconnected',
    last_sync_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider)`,
  `CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status)`,

  // integration_sync_logs
  `CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id uuid NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    status text NOT NULL,
    records_processed integer DEFAULT 0,
    duration_ms integer,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration ON integration_sync_logs(integration_id)`,
  `CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_created ON integration_sync_logs(created_at)`,

  // points_rules
  `CREATE TABLE IF NOT EXISTS points_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event text NOT NULL UNIQUE,
    description text,
    points integer NOT NULL,
    daily_cap integer,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,

  // push_campaigns
  `CREATE TABLE IF NOT EXISTS push_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    audience jsonb,
    payload jsonb,
    status text NOT NULL DEFAULT 'draft',
    scheduled_at timestamptz,
    sent_at timestamptz,
    recipient_count integer DEFAULT 0,
    delivered_count integer DEFAULT 0,
    opened_count integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_push_campaigns_status ON push_campaigns(status)`,
  `CREATE INDEX IF NOT EXISTS idx_push_campaigns_scheduled ON push_campaigns(scheduled_at)`,

  // reseller_invoices
  `CREATE TABLE IF NOT EXISTS reseller_invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id uuid NOT NULL,
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    gross_revenue_cents integer NOT NULL DEFAULT 0,
    commission_cents integer NOT NULL DEFAULT 0,
    payout_cents integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    paid_at timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_reseller_invoices_reseller ON reseller_invoices(reseller_id)`,
  `CREATE INDEX IF NOT EXISTS idx_reseller_invoices_status ON reseller_invoices(status)`,
];

let ok = 0, fail = 0;
for (const stmt of STATEMENTS) {
  try {
    await sql.unsafe(stmt);
    ok++;
  } catch (err) {
    fail++;
    console.error('FAIL:', stmt.split('\n')[0], '-', err.message);
  }
}
console.log(`\n✓ ${ok} statements applied, ${fail} failed.`);
await sql.end();
