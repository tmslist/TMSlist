// Runs the SQL each new admin endpoint executes, against the live DB.
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const checks = [
  {
    name: 'dashboard-stats: parallel COUNT queries',
    fn: async () => {
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const [c, cv, cp, c7d, rp, lt, l7, u] = await Promise.all([
        sql`SELECT count(*)::int c FROM clinics`,
        sql`SELECT count(*)::int c FROM clinics WHERE verified=true`,
        sql`SELECT count(*)::int c FROM clinics WHERE verified=false`,
        sql`SELECT count(*)::int c FROM clinics WHERE created_at >= ${sevenDaysAgo}`,
        sql`SELECT count(*)::int c FROM reviews WHERE approved=false`,
        sql`SELECT count(*)::int c FROM leads`,
        sql`SELECT count(*)::int c FROM leads WHERE created_at >= ${sevenDaysAgo}`,
        sql`SELECT count(*)::int c FROM users`,
      ]);
      return { clinics: c[0].c, verified: cv[0].c, pending: cp[0].c, added7d: c7d[0].c, pendingReviews: rp[0].c, leads: lt[0].c, leads7d: l7[0].c, users: u[0].c };
    },
  },
  {
    name: 'forum/analytics: aggregations',
    fn: async () => {
      const [posts, comments, weekly] = await Promise.all([
        sql`SELECT count(*)::int c FROM forum_posts WHERE status='published'`,
        sql`SELECT count(*)::int c FROM forum_comments WHERE status='published'`,
        sql`SELECT count(*)::int c FROM forum_posts WHERE created_at >= now() - interval '7 days'`,
      ]);
      return { posts: posts[0].c, comments: comments[0].c, postsThisWeek: weekly[0].c };
    },
  },
  {
    name: 'compliance-center: aggregated counts',
    fn: async () => {
      const [legal, retention, gdpr, consent] = await Promise.all([
        sql`SELECT count(*)::int c FROM legal_documents`,
        sql`SELECT count(*)::int c FROM retention_policies`,
        sql`SELECT count(*)::int c FROM gdpr_requests`,
        sql`SELECT count(*)::int c FROM consent_records`,
      ]);
      return { legal: legal[0].c, retention: retention[0].c, gdpr: gdpr[0].c, consent: consent[0].c };
    },
  },
  {
    name: 'ai-usage-logs: aggregated totals',
    fn: async () => {
      const r = await sql`
        SELECT count(*)::int calls,
               coalesce(sum(prompt_tokens),0)::int prompt_tokens,
               coalesce(sum(completion_tokens),0)::int completion_tokens,
               coalesce(sum(cost_cents),0)::numeric total_cost_cents
        FROM ai_usage_logs
        WHERE created_at >= now() - interval '30 days'`;
      return r[0];
    },
  },
  {
    name: 'achievements: list',
    fn: async () => {
      const r = await sql`SELECT key, name, points FROM achievements ORDER BY points DESC LIMIT 3`;
      return r;
    },
  },
  {
    name: 'ai_models: list (seeded)',
    fn: async () => {
      const r = await sql`SELECT provider, model_id, display_name FROM ai_models ORDER BY enabled DESC, provider`;
      return r;
    },
  },
  {
    name: 'email_templates: list (seeded)',
    fn: async () => {
      const r = await sql`SELECT key, subject FROM email_templates ORDER BY key LIMIT 3`;
      return r;
    },
  },
  {
    name: 'badge_templates: list (seeded)',
    fn: async () => {
      const r = await sql`SELECT key, tier FROM badge_templates ORDER BY tier`;
      return r;
    },
  },
  {
    name: 'points_rules: list (seeded)',
    fn: async () => {
      const r = await sql`SELECT event, points FROM points_rules ORDER BY points DESC LIMIT 3`;
      return r;
    },
  },
  {
    name: 'help_categories: list (seeded)',
    fn: async () => {
      const r = await sql`SELECT slug, name FROM help_categories ORDER BY sort_order`;
      return r;
    },
  },
  {
    name: 'sla_metrics: list',
    fn: async () => {
      const r = await sql`SELECT count(*)::int c FROM sla_metrics`;
      return r[0];
    },
  },
  {
    name: 'disaster_recovery_configs: list',
    fn: async () => {
      const r = await sql`SELECT count(*)::int c FROM disaster_recovery_configs`;
      return r[0];
    },
  },
  {
    name: 'locales: list',
    fn: async () => {
      const r = await sql`SELECT count(*)::int c FROM locales`;
      return r[0];
    },
  },
];

let passed = 0, failed = 0;
for (const c of checks) {
  try {
    const res = await c.fn();
    console.log(`✓ ${c.name}`);
    console.log('   →', JSON.stringify(res));
    passed++;
  } catch (err) {
    console.log(`✗ ${c.name}`);
    console.log('   →', err.message);
    failed++;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
await sql.end();
