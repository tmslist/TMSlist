---
phase: 03-admin-clinic-management
type: research
created: 2026-04-21
---

# Phase 3 Research: Admin Clinic Management

15 requirements: CLIN-01 through CLIN-15.

## Schema Readiness Assessment

### clinics table
- Already has: `verified`, `isFeatured`, `ratingAvg`, `reviewCount`, `description`, `deletedAt`, `lat/lng` (decimal), `address/city/state/zip`
- Missing: `npi`, `license_number`, `featuredStartAt`, `featuredEndAt`, `statusReason`

### clinicBadges table (existing)
```typescript
clinicBadges = pgTable('clinic_badges', {
  id, clinicId, badgeType, badgeName, badgeDescription,
  awardedAt, expiresAt, metadata // JSONB
})
```
Badges are already modeled. CLIN-08 (badging system) extends this.

### clinicClaims table (existing)
```typescript
clinicClaims = pgTable('clinic_claims', {
  id, clinicId, userId, email, verificationToken,
  status: enum('pending'|'approved'|'rejected'|'expired'),
  verifiedAt, createdAt, expiresAt
})
```
Takeover workflow (CLIN-06) uses this existing table.

## Key Technical Decisions

### CLIN-03: Bulk CSV Import
- **Approach**: Papa Parse for CSV parsing, streaming for large files
- **Field mapping UI**: Show source columns → target schema mapping with dropdowns
- **Validation**: NPI format (10 digits), required fields, duplicate detection
- **Import strategy**: Batch insert with 50 records per transaction for rollback safety
- **Async**: For 100+ clinics, use server-side queue (or simple async with status polling)
- **Schema change needed**: Add `npi`, `license_number` columns to clinics table

### CLIN-05: NPI Validation
- NPI format: 10-digit number, first digit must be 1 or 2
- NPI Registry API: `https://npiregistry.cms.hhs.gov/api/?number={npi}&version=2.1`
- Auto-verify if NPI valid; flag invalid/missing for manual review
- Need `npi` column in clinics table (add via migration)

### CLIN-09: Location Geocoding Map
- Use Leaflet + OpenStreetMap (free, no API key needed) — Google Maps requires key
- Show lat/lng on mini-map in clinic editor; draggable marker to update
- Reverse geocode on address input → fill lat/lng
- Libraries: `react-leaflet`, `leaflet`
- SSR issue: Leaflet requires `window` — use `isClient` guard pattern (same as dnd-kit)

### CLIN-10: Google Places Autocomplete
- Requires `GOOGLE_PLACES_API_KEY` env var
- Load Google Maps JS SDK conditionally
- Falls back to manual text input if key not configured
- Cache recent lookups in memory to avoid quota exhaustion

### CLIN-11: Insurance Autocomplete
- Static data: common insurance providers list
- "blue" → "Blue Cross Blue Shield", "Blue Shield of CA", "Anthem Blue Cross"
- No API needed — maintain JSON file of insurance providers
- Match on substring, case-insensitive

### CLIN-04: Duplicate Merge
- Algorithm: match on name + address similarity, or name + phone
- Levenshtein distance ≤ 3 for name match + same city = potential duplicate
- Merge UI: side-by-side comparison, radio buttons per field to pick source
- Redirect old slug to merged clinic (301)

### CLIN-02: Comparison Mode
- Select 2-3 clinics via checkboxes, "Compare Selected" button
- Side-by-side table: name, rating, review count, lead count, completeness score
- "Completeness" = percentage of non-null required fields

### CLIN-14: Status Reasons
- Add `statusReason` text column to clinics table
- When rejecting/pausing: dropdown with predefined reasons + free-text
- Options: "Duplicate listing", "Invalid information", "Policy violation", "Owner request", "Other"

### CLIN-07: Featured Date Picker
- `isFeatured` → `featuredStartAt` and `featuredEndAt` datetime columns
- Cron job or on-demand check: auto-expire if `featuredEndAt < now`
- Date picker component in clinic editor

### CLIN-08: Badge Assignment UI
- Badge types: "verified", "top_rated", "new", "accepting_new_patients", "featured"
- Assign via checkbox in clinic editor
- Badge display: colored chip with label
- Bulk badge assignment in AdminClinics table (select → "Assign Badge" action)

### CLIN-12: Tag Manager
- `specialties` and `tags` arrays in clinic — admin bulk editor
- Multi-select interface for adding/removing tags across multiple clinics
- Auto-complete from existing tags in system

### CLIN-13: Soft Delete Redirect
- On delete: modal with option to "redirect slug to another clinic"
- Store redirect in `slug_redirects` table
- Apply redirect in `getClinicBySlug` logic before 404

### CLIN-15: Clone Button
- Copy all fields except id, slug, createdAt, ownerUserId
- Generate new slug: `{original-slug}-2` or `{original-slug}-{timestamp}`
- Reset `verified=false`, `isFeatured=false`, `ratingAvg='0'`, `reviewCount=0`

## Dependencies

| Requirement | Depends On |
|-------------|------------|
| CLIN-03 (CSV import) | CLIN-05 (NPI schema), isFeatured date schema |
| CLIN-04 (duplicate merge) | CLIN-13 (redirect logic) |
| CLIN-05 (NPI validation) | Schema migration |
| CLIN-09 (map) | None — can run independently |
| CLIN-10 (Places) | GOOGLE_PLACES_API_KEY env var |

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| CSV import memory with 500+ rows | Medium | Stream processing, chunked inserts |
| Google Places API key missing | Low | Graceful fallback to manual address input |
| NPI API rate limiting | Medium | Cache NPI results, retry with backoff |
| Leaflet SSR hydration mismatch | Low | `isClient` guard already proven in Phase 2 |