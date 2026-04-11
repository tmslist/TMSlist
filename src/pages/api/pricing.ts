import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const plans = [
    { id: 'free', name: 'Basic Listing', price: 0, interval: 'forever', features: ['Basic clinic profile', 'Show in search results', 'Receive patient enquiries', 'Up to 2 doctor profiles'], cta: 'Get Started Free' },
    { id: 'verified', name: 'Verified', price: 49, interval: 'month', features: ['Everything in Basic', 'Verified badge', 'Priority search placement', 'Unlimited doctor profiles', 'Review response', 'Analytics dashboard'], cta: 'Get Verified', popular: true },
    { id: 'featured', name: 'Featured', price: 149, interval: 'month', features: ['Everything in Verified', 'Featured badge & top placement', 'Lead notifications (email + SMS)', 'Weekly performance digest', 'Dedicated support'], cta: 'Get Featured' },
  ];
  return new Response(JSON.stringify({ plans }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
};
