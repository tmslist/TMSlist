---
phase: 03-admin-clinic-management
type: ui-spec
created: 2026-04-21
---

# Phase 3 UI Specification

## Design Tokens (inherited from Phase 2)

| Token | Value | Usage |
|-------|-------|-------|
| `violet-600` | `#7C3AED` | Primary actions, buttons, badges |
| `emerald-500` | `#10B981` | Success states, verified badges |
| `amber-500` | `#F59E0B` | Warning states, pending badges |
| `red-500` | `#EF4444` | Error states, rejected badges |
| `gray-50` | `#F9FAFB` | Card backgrounds |
| `gray-100` | `#F3F4F6` | Table header, dividers |

Typography:
- Display: 30px / Bricolage Grotesque / 600
- Heading: 18px / Plus Jakarta Sans / 600
- Body: 14px / Plus Jakarta Sans / 400
- Label: 12px / Plus Jakarta Sans / 500
- Caption: 11px / Plus Jakarta Sans / 400

Border radius: 12px cards, 8px buttons, 6px inputs

---

## Component Contracts

### 1. ClinicRow (table row in AdminClinics.tsx)
Extends existing `tr` with:
- Checkbox for selection (multi-select for bulk actions)
- Status badge: `verified` (emerald), `pending` (amber), `rejected` (red), `paused` (gray)
- Action menu: View Live | Edit | Compare | Clone | Delete
- "View Live" opens clinic page in new tab (`/clinics/{slug}`)
- Comparison checkbox: when 2+ selected, "Compare Selected" button appears

### 2. ClinicComparisonModal
- Triggered by "Compare Selected" button
- Full-width modal with 2-3 columns side-by-side
- Each column: clinic name, photo placeholder, key metrics
- Comparison table: rating, review count, lead count, description length, fields filled
- Completeness bar: visual percentage indicator
- "Merge" button per pair

### 3. CSVImportWizard (multi-step modal)
**Step 1 — Upload**: Drag-and-drop zone, file picker, "Download template" link
**Step 2 — Field Mapping**: Source columns (from CSV) → target dropdowns
**Step 3 — Preview**: Table showing first 10 rows with validation status (green check / red x per cell)
**Step 4 — Import**: Progress bar, row count, errors summary
States: idle, uploading, mapping, previewing, importing, complete, error

### 4. DuplicateMergeModal
- Two-panel layout: Source (left) vs Target (right) clinic
- Per-field radio: which value to keep for each field
- Summary: "Keep {N} fields from left, {M} from right"
- "Merge & Redirect" button

### 5. NPIValidationPanel
- In clinic editor sidebar or as a collapsible section
- NPI input field with format hint (10 digits)
- "Validate" button → calls NPI Registry API
- Result: Green checkmark + provider name / Red X + error
- Status: "Verified" / "Invalid NPI" / "Pending Manual Review"

### 6. TakeoverRequestCard
- Claim status badge (pending/approved/rejected)
- Email of requester, timestamp
- "Approve" / "Reject" buttons with reason dropdown
- "View Clinic" link

### 7. FeaturedDateEditor
- Toggle: "Promote to Featured"
- When enabled: Start date picker + End date picker
- "Auto-expire featured status" checkbox (default: checked)
- Shows current featured status if already promoted

### 8. BadgeAssignmentPanel
- List of badge types with checkboxes:
  - [ ] Verified (emerald)
  - [ ] Top Rated (violet)
  - [ ] New (blue)
  - [ ] Accepting New Patients (teal)
  - [ ] Featured (amber)
- "Custom badge" option: name + description + expiry date
- Bulk assign: in AdminClinics, select rows → "Assign Badge" dropdown

### 9. LocationMapEditor
- Mini Leaflet map (200px height) in clinic editor
- Draggable pin → updates lat/lng fields
- "Geocode from address" button
- Lat/Lng text inputs (editable, synced with map)
- Map style: OpenStreetMap tiles

### 10. AddressAutocomplete
- Address input field with dropdown suggestions
- Powered by Google Places API (graceful fallback if no API key)
- On select: auto-fill address, city, state, zip, lat, lng

### 11. InsuranceAutocomplete
- Multi-select input
- Type to filter: "blue" → shows matching insurance providers
- Selected items as chips below input
- Categories: major carriers (BCBS, Aetna, Cigna, etc.)

### 12. TagManager
- Existing tags as colored chips
- Click to remove
- "Add tag" with autocomplete
- Bulk select → "Add/Remove tags" action

### 13. DeleteWithRedirectModal
- Warning message
- Checkbox: "Redirect {old-slug} to another clinic"
- Dropdown to select target clinic
- Confirm button

### 14. StatusReasonModal
- When rejecting/pausing a clinic
- Dropdown with predefined reasons
- Optional free-text "Additional details"
- Submit / Cancel buttons

### 15. CloneConfirmModal
- Shows original clinic name
- New name input (pre-filled with "{name} (Copy)")
- New slug (auto-generated, editable)
- "Clone" button

---

## Color System for Badges

| Badge Type | Color | Hex |
|------------|-------|-----|
| Verified | emerald | `#10B981` |
| Top Rated | violet | `#7C3AED` |
| New | blue | `#3B82F6` |
| Accepting New Patients | teal | `#14B8A6` |
| Featured | amber | `#F59E0B` |
| Rejected/Paused | gray | `#6B7280` |

---

## Status Workflow

```
Unverified → [Auto-verify via NPI] → Verified or Flagged
Flagged → [Admin reviews] → Reject (with reason) or Approve
Verified → [Admin action] → Pause (with reason) or Delete (with redirect option)
```