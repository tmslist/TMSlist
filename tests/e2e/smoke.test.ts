import { describe, it, expect } from 'vitest';
const BASE = process.env.TEST_URL || 'http://localhost:4321';

describe('Smoke Tests', () => {
  it('homepage returns 200', async () => { expect((await fetch(BASE)).status).toBe(200); });
  it('admin login returns 200', async () => { expect((await fetch(`${BASE}/admin/login`)).status).toBe(200); });
  it('portal login returns 200', async () => { expect((await fetch(`${BASE}/portal/login`)).status).toBe(200); });
  it('health check returns ok', async () => {
    const res = await fetch(`${BASE}/api/health`);
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('ok');
  });
  it('admin dashboard redirects without auth', async () => {
    expect((await fetch(`${BASE}/admin/dashboard`, { redirect: 'manual' })).status).toBe(302);
  });
});
