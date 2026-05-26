# TMS List Admin Design System

## Overview

The Admin Design System extends the public **Editorial Warm** brand (teal/ocean palette with terracotta accents) to create a cohesive internal experience. All admin components should use this system for visual consistency.

---

## Design Tokens

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--admin-bg-base` | `#0B0D10` | Deepest background |
| `--admin-bg-surface` | `#111418` | Card/panel surfaces |
| `--admin-bg-elevated` | `#161B22` | Elevated elements, hover |
| `--admin-bg-overlay` | `#1C2128` | Overlays, dropdowns |
| `--admin-border-subtle` | `#21262D` | Subtle dividers |
| `--admin-border-default` | `#30363D` | Default borders |
| `--admin-border-emphasis` | `#484F58` | Emphasized borders |
| `--admin-text-primary` | `#E6EDF3` | Primary text |
| `--admin-text-secondary` | `#8B949E` | Secondary/muted text |
| `--admin-text-tertiary` | `#6E7681` | Tertiary/disabled text |

### Brand Accent (extends public brand)

| Token | Hex | Usage |
|-------|-----|-------|
| `--admin-accent` | `#2E7A8F` | Primary accent (teal) |
| `--admin-accent-hover` | `#3A8FA8` | Accent hover |
| `--admin-accent-muted` | `#1B4B5A` | Muted accent background |
| `--admin-accent-subtle` | `rgba(46,122,143,0.15)` | Subtle accent bg |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--admin-success` | `#3FB950` | Success green |
| `--admin-warning` | `#D29922` | Warning amber |
| `--admin-error` | `#F85149` | Error red |
| `--admin-info` | `#58A6FF` | Info blue |

### Chart Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--admin-chart-1` | `#2E7A8F` | Teal (brand) — primary data |
| `--admin-chart-2` | `#5BA8BD` | Light teal |
| `--admin-chart-3` | `#C9654A` | Terracotta (brand warm) |
| `--admin-chart-4` | `#8B949E` | Neutral |
| `--admin-chart-5` | `#3FB950` | Success |
| `--admin-chart-6` | `#D29922` | Warning |

---

## Typography

**Font:** Plus Jakarta Sans (matches public site)

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Labels | 11px | 600 semibold | Stat labels, table headers |
| Body | 14px | 400/500 | Default content |
| Headings | 18-24px | 600 semibold | Page titles, section heads |

---

## Components

### AdminCard
Primary container component for cards and panels.

```tsx
import { AdminCard } from './admin/AdminBase';

<AdminCard interactive>
  Content here
</AdminCard>
```

**Props:**
- `interactive` — Adds hover glow effect
- `padding` — `'none' | 'sm' | 'md' | 'lg'`
- `className` — Additional classes

---

### AdminButton
Action buttons with consistent styling.

```tsx
import { AdminButton } from './admin/AdminBase';

<AdminButton variant="primary" size="md" icon={<Icon />}>
  Click me
</AdminButton>
```

**Variants:**
- `primary` — Teal background, white text (main actions)
- `secondary` — Dark surface with border (secondary actions)
- `ghost` — Transparent with text color (tertiary actions)
- `danger` — Red background (destructive actions)

**Sizes:** `sm` | `md` | `lg`

---

### AdminStat
Key metric display with change indicator.

```tsx
import { AdminStat } from './admin/AdminBase';

<AdminStat
  label="Total Leads"
  value={1234}
  change={12.5}
  icon={<ChartIcon />}
/>
```

---

### AdminBadge
Status/category indicators.

```tsx
import { AdminBadge } from './admin/AdminBase';

<AdminBadge variant="success">Active</AdminBadge>
```

**Variants:** `default` | `accent` | `success` | `warning` | `error` | `info`

---

### AdminInput
Form inputs with consistent styling.

```tsx
import { AdminInput } from './admin/AdminBase';

<AdminInput
  label="Email"
  placeholder="Enter email"
  type="email"
/>
```

---

### AdminTable
Full-featured data table with sorting, filtering, pagination.

```tsx
import { AdminTable } from './admin/AdminTable';

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'status', header: 'Status', render: (row) => <AdminBadge>{row.status}</AdminBadge> },
];

<AdminTable
  columns={columns}
  fetchFn={fetchData}
  searchPlaceholder="Search clinics..."
  rowActions={(row) => <AdminButton size="sm">Edit</AdminButton>}
/>
```

---

### AdminLayout
Full-page layout with sidebar navigation.

```tsx
import { AdminLayout } from './admin/AdminLayout';

<AdminLayout currentPage="analytics" userEmail="admin@tmslist.com" isAdmin>
  <YourPageContent />
</AdminLayout>
```

---

## Utility Classes

### Tailwind-Style Classes

```css
/* Backgrounds */
.bg-admin-base { background-color: var(--admin-bg-base); }
.bg-admin-surface { background-color: var(--admin-bg-surface); }
.bg-admin-accent { background-color: var(--admin-accent); }

/* Text Colors */
.text-admin-primary { color: var(--admin-text-primary); }
.text-admin-secondary { color: var(--admin-text-secondary); }
.text-admin-accent { color: var(--admin-accent); }

/* Border Colors */
.border-admin-subtle { border-color: var(--admin-border-subtle); }
.border-admin-default { border-color: var(--admin-border-default); }
```

---

## Migration Guide

### Before (Hardcoded Colors)
```tsx
<div className="bg-[#111418] rounded-xl border border-[#1E242C]">
  <p className="text-xs font-semibold text-[#8B9DB5]">Label</p>
  <p className="text-3xl font-semibold text-[#E6EAF0]">1,234</p>
</div>
```

### After (Using Design System)
```tsx
<AdminCard>
  <p className="text-xs font-semibold text-[#8B949E]">Label</p>
  <p className="text-3xl font-semibold text-[#E6EDF3]">1,234</p>
</AdminCard>
```

### Before (Custom Button)
```tsx
<button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Submit
</button>
```

### After (Using AdminButton)
```tsx
<AdminButton variant="primary">
  Submit
</AdminButton>
```

---

## Files

| File | Purpose |
|------|---------|
| `src/styles/admin-design-system.css` | CSS tokens and utility classes |
| `src/components/react/admin/AdminBase.tsx` | Core UI components |
| `src/components/react/admin/AdminLayout.tsx` | Layout components |
| `src/components/react/AdminTable.tsx` | Data table component |

---

## Quick Reference

### Color Conversion

| Old Color | New Token |
|-----------|-----------|
| `#111418` | `bg-[#111418]` or `bg-admin-surface` |
| `#1E242C` | `border-[#21262D]` or `border-admin-subtle` |
| `#8B9DB5` | `text-[#8B949E]` or `text-admin-secondary` |
| `#E6EAF0` | `text-[#E6EDF3]` or `text-admin-primary` |
| `#4F7CFF` | `#2E7A8F` (use brand accent) |
| `#4F7CFF` bg | `bg-[#2E7A8F]` or `bg-admin-accent` |

---

## Checklist for New Admin Components

- [ ] Import from `./admin/AdminBase`
- [ ] Replace hardcoded colors with design tokens
- [ ] Use `AdminCard` for containers
- [ ] Use `AdminButton` for actions
- [ ] Use `AdminBadge` for status indicators
- [ ] Use `AdminInput` for form fields
- [ ] Check contrast ratios (WCAG AA minimum)
- [ ] Test on mobile viewport
