---
name: TMS List Admin Design System
version: "alpha"
description: Dark-themed internal admin interface extending the editorial warm public brand

colors:
  bg-base: "#0B0D10"
  bg-surface: "#111418"
  bg-elevated: "#161B22"
  bg-overlay: "#1C2128"
  border-subtle: "#21262D"
  border-default: "#30363D"
  border-emphasis: "#484F58"
  text-primary: "#E6EDF3"
  text-secondary: "#8B949E"
  text-tertiary: "#6E7681"
  text-inverse: "#0D1117"
  accent: "#2E7A8F"
  accent-hover: "#3A8FA8"
  accent-muted: "#1B4B5A"
  accent-subtle: "rgba(46,122,143,0.15)"
  success: "#3FB950"
  success-muted: "rgba(63,185,80,0.15)"
  warning: "#D29922"
  warning-muted: "rgba(210,153,34,0.15)"
  error: "#F85149"
  error-muted: "rgba(248,81,73,0.15)"
  info: "#58A6FF"
  info-muted: "rgba(88,166,255,0.15)"
  chart-1: "#2E7A8F"
  chart-2: "#5BA8BD"
  chart-3: "#C9654A"
  chart-4: "#8B949E"
  chart-5: "#3FB950"
  chart-6: "#D29922"

typography:
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: 600
    letterSpacing: 0.08em
    textTransform: uppercase
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: 400
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: 400
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: 400
  heading-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: 600
  heading-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: 600
  heading-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: 600
  stat-value:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1
  mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: 400

rounded:
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px

shadows:
  sm: "0 1px 2px rgba(0,0,0,0.3)"
  md: "0 4px 8px rgba(0,0,0,0.3)"
  lg: "0 8px 24px rgba(0,0,0,0.4)"
  glow: "0 0 20px rgba(46,122,143,0.3)"

components:
  card:
    backgroundColor: "{colors.bg-surface}"
    borderColor: "{colors.border-subtle}"
    borderRadius: "{rounded.lg}"
  card-interactive:
    backgroundColor: "{colors.bg-surface}"
    borderColor: "{colors.border-subtle}"
    borderRadius: "{rounded.lg}"
    hoverBorderColor: "{colors.accent}"
    hoverBoxShadow: "{shadows.glow}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    borderRadius: "{rounded.md}"
    padding: "{spacing.2} {spacing.4}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    transform: "translateY(-1px)"
    boxShadow: "{shadows.md}"
  button-secondary:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-default}"
    borderRadius: "{rounded.md}"
    padding: "{spacing.2} {spacing.4}"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.text-secondary}"
    borderRadius: "{rounded.md}"
    padding: "{spacing.2} {spacing.3}"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "#ffffff"
    borderRadius: "{rounded.md}"
    padding: "{spacing.2} {spacing.4}"
  badge-default:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-secondary}"
    borderRadius: "{rounded.full}"
    padding: "2px {spacing.2}"
  badge-accent:
    backgroundColor: "{colors.accent-subtle}"
    textColor: "{colors.accent}"
    borderRadius: "{rounded.full}"
    padding: "2px {spacing.2}"
  badge-success:
    backgroundColor: "{colors.success-muted}"
    textColor: "{colors.success}"
    borderRadius: "{rounded.full}"
    padding: "2px {spacing.2}"
  badge-warning:
    backgroundColor: "{colors.warning-muted}"
    textColor: "{colors.warning}"
    borderRadius: "{rounded.full}"
    padding: "2px {spacing.2}"
  badge-error:
    backgroundColor: "{colors.error-muted}"
    textColor: "{colors.error}"
    borderRadius: "{rounded.full}"
    padding: "2px {spacing.2}"
  badge-info:
    backgroundColor: "{colors.info-muted}"
    textColor: "{colors.info}"
    borderRadius: "{rounded.full}"
    padding: "2px {spacing.2}"
  input:
    backgroundColor: "{colors.bg-elevated}"
    borderColor: "{colors.border-subtle}"
    borderRadius: "{rounded.md}"
    textColor: "{colors.text-primary}"
    focusBorderColor: "{colors.accent}"
    focusBoxShadow: "0 0 0 3px {colors.accent-subtle}"
  table-header:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-secondary}"
    fontSize: 11px
    fontWeight: 600
    textTransform: uppercase
    letterSpacing: 0.05em
  table-cell:
    textColor: "{colors.text-primary}"
    borderBottomColor: "{colors.border-subtle}"
  nav-item:
    textColor: "{colors.text-secondary}"
    hoverBackgroundColor: "{colors.bg-elevated}"
    hoverTextColor: "{colors.text-primary}"
  nav-item-active:
    backgroundColor: "{colors.accent-subtle}"
    textColor: "{colors.accent}"
  tab:
    textColor: "{colors.text-secondary}"
    hoverTextColor: "{colors.text-primary}"
    activeTextColor: "{colors.accent}"
    activeBorderColor: "{colors.accent}"
  modal-overlay:
    backgroundColor: "rgba(0,0,0,0.7)"
    backdropFilter: "blur(4px)"
  modal:
    backgroundColor: "{colors.bg-surface}"
    borderColor: "{colors.border-default}"
    borderRadius: "{rounded.xl}"
  progress-bar:
    backgroundColor: "{colors.accent}"
    borderRadius: 3px
  skeleton:
    borderRadius: "{rounded.sm}"
