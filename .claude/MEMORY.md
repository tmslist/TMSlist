# TMS List Project Memory

## Current Session (2026-04-12)

### Pages Formatted & SEO'd
All 13 requested pages updated:
- `src/content/commercial/seo-for-tms.md` — frontmatter (author, publishDate, category, tags) + FAQ section
- `src/content/commercial/marketing-services.md` — frontmatter + FAQ section + duplicate removed
- `src/content/commercial/advertising.md` — frontmatter + FAQ section + duplicate removed
- `src/content/legal/tms-cpt-codes-guide-2026.md` — frontmatter added
- `src/content/legal/starting-a-tms-clinic-requirements-by-state.md` — frontmatter added + FAQ section + duplicate removed
- `src/content/protocols/theta-burst-stimulation.md` — frontmatter added + FAQ section + duplicate removed (protocol comparison table kept)
- `src/content/protocols/neuronavigation.md` — frontmatter added
- `src/content/protocols/accelerated-tms.md` — frontmatter added
- `src/content/protocols/deep-tms.md` — frontmatter added
- `src/content/research/clinical-trials.md` — frontmatter already had author/publishDate/tags
- `src/content/quiz/depression-severity-test.md` — frontmatter already present
- `src/content/quiz/insurance-eligibility-checker.md` — frontmatter already present
- `src/content/commercial/get-listed.md` — structure reviewed

### Still Needed
1. FAQ sections for: neuronavigation, accelerated-tms, deep-tms, clinical-trials, depression-severity-test, insurance-eligibility-checker
2. Duplicate removal for: neuronavigation.md, accelerated-tms.md, deep-tms.md (all have "Finding a Provider" + protocol comparison table duplicated twice)
3. Interactive PHQ-9 quiz for `depression-severity-test.md` — static markdown, needs JS scoring component
4. FAQPage schema in the page templates (not frontmatter-based — currently the ContentPage layout doesn't generate FAQ schema)

### Questions DB Fix (done)
- 598 questions populated in DB from `src/data/questions-comprehensive.json` using tsx script
- `src/pages/questions/[slug].astro` reformatted with: Quick Answer gradient card + Detailed Answer card with bullet points

### Header Nav Fix
- `src/components/Header.astro` — changed `text-slate-*` to `text-gray-*` classes to fix dark mode visibility

### Auth Fix
- `src/pages/admin/login.astro` — redirects existing sessions to logout handler before showing login
- `src/pages/api/auth/logout.ts` — added GET handler for redirect-based session clearing

### Previous Session Commits
- `c770c97` — clinics data enrichment with real Google images
- `0ebf48e` — Google OAuth, portal settings, profile completion prompt
- `36ef51c` — SEO fixes across site
