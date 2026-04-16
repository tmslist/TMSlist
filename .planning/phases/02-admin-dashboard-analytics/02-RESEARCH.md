---
phase: 02
name: admin-dashboard-analytics
status: draft
created: 2026-04-16
---

# Phase 2: Admin Dashboard & Analytics - Research

## Phase Goal

Transform admin dashboard from static stats to an actionable command center with KPI trends, health score distribution, UTM attribution, conversion funnels, revenue projections, spam detection, activity feeds, customizable widgets, email digests, and PDF export.

## User Constraints (from CONTEXT.md)

**Locked Decisions (from UI-SPEC):**
- Use recharts for charting (not custom SVG)
- Use @dnd-kit/core + @dnd-kit/sortable for drag-and-drop
- Use html2canvas + jspdf for PDF export
- Design system: custom Tailwind (no shadcn)
- Spacing: 4px base (xs=4, sm=8, md=16, lg=24, xl=32, 2xl=48, 3xl=64)
- Typography: Plus Jakarta Sans (sans), Bricolage Grotesque (display)
- Chart colors: Violet (leads), Amber (reviews), Emerald (clinics), 4-bucket for health scores

## Standard Stack

### Core Libraries (already approved in UI-SPEC)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.x | Charting (bar, pie, line) | Developer-approved, pure rendering, no side effects |
| @dnd-kit/core | ^6.x | Drag-and-drop primitives | Developer-approved, no network activity |
| @dnd-kit/sortable | ^6.x | Sortable list/grid drag | Works with @dnd-kit/core |
| html2canvas | ^1.x | DOM to canvas capture | Developer-approved, reads DOM via iframe |
| jspdf | ^2.x | Client-side PDF generation | Developer-approved, no network activity |

### Supporting Libraries

| Library | Purpose | When to Use |
|---------|---------|-------------|
| date-fns | Date formatting for activity feed, ranges | All date manipulation |
| clsx/tailwind-merge | Conditional className merging | Reduce className complexity in widgets |

### Existing Patterns to Reuse

| Pattern | Source | Reuse For |
|---------|--------|-----------|
| StatCard component | AdminAnalytics.tsx | KPI cards with MoM delta |
| BarChart component | AdminAnalytics.tsx | Extend for horizontal bars |
| fetchData with loading/error states | AdminAnalytics.tsx | New widgets |
| Type badge colors | AdminLeads.tsx | Spam badges |
| Toast notifications | AdminLeads.tsx | All success/error feedback |
| Date range selector | AdminAnalytics.tsx | New widgets |

## Architecture Patterns

### 1. Extending Analytics API

The existing `/api/admin/analytics` endpoint (GET) returns:
- `overview`: { leads, reviews, clinics, users } with count + change
- `leadsByDay`, `reviewsByDay`, `clinicsByDay`, `usersByDay`: time series
- `leadsByType`: breakdown by lead type
- `topClinicsByLeads`, `topClinicsByReviews`: rankings

**Pattern for Adding New Metrics (DASH-02 through DASH-05):**

```typescript
// OPTION A: Add to existing response (backward-compatible)
return json({
  ...existingData,
  // New metrics as OPTIONAL fields (existing consumers won't break)
  healthScoreDistribution?: HealthScoreBucket[];
  leadsByUtmSource?: UtmSourceData[];
  conversionFunnel?: FunnelStage[];
  revenueProjection?: RevenueData;
  version: 2, // Version bump signals new format
});
```

**Pattern for New Endpoints:**

```typescript
// For metrics requiring different aggregation logic
export const GET: APIRoute = async ({ request }) => {
  // /api/admin/analytics/health-scores
  // /api/admin/analytics/utm-sources
  // /api/admin/analytics/funnel?clinicId=xxx
  // /api/admin/analytics/revenue
}
```

**Key Rules:**
1. Never remove existing fields from response
2. Add new fields as optional (use `?.` when missing)
3. Version the response structure with a `version` field
4. For breaking changes, create new endpoint version (e.g., `/v2`)
5. Document all fields in JSDoc comments

### 2. Widget State Management