---

# TMS List Admin Design System

## Overview

Dark-themed internal admin interface extending the **Editorial Warm** public brand (teal/ocean palette with terracotta accents) for a cohesive internal experience. The UI evokes a premium developer tool — think Linear, Vercel Dashboard, or Raycast — with deep backgrounds, crisp teal accents, and clear hierarchy.

This design system is intended for the admin dashboard, internal tooling, and any authenticated internal surfaces. The public-facing marketing site uses a lighter, warmer Editorial Warm palette.

## Colors

### Background Scale

The background scale follows a dark-to-lighter progression optimized for reduced eye strain during extended admin sessions:

- **Base (`#0B0D10`)** — Deepest background, used for the main app shell
- **Surface (`#111418`)** — Card and panel backgrounds
- **Elevated (`#161B22`)** — Hover states, raised elements
- **Overlay (`#1C2128`)** — Dropdowns, tooltips, modals

### Border Scale

- **Subtle (`#21262D`)** — Hairline dividers within components
- **Default (`#30363D`)** — Standard borders, input fields
- **Emphasis (`#484F58`)** — Focused states, active elements

### Text Scale

- **Primary (`#E6EDF3`)** — Headlines, key values, interactive labels
- **Secondary (`#8B949E`)** — Supporting text, metadata
- **Tertiary (`#6E7681`)** — Placeholders, disabled states

### Brand Accent

The teal accent (`#2E7A8F`) connects the admin to the public brand's ocean palette. It is used sparingly for interactive elements: buttons, links, active tabs, focus rings.

- Primary accent: `#2E7A8F`
- Accent hover: `#3A8FA8`
- Muted background: `#1B4B5A`
- Subtle tint: `rgba(46,122,143,0.15)`

### Semantic Colors

Reserved for status indicators, feedback, and alerts:

- **Success (`#3FB950`)** — Positive metrics, completed actions
- **Warning (`#D29922`)** — Caution states, pending items
- **Error (`#F85149`)** — Failures, destructive actions
- **Info (`#58A6FF`)** — Informational highlights

Each semantic color has a corresponding muted variant for badge backgrounds.

### Chart Palette

Six-color palette for data visualizations. Teal (`chart-1`) and terracotta (`chart-3`) are brand-aligned; the others provide semantic and neutral options.

## Typography

**Font:** Plus Jakarta Sans (matching the public site)

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Label caps | 11px | 600 | Stat labels, table headers, badge text |
| Body sm | 12px | 400 | Secondary content, helper text |
| Body md | 14px | 400 | Default content |
| Body lg | 16px | 400 | Emphasized body text |
| Heading sm | 18px | 600 | Section titles |
| Heading md | 20px | 600 | Panel titles |
| Heading lg | 24px | 600 | Page titles |
| Stat value | 24px | 600 | Large metric displays |

