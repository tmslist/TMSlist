# tmslist (infinite-hawking)

TMS clinic directory site. Astro 6 SSR + React 19 islands, Drizzle/Postgres, Tailwind 4, PostHog.

## Operating mode
Act, don't ask. Full authorization for routine work — edits, builds, tests, deps, refactors, bug fixes, commits. If you find a bug, fix it. If something can be improved, improve it. Don't stop until the task is done. See `~/.claude/CLAUDE.md` for the full rule set; the same applies here.

## Commands
- `npm run dev` — Astro dev server (4321)
- `npm run build` — production build to `dist/`
- `npm run db:push` — apply Drizzle schema to Postgres
- `npm run db:studio` — Drizzle Studio
- `npm run test` — vitest
- `npm run test:e2e` — playwright

## Layout
- `src/pages/` — routes (`api/` = endpoints, `admin/` `doctor/` `clinic/` `account/` = dashboards)
- `src/components/` — `.astro` server components; `react/` = client islands
- `src/db/` — Drizzle schema and queries
- `src/content/` — MD/MDX collections (blog, protocols, legal, commercial, quiz, research)
- `src/lib/` — shared utils; `src/middleware.ts` — auth/routing
- `drizzle/` — migrations

## Conventions
- **Auth**: use `getSessionFromRequest(request)` from `src/lib/auth` — NOT `checkSession`.
- **Tailwind 4**: uses `@tailwindcss/vite` plugin; classes are `text-gray-*` (not `text-slate-*`) per design system.
- **DB**: Postgres via `postgres` driver + Drizzle. Never sqlite.
- **Astro pages**: no TS type annotations inside `.astro` script blocks — let Astro infer.
- **dist/**: clear it (`rm -rf dist`) if you hit module-not-found on prerender.

## Don't
- Don't edit `package-lock.json`, `dist/`, `.astro/`, generated migration SQL, or `node_modules/`.
- Don't commit `.env*`.
- Don't add a CLAUDE.md inside `claude-mem/` — it has its own.

## Reference
- `marketing-context.md` — brand/voice
- `DESIGN.md` — design system
- `.planning/` — GSD planning artifacts (don't include in PR branches; use `/gsd-pr-branch`)