**Pattern: WidgetConfig persisted to localStorage (client) + DB (multi-admin)**

```typescript
// types.ts
interface WidgetConfig {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

// useWidgetGrid hook pattern
function useWidgetGrid(defaultWidgets: WidgetConfig[]) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('admin-widget-layout');
    if (saved) {
      setWidgets(JSON.parse(saved));
    }
  }, []);

  // Persist on change
  const updateWidgets = (newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('admin-widget-layout', JSON.stringify(newWidgets));
  };

  return { widgets, updateWidgets };
}
```

**For Multi-Admin (Phase 2 single-user, Phase 3+ multi-admin):**
- Add `userId` + `layout` columns to `users` or new `admin_preferences` table
- Sync localStorage layout to DB on explicit "Save layout" action
- Load from DB on login, fallback to localStorage

### 3. PDF Export Pattern

**Client-side approach (html2canvas + jspdf):**

```typescript
// useExportPDF.ts
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function useExportPDF() {
  const [generating, setGenerating] = useState(false);

  const exportToPDF = async (elementId: string, filename: string) => {
    setGenerating(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) throw new Error('Element not found');

      // Capture at 2x resolution for quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  return { exportToPDF, generating };
}
```

**For recharts SVG charts:**
- recharts renders SVG which html2canvas can capture
- Ensure `isAnimationActive={false}` during capture for consistent output
- Wrap chart in a div with `ref` for targeting

### 4. Activity Feed Pattern

**Polling interval: 30 seconds (MEDIUM confidence)**

Industry standard for admin dashboards:
- **5 seconds:** Too aggressive, unnecessary server load for non-critical data
- **15 seconds:** Good for notifications, too frequent for activity logs
- **30 seconds:** Best balance - fresh enough for activity tracking, not burdensome
- **60 seconds:** Acceptable, feels slightly stale

**Implementation Pattern:**

```typescript
interface ActivityItem {
  id: string;
  actor: string;
  action: 'added' | 'edited' | 'removed' | 'approved' | 'rejected' | 'exported';
  subject: string;
  timestamp: string;
  link?: string;
}

function AdminActivityFeed({ maxItems = 10, refreshInterval = 30000 }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/activity?limit=${maxItems}');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } finally {
      setLoading(false);
    }
  }, [maxItems]);

  useEffect(() => {
    fetchActivity(); // Initial fetch

    const interval = setInterval(fetchActivity, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchActivity, refreshInterval]);

  // Animate new items
  useEffect(() => {
    if (items.length > 0) {
      // Trigger animation on newest item
    }
  }, [items[0]?.id]);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 animate-fadeIn">
          <Avatar initials={item.actor[0]} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">
              <span className="font-medium">{item.actor}</span>
              {' '}{item.action}{' '}
              <span className="font-medium">{item.subject}</span>
            </p>
            <p className="text-xs text-gray-400">{formatTimeAgo(item.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**New API endpoint required:**

```typescript
// /api/admin/activity.ts
export const GET: APIRoute = async ({ request }) => {
  // Query audit_log table (from AUTH-10)
  // Return formatted activity items
  // Filter by last hour for initial load, paginate by timestamp
};
```

### 5. Spam Detection Pattern (DASH-06)

**Disposable email domains detection:**

```typescript
// utils/spamDetection.ts
const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'throwaway.email', 'mailinator.com',
  'guerrillamail.com', '10minutemail.com',
  // Add more from a maintained list
];

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

export function calculateSpamScore(lead: Lead): number {
  let score = 0;

  // Disposable email = immediate spam
  if (isDisposableEmail(lead.email)) score += 100;

  // Bot patterns
  if (/^[a-z]{10,}@[a-z]+\.com$/i.test(lead.email)) score += 30;
  if (!lead.name && !lead.phone && !lead.message) score += 40;
  if (lead.message && lead.message.length < 10) score += 20;

  // Suspicious patterns in message
  const suspiciousPatterns = [
    /\b(buy now|click here|limited time|act now)\b/i,
    /\b(viagra|cialis|casino|lottery)\b/i,
    /https?:\/\/[^\s]+/gi, // Multiple URLs
  ];

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(lead.message || '')) score += 25;
  });

  return Math.min(score, 100);
}

