import type { APIRoute } from 'astro';
import { PLANS } from '../../db/subscriptions';

export const prerender = false;

export const GET: APIRoute = async () => {
  const plans = [
    { ...PLANS.free, interval: 'forever', cta: 'Get Started Free' },
    { ...PLANS.pro,  interval: 'month',   cta: 'Start Pro Plan', popular: false },
    { ...PLANS.premium, interval: 'month', cta: 'Start Premium Plan', popular: true },
    { ...PLANS.enterprise, interval: 'month', cta: 'Contact Sales' },
  ];
  return new Response(JSON.stringify({ plans }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
};
