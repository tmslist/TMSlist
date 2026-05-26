/**
 * Cron endpoint auth — fails closed if CRON_SECRET is not configured.
 *
 * Both prior patterns in this codebase were fail-open:
 *   1) `if (cronSecret && header !== ...)` — anyone could call when env unset.
 *   2) `if (header !== Bearer ${process.env.X || undefined})` — attacker
 *      sending `Bearer undefined` would authenticate when env unset.
 *
 * Returns null on success; on failure returns a 401/500 Response that the
 * caller should immediately return.
 */
export function requireCronAuth(request: Request): Response | null {
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[cron] CRON_SECRET is not configured — refusing to run');
    return new Response('Cron not configured', { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  return null;
}