Monospace: JetBrains Mono for code, IDs, technical strings.

## Layout & Spacing

Base unit: 4px. Scale follows a 4-point progression:

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`

Admin components use consistent padding built from this scale:
- Tight: 8–12px (badges, chips)
- Default: 12–16px (buttons, inputs)
- Comfortable: 16–24px (cards, panels)
- Spacious: 32–48px (page sections)

## Elevation & Depth

Shadows are neutral (black with low opacity) to avoid color shifts:

- **sm:** `0 1px 2px rgba(0,0,0,0.3)` — Input fields, subtle cards
- **md:** `0 4px 8px rgba(0,0,0,0.3)` — Dropdowns, popovers
- **lg:** `0 8px 24px rgba(0,0,0,0.4)` — Modals, large overlays
- **glow:** `0 0 20px rgba(46,122,143,0.3)` — Interactive card hover

Overlays use `backdrop-filter: blur(4px)` for depth separation.

## Shapes

Border radius scale:
- **sm (6px)** — Badges, chips, small elements
- **md (8px)** — Buttons, inputs, table cells
- **lg (12px)** — Cards, panels, modals
- **xl (16px)** — Large dialogs
- **full (9999px)** — Pill badges, circular buttons

## Components

### AdminCard

Primary container component. Use for cards, panels, and metric displays.

```tsx
<AdminCard>
  Content here
</AdminCard>
```

Add `interactive` prop for hover glow effect on clickable cards.

### AdminButton

Action buttons with four variants:

- **primary** — Teal background. Use for main actions (save, submit, create)
- **secondary** — Dark surface with border. Use for secondary actions (cancel, back)
- **ghost** — Transparent. Use for tertiary actions (filter, more menu)
- **danger** — Red background. Use for destructive actions (delete, remove)

Sizes: `sm` (28px), `md` (32px), `lg` (40px)

### AdminBadge

Status/category indicators. Use semantic variants for status.

- `default` — General labels
- `accent` — Highlighted labels
- `success` / `warning` / `error` / `info` — Status indicators

### AdminInput

Form inputs with built-in focus states. Use for all text inputs, selects, and search fields.

### AdminTable

Full-featured data table with sorting, filtering, pagination. Use for all data grids in the admin.

### AdminStat

Key metric display with change indicator. Use for KPI cards and summary panels.

### AdminLayout

Full-page layout with sidebar navigation. Includes header with user info, navigation sidebar, and main content area.

### AdminModal

Dialog overlays for confirmations, forms, and detail views. Includes backdrop blur and escape-to-close behavior.

### AdminTabs

Tab navigation for switching between views within a panel. Use for filters, view toggles, and section navigation.

## Do's and Don'ts

**Do:**
- Use the teal accent (`#2E7A8F`) for all interactive elements
- Use semantic colors for status indicators only
- Keep the background hierarchy consistent (base → surface → elevated → overlay)
- Use `admin-card-interactive` for clickable card elements
- Maintain 11px uppercase labels for table headers and stat labels

**Don't:**
- Use the public site's warm palette in admin surfaces
- Use hardcoded hex values — always reference design tokens
- Mix semantic colors for decoration — they convey meaning
- Use light backgrounds — the admin is always dark-themed
- Apply border-radius larger than xl for modal dialogs

## Migration Reference

| Before (hardcoded) | After (token) |
|--------------------|---------------|
| `bg-[#111418]` | `bg-admin-surface` |
| `border-[#1E242C]` | `border-admin-subtle` |
| `text-[#8B9DB5]` | `text-admin-secondary` |
| `text-[#E6EAF0]` | `text-admin-primary` |
| `#4F7CFF` | `#2E7A8F` (brand accent) |

## Files

| File | Purpose |
|------|---------|
| `src/styles/admin-design-system.css` | CSS custom properties and utility classes |
| `src/components/react/admin/AdminBase.tsx` | Core UI components (Card, Button, Badge, Input) |
| `src/components/react/admin/AdminLayout.tsx` | Layout components (Layout, Sidebar, Header) |
| `src/components/react/AdminTable.tsx` | Data table with sorting/filtering |
