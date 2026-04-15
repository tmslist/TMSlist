# TMSList — Clinic & Admin Portal

## What This Is

TMSList is a medical clinic directory platform (focused on TMS/neuromodulation clinics) built with Astro + React + PostgreSQL. It has two distinct portals: an Admin Portal for internal staff management and a Doctor/Clinic Portal for clinic owners to manage their profiles, leads, and reviews.

## Core Value

Help patients find and connect with TMS clinics, and help clinic owners grow their practice through a complete practice management experience.

## Requirements

### Validated

(None yet — this is the initial milestone)

### Active

- [ ] Implement 100 portal improvements across auth, admin, and clinic portals

### Out of Scope

- Mobile native app — web-first, mobile app deferred
- Multi-language/i18n — single language for now
- EHR/EMR integration — too complex for initial release
- Video consultation — out of scope

## Context

**Project type:** Brownfield — existing codebase with functional admin portal and clinic portal.
**Stack:** Astro (SSR) + React islands + PostgreSQL/Drizzle + Tailwind CSS + Vercel
**Key portals:**
- Admin Portal: `/admin/*` — clinic management, leads, reviews, blog CMS, analytics, SEO, settings
- Clinic Portal: `/portal/*` — clinic profile editor, leads viewer, reviews viewer, job listings, analytics
**Recent work (commit aed2fc3):** doctor portal upgrades — claim clinic, billing, pricing, auth
**Critical issues identified:** JWT_SECRET missing (silent auth failure), magic tokens stored unhashed, social proof API unauthenticated

## Constraints

- **Tech stack:** Astro + React + Drizzle ORM + PostgreSQL + Tailwind CSS — no changes to core stack
- **Database:** Existing PostgreSQL schema — additions via migrations
- **Auth:** Existing session + magic link system — enhancements to existing auth
- **No `as any` abuse:** Fix type safety issues identified in code review
- **Backward compatibility:** All changes must not break existing clinic portal or admin portal workflows

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing magic link auth | Already implemented and working | — Pending |
| React islands for interactivity | Already established pattern | — Pending |
| Tailwind CSS for styling | Already in use | — Pending |
| Drizzle ORM for data | Already in use | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 after initial milestone definition*
