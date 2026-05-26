// Creates pre-existing schema.ts tables that never made it to the live DB
// because of unrelated drizzle-kit prompts. Idempotent; only the tables my
// new admin endpoints actually need.
// Run: node --env-file=.env.local scripts/migrate-pre-existing-drift.mjs

import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const STMTS = [
  // legal_documents (compliance-center)
  `CREATE TABLE IF NOT EXISTS legal_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    version text NOT NULL,
    content text NOT NULL,
    is_active boolean DEFAULT false,
    created_by uuid REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_doc_unique ON legal_documents(type, version)`,

  // retention_policies (compliance-center)
  `CREATE TABLE IF NOT EXISTS retention_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    retention_days integer NOT NULL,
    description text,
    active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  // gdpr_requests (compliance-center aggregates)
  `CREATE TABLE IF NOT EXISTS gdpr_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    type text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    request_data jsonb,
    response_data jsonb,
    requested_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user ON gdpr_requests(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status)`,

  // consent_records (compliance-center aggregates)
  `CREATE TABLE IF NOT EXISTS consent_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    consent_type text NOT NULL,
    granted boolean NOT NULL,
    version text,
    ip_address text,
    user_agent text,
    granted_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_consent_records_user ON consent_records(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_consent_records_type ON consent_records(consent_type)`,

  // sla_metrics
  `CREATE TABLE IF NOT EXISTS sla_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period text NOT NULL,
    uptime_percent numeric(5, 3) NOT NULL DEFAULT 100,
    incident_count integer DEFAULT 0,
    total_downtime_minutes integer DEFAULT 0,
    affected_users integer DEFAULT 0,
    resolved_within_rto boolean DEFAULT true,
    compliance_status text DEFAULT 'met',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sla_metrics_period ON sla_metrics(period)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_sla_metrics_period_unique ON sla_metrics(period)`,

  // disaster_recovery_configs
  `CREATE TABLE IF NOT EXISTS disaster_recovery_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    rpo_minutes integer NOT NULL DEFAULT 60,
    rto_minutes integer NOT NULL DEFAULT 240,
    failover_enabled boolean DEFAULT false,
    failover_status text DEFAULT 'standby',
    last_dr_test_at timestamptz,
    last_dr_test_result text,
    dr_test_logs jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,

  // locales
  `CREATE TABLE IF NOT EXISTS locales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    native_name text,
    is_active boolean DEFAULT false,
    is_rtl boolean DEFAULT false,
    plural_rules text,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,

  // translations
  `CREATE TABLE IF NOT EXISTS translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    locale_code text NOT NULL REFERENCES locales(code),
    key text NOT NULL,
    value text NOT NULL,
    context text,
    updated_by uuid REFERENCES users(id),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_translations_locale ON translations(locale_code)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_translations_unique ON translations(locale_code, key)`,
  `CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key)`,

  // backups
  `CREATE TABLE IF NOT EXISTS backups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL DEFAULT 'full',
    status text NOT NULL DEFAULT 'pending',
    size_bytes integer,
    location text,
    scheduled_at timestamptz,
    completed_at timestamptz,
    created_by uuid REFERENCES users(id),
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status)`,
  `CREATE INDEX IF NOT EXISTS idx_backups_created ON backups(created_at)`,

  // backup_schedules
  `CREATE TABLE IF NOT EXISTS backup_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL DEFAULT 'full',
    frequency text NOT NULL DEFAULT 'daily',
    retention_count integer DEFAULT 7,
    enabled boolean DEFAULT true,
    last_run_at timestamptz,
    next_run_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_backup_schedules_enabled ON backup_schedules(enabled)`,

  // leaderboards (custom-leaderboards endpoint)
  `CREATE TABLE IF NOT EXISTS leaderboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    period text NOT NULL,
    category text NOT NULL,
    rankings jsonb NOT NULL,
    generated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON leaderboards(period, category)`,

  // experiments + variants (admin/experiments endpoint)
  `CREATE TABLE IF NOT EXISTS experiments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    description text,
    status text NOT NULL DEFAULT 'draft',
    primary_metric text,
    start_date timestamptz,
    end_date timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS experiment_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id uuid NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    variant_key text NOT NULL,
    description text,
    weight integer DEFAULT 50,
    is_control boolean DEFAULT false,
    metrics jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_experiment_variants_exp ON experiment_variants(experiment_id)`,

  // feature_flags (admin/feature-flags endpoint)
  `CREATE TABLE IF NOT EXISTS feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text NOT NULL UNIQUE,
    enabled boolean DEFAULT false,
    description text,
    rollout_percentage integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
];

let ok = 0, fail = 0;
for (const stmt of STMTS) {
  try { await sql.unsafe(stmt); ok++; }
  catch (err) { fail++; console.error('FAIL:', stmt.split('\n')[0].slice(0, 80), '-', err.message); }
}
console.log(`✓ ${ok} statements applied, ${fail} failed.`);
await sql.end();
