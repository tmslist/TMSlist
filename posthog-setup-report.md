# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the TMS List Astro SSR project. Here's a summary of all changes made:

**Client-side**: A `posthog.astro` snippet component was created and added to `Layout.astro` so PostHog initializes on every page. `window.posthog` is now globally available with proper TypeScript types in `src/env.d.ts`.

**Server-side**: A singleton `posthog-node` client was created at `src/lib/posthog-server.ts`. All critical API routes now import this client and emit server-side events with session continuity via the `X-PostHog-Session-Id` header pattern.

**Environment variables**: `PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST`, `POSTHOG_PROJECT_TOKEN`, and `POSTHOG_HOST` were written to `.env`.

**New files created**:
- `src/lib/posthog-server.ts` — server-side PostHog singleton
- `src/components/posthog.astro` — client-side PostHog snippet

## Events instrumented

| Event | Description | File |
|---|---|---|
| `patient_registered` | New patient account created; user is also identified server-side | `src/pages/api/patient/register.ts` |
| `clinic_submitted` | New clinic submitted to the directory via website form | `src/pages/api/clinics/submit.ts` |
| `clinic_claim_initiated` | Clinic owner initiates a claim on an existing listing | `src/pages/api/clinics/claim.ts` |
| `lead_message_sent` | Patient sends a message to a clinic (primary lead conversion event) | `src/pages/api/messages/send.ts` |
| `funnel_entered` | Contact enters a nurturing drip funnel (newsletter, lead magnet, etc.) | `src/pages/api/funnel/enter.ts` |
| `review_submitted` | Authenticated patient submits a clinic review | `src/pages/api/reviews.ts` |
| `referral_tracked` | A referral link is followed and recorded | `src/pages/api/referral/track.ts` |
| `clinic_searched` | User performs a clinic/condition/city search | `src/components/react/SearchBox.tsx` |
| `search_result_clicked` | User clicks a search result (clinic, condition, or recent) | `src/components/react/SearchBox.tsx` |
| `exit_intent_shown` | Exit intent popup is triggered for a departing user | `src/components/react/ExitIntent.tsx` |
| `lead_magnet_downloaded` | User completes exit intent form and downloads a guide | `src/components/react/ExitIntent.tsx` |
| `cost_estimate_calculated` | User interacts with the TMS cost estimator widget | `src/components/react/CostEstimator.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/382987/dashboard/1478139
- **Patient Registrations Over Time**: https://us.posthog.com/project/382987/insights/AMK9uD4J
- **Lead Messages Sent to Clinics**: https://us.posthog.com/project/382987/insights/a6XJEkeA
- **Exit Intent → Lead Magnet Conversion Funnel**: https://us.posthog.com/project/382987/insights/SMvZI5SY
- **Patient Acquisition Funnel** (Search → Lead → Registration): https://us.posthog.com/project/382987/insights/5BxNoVAa
- **Clinic Supply Funnel** (Submissions, Claims, Reviews over time): https://us.posthog.com/project/382987/insights/VjXeAPc2

### Passing session ID from client to server

For unified session tracking, pass the PostHog session ID when making API calls from the client:

```javascript
const sessionId = window.posthog?.get_session_id?.() || '';
await fetch('/api/messages/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-PostHog-Session-Id': sessionId,
  },
  body: JSON.stringify({ ... }),
});
```

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