export type SpamLevel = 'clean' | 'suspicious' | 'spam';

export function getSpamLevel(score: number): SpamLevel {
  if (score >= 70) return 'spam';
  if (score >= 30) return 'suspicious';
  return 'clean';
}
```

**Integration with AdminLeads.tsx:**
- Add `spamScore` computed field (or calculate on display)
- Add badge with color: green (clean), amber (suspicious), red (spam)
- Default to hiding spam leads with toggle to show
- Persist spam status to DB if auto-deleting spam leads

### 6. @dnd-kit with Astro SSR

**Critical Caveat: dnd-kit requires browser APIs**

**Solution Pattern:**

```typescript
// AdminDashboardGrid.tsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';

interface DashboardGridProps {
  widgets: WidgetConfig[];
  onReorder: (newOrder: WidgetConfig[]) => void;
}

export default function AdminDashboardGrid({ widgets, onReorder }: DashboardGridProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Client-side only rendering for dnd-kit
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    })
  );

  // Server-side / pre-hydration: static layout
  if (!isHydrated) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {widgets.map((widget) => (
          <WidgetCard key={widget.id} widget={widget} />
        ))}
      </div>
    );
  }

  // Client-side: drag-and-drop enabled
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {widgets.map((widget) => (
            <SortableWidget key={widget.id} widget={widget} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

**Key Points:**
1. `isHydrated` state prevents SSR rendering issues
2. `PointerSensor` with `activationConstraint.distance: 8` prevents accidental drags
3. All dnd-kit imports only run on client
4. Use `client:load` or `client:visible` directive in Astro

## Key Technical Decisions

### 1. @dnd-kit in React Island (Astro)

**Finding:** [ASSUMED based on dnd-kit patterns]

dnd-kit requires browser APIs (MutationObserver, ResizeObserver) and cannot execute server-side. In Astro's React islands architecture:

**Solution:**
- Guard dnd-kit components with `isHydrated` state (useEffect sets on mount)
- Use `client:load` or `client:visible` directive in Astro page
- Never import dnd-kit at module level without guards
- SSR renders static layout; client hydration enables drag functionality

**Verification needed:** Test drag-and-drop in preview deployment

### 2. html2canvas + jspdf for React PDF Export

**Finding:** [ASSUMED based on common patterns]

html2canvas captures DOM elements (including recharts SVG) as canvas. jsPDF creates PDF documents.

**Pattern:**
- html2canvas with `scale: 2` for high-quality output
- Handle multi-page by calculating content height vs page height
- For recharts: ensure `isAnimationActive={false}` during capture for consistent render
- Wrap chart in ref'd div, pass ref to html2canvas

**Limitation:** Complex layouts may require html2canvas specific configuration (logging, CORS)

### 3. Activity Feed Polling Interval

**Finding:** [ASSUMED - standard industry practice]

**Recommendation: 30 seconds**

- **Too aggressive (5s):** Unnecessary server load, not needed for activity logs
- **Too stale (60s+):** Feed feels disconnected from real actions
- **30s is sweet spot:** Fresh enough for real-time feel, not burdensome

### 4. Analytics API Extension Strategy

**Finding:** [ASSUMED - standard API versioning practice]

**Rules for backward compatibility:**
1. Add new metrics as optional fields (existing consumers won't break)
2. Include `version` field in response to signal format changes
3. Never remove fields from response (deprecate instead)
4. For breaking changes, create new endpoint version (e.g., `/v2`)
5. Document all fields with JSDoc

**New endpoints needed:**
- `/api/admin/activity` - activity feed data
- Possibly `/api/admin/analytics/health-scores` - if aggregation is different
- Possibly `/api/admin/digests` - for email digest settings

### 5. Spam Detection Implementation

**Finding:** [ASSUMED based on common spam detection patterns]

**Approach:**
- Client-side scoring based on disposable email domains and text patterns
- No ML required for Phase 2 (keyword/regex based)
- Score thresholds: 0-29 = clean, 30-69 = suspicious, 70+ = spam
- Optional: persist spam status to leads.metadata for filtering

## Implementation Risks

### Risk 1: dnd-kit SSR Hydration Mismatch
**Severity:** Medium
**Description:** Drag handles may not appear or behave correctly during SSR/hydration
**Mitigation:** Use `isHydrated` guard pattern, test in preview deployment

### Risk 2: html2canvas Performance on Large Dashboards
**Severity:** Low
**Description:** Capturing large DOM trees with many charts may be slow (>5 seconds)
**Mitigation:** Debounce export button, show loading state, capture individual sections if needed

### Risk 3: Polling Overload with Multiple Widgets
**Severity:** Low
**Description:** Each widget polling independently could create multiple API calls
**Mitigation:** Single activity feed endpoint with polling, other widgets use manual refresh or longer intervals

### Risk 4: PDF Quality with SVG Charts
**Severity:** Low
**Description:** Recharts SVG may render differently in canvas capture
**Mitigation:** Set `isAnimationActive={false}` during capture, test with scale:2

### Risk 5: Multi-Admin Layout Persistence
**Severity:** Medium
**Description:** Phase 2 focuses on single-user; multi-admin layout sync is out of scope
**Mitigation:** Use localStorage for Phase 2, design DB schema to support it later

## Existing Patterns to Follow

### From AdminAnalytics.tsx

1. **StatCard with MoM delta:**
   - Green/red color based on positive/negative change
   - Format: `+{n}%` for positive, `{n}%` for negative
   - Caption: "vs previous period"

2. **fetchData pattern:**
   - Loading state with spinner
   - Error state with retry button
   - 401 redirects to login

3. **Range selector:**
   - 4 options: 7/30/90/365 days
   - Pill-style buttons with violet active state

### From AdminLeads.tsx

1. **Type badge colors:**
   - Each lead type has distinct color
   - Spam: red-100 text-red-700 badge

2. **Toast notifications:**
   - Fixed top-right positioning
   - 4-second auto-dismiss
   - Green for success, red for error

3. **Table row expansion:**
   - Click to expand, chevron rotates
   - Shows additional metadata (UTM, referral source)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Astro runtime | Yes | (current) | N/A |
| PostgreSQL | Analytics queries | Yes | (current) | N/A |
| recharts | Chart widgets | Yes | ^2.x | Custom SVG |
| @dnd-kit | Drag-and-drop | Yes | ^6.x | Not available |
| html2canvas | PDF export | Yes | ^1.x | Not available |
| jspdf | PDF generation | Yes | ^2.x | Not available |

**All dependencies available:** No blockers identified.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` (if exists) or `package.json` |
| Quick run command | `npm test` or `npm test -- --run` |
| Full suite command | `npm test -- --run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | File |
|---------|----------|-----------|------|
| DASH-01 | KPI cards show MoM % change | Unit | `AdminAnalytics.test.tsx` |
| DASH-02 | Health score pie renders 4 buckets | Unit | `AdminHealthScoreChart.test.tsx` |
| DASH-03 | UTM source bar chart renders | Unit | `AdminUTMSourceChart.test.tsx` |
| DASH-04 | Conversion funnel shows stages | Unit | `AdminFunnelChart.test.tsx` |
| DASH-05 | Revenue widget shows projections | Unit | `AdminRevenueWidget.test.tsx` |
| DASH-06 | Spam leads flagged with badge | Unit | `spamDetection.test.ts` |
| DASH-07 | Activity feed polls and updates | Integration | `AdminActivityFeed.test.tsx` |
| DASH-08 | Widgets can be reordered | E2E | Manual verify in browser |
| DASH-09 | Digest settings save | Integration | `AdminDigestSettings.test.tsx` |
| DASH-10 | PDF export generates file | E2E | Manual verify download |

### Wave 0 Gaps
- [ ] `src/utils/spamDetection.test.ts` - spam scoring logic
- [ ] `src/utils/spamDetection.ts` - spam detection functions

*(Other components follow existing AdminAnalytics pattern)*

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | KPI trend cards with MoM/YoY delta | StatCard component pattern, pctChange calculation |
| DASH-02 | Clinic health distribution chart | New PieChart component, 4-bucket data structure |
| DASH-03 | Lead source attribution chart | Horizontal BarChart component, UTM params from leads.metadata |
| DASH-04 | Conversion funnel | New FunnelChart component, requires analytics events tracking |
| DASH-05 | Revenue projection widget | New RevenueWidget component, featured/paid listings data |
| DASH-06 | Spam lead detection | spamDetection.ts with disposable email + pattern matching |
| DASH-07 | Admin activity feed | AdminActivityFeed component with 30s polling, audit_log query |
| DASH-08 | Customizable dashboard widgets | @dnd-kit with SortableContext, WidgetConfig type |
| DASH-09 | Scheduled email digests | AdminDigestSettings component, email endpoint required |
| DASH-10 | Export analytics to PDF | html2canvas + jspdf pattern, useExportPDF hook |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Yes | Admin role check on all analytics endpoints |
| V5 Input Validation | Yes | Sanitize date range params, validate clinic IDs |
| V10 Logging/Monitoring | Yes | Activity feed builds on audit_log (AUTH-10) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Analytics data exposure | Information Disclosure | Admin role required for all endpoints |
| Date range manipulation | Tampering | Validate days param (1-365), reject negative values |
| PDF injection | Tampering | html2canvas captures DOM, not user input |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | dnd-kit SSR pattern with isHydrated guard works in Astro islands | Key Tech Decision #1 | UI may flash or have hydration mismatch |
| A2 | 30 seconds is optimal polling interval | Key Tech Decision #3 | May need tuning based on actual usage |
| A3 | html2canvas captures recharts SVG reliably | Key Tech Decision #2 | PDF may have rendering issues |
| A4 | Spam scoring thresholds (30/70) are appropriate | Key Tech Decision #5 | May need adjustment after real data |
| A5 | Existing audit_log table from AUTH-10 has appropriate structure for activity feed | Activity Feed Pattern | May need new table or schema modification |

**If any assumption is wrong:** Flag during Wave 0 testing and adjust implementation.

## Open Questions

1. **Analytics events tracking for funnel (DASH-04)**
   - What we know: leads table exists, visits/conversions may not be tracked
   - What's unclear: Where do "visit" and "conversion" events come from?
   - Recommendation: Start with leads->appointments funnel (data exists), add analytics events later

2. **Revenue projection calculation (DASH-05)**
   - What we know: clinics table has isFeatured flag, subscription plans
   - What's unclear: Actual pricing tiers, how to calculate MRR
   - Recommendation: Use fixed estimates for Phase 2 (e.g., featured = $X/mo), make it configurable

3. **Email digest delivery mechanism**
   - What we know: AdminSettings exists, user email stored
   - What's unclear: How to send emails (Resend, SendGrid, etc.)
   - Recommendation: Create settings UI in Phase 2, email sending in Phase 5 with BILL-07

## Sources

### Primary (HIGH confidence)
- `src/pages/api/admin/analytics.ts` - existing analytics API pattern
- `src/components/react/AdminAnalytics.tsx` - existing UI patterns
- `src/components/react/AdminLeads.tsx` - lead table patterns, metadata structure
- `src/db/schema.ts` - leads, clinics, users tables structure

### Secondary (MEDIUM confidence)
- UI-SPEC.md - approved design system, component contracts, library safety review
- dndkit.com - SSR/island documentation (fetched)
- Standard industry practice for polling intervals (30s)

### Tertiary (LOW confidence - needs verification)
- [ASSUMED] dnd-kit SSR pattern with isHydrated guard
- [ASSUMED] html2canvas + jspdf specific configuration for recharts
- [ASSUMED] Spam detection thresholds (30/70)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries approved in UI-SPEC
- Architecture patterns: HIGH - follows existing codebase patterns
- Pitfalls: MEDIUM - based on common React/Astro patterns, not project-tested

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (30 days - stable domain)
