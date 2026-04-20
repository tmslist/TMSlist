import { useState, useEffect } from 'react';

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: '#0B0D10', surface: '#111418', surface2: '#15191E',
  border: '#1E242C', border2: '#2A323C',
  text: '#E6EAF0', text2: '#9BA4B2', text3: '#6B7380',
  accent: '#4F7CFF', green: '#34D399', amber: '#FBBF24', red: '#F87171',
};

// ── Icon factory ──────────────────────────────────────────────────────────────
const Ic = ({ d, s = 16, sw = 1.75, fill = 'none' }: { d: React.ReactNode; s?: number; sw?: number; fill?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const Icons = {
  grid: <Ic d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>}/>,
  building: <Ic d={<><path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 9h1M9 13h1M14 9h1M14 13h1M10 21v-4h4v4"/></>}/>,
  shield: <Ic d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>,
  users: <Ic d={<><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></>}/>,
  dollar: <Ic d={<><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>}/>,
  chart: <Ic d={<path d="M3 3v18h18M7 14l4-4 4 4 5-5"/>}/>,
  note: <Ic d={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>}/>,
  bell: <Ic d={<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>}/>,
  search: <Ic d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></>}/>,
  chevR: <Ic d={<path d="M9 18l6-6-6-6"/>}/>,
  chevD: <Ic d={<path d="M6 9l6 6 6-6"/>}/>,
  chevL: <Ic d={<path d="M15 18l-6-6 6-6"/>}/>,
  arrUp: <Ic d={<path d="M7 17l10-10M17 17V7H7"/>}/>,
  arrDn: <Ic d={<path d="M17 7L7 17M7 7v10h10"/>}/>,
  plus: <Ic d={<path d="M12 5v14M5 12h14"/>}/>,
  more: <Ic d={<><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>}/>,
  check: <Ic d={<path d="M20 6L9 17l-5-5"/>}/>,
  x: <Ic d={<path d="M18 6L6 18M6 6l12 12"/>}/>,
  warn: <Ic d={<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>}/>,
  flag: <Ic d={<path d="M4 22V4l8 4 8-4v14l-8 4-8-4z"/>}/>,
  clock: <Ic d={<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>}/>,
  timer: <Ic d={<><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></>}/>,
  download: <Ic d={<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>}/>,
  upload: <Ic d={<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>}/>,
  filter: <Ic d={<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>}/>,
  ext: <Ic d={<path d="M14 3h7v7M10 14L21 3M21 14v7H3V3h7"/>}/>,
  eye: <Ic d={<><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>}/>,
  edit: <Ic d={<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>,
  trash: <Ic d={<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>}/>,
  starSmall: <Ic s={12} fill="currentColor" sw={0} d={<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88L2 9.27l6.91-1.01L12 2z"/>}/>,
  cmd: <Ic d={<path d="M18 6h-2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2zM8 6H6a2 2 0 00-2 2v0a2 2 0 002 2h12a2 2 0 012 2v0a2 2 0 01-2 2H6a2 2 0 00-2 2v0a2 2 0 002 2h2"/>}/>,
  flow: <Ic d={<><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><path d="M6 9v6h12V9M12 15V9"/></>}/>,
  globe: <Ic d={<><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z"/></>}/>,
};

// ── Utility: chip ─────────────────────────────────────────────────────────────
const Chip = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${className}`}>{children}</span>
);

// ── Sidebar ─────────────────────────────────────────────────────────────────────
const Sidebar = ({ page, onNav }: { page: string; onNav: (k: string) => void }) => {
  const sections = [
    {
      h: 'Operate', items: [
        { k: 'overview', l: 'Overview', i: Icons.grid },
        { k: 'clinics', l: 'Clinics', i: Icons.building, count: 1147 },
        { k: 'moderation', l: 'Moderation Queue', i: Icons.shield, count: 14, urgent: true },
        { k: 'leads', l: 'Patient Leads', i: Icons.users, count: 284 },
      ]
    },
    {
      h: 'Analyze', items: [
        { k: 'revenue', l: 'Revenue', i: Icons.dollar },
        { k: 'analytics', l: 'Search Analytics', i: Icons.chart },
        { k: 'quiz', l: 'Quiz Completions', i: Icons.flow },
      ]
    },
    {
      h: 'Manage', items: [
        { k: 'content', l: 'Content', i: Icons.note },
        { k: 'users', l: 'Staff & Roles', i: Icons.users },
        { k: 'audit', l: 'Audit Trail', i: Icons.shield },
        { k: 'settings', l: 'Settings', i: Icons.cmd },
      ]
    },
  ];

  return (
    <aside style={{ width: 260, background: C.surface, borderRight: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,124,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: -0.01, color: C.text }}>TMS List</div>
            <div style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: C.text3, textTransform: 'uppercase', letterSpacing: '0.16em' }}>Admin · v2.4.0</div>
          </div>
        </div>
        <button style={{ width: 28, height: 28, borderRadius: 6, background: C.surface2, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, cursor: 'pointer' }}>
          {Icons.chevR}
        </button>
      </div>

      {/* Env indicator */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }}/>
        <span style={{ color: C.text2 }}>Environment</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, color: C.green }}>production</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {sections.map((s, si) => (
          <div key={si} style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 8px', marginBottom: 6, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.text3, fontWeight: 600 }}>{s.h}</div>
            <div>
              {s.items.map(it => {
                const active = page === it.k;
                return (
                  <button key={it.k} onClick={() => onNav(it.k)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '6px 10px', borderRadius: 6, marginBottom: 2,
                      background: active ? 'rgba(79,124,255,0.15)' : 'transparent',
                      color: active ? C.accent : C.text2,
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontSize: 13, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = C.text; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text2; }}
                  >
                    <span style={{ color: active ? C.accent : C.text3 }}>{it.i}</span>
                    <span style={{ flex: 1 }}>{it.l}</span>
                    {it.count != null && (
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5,
                        padding: '2px 6px', borderRadius: 4,
                        background: it.urgent ? 'rgba(248,113,113,0.15)' : C.surface2,
                        color: it.urgent ? C.red : C.text3,
                      }}>{it.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 8px', borderRadius: 6, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #4F7CFF, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>AC</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ana Chen</div>
            <div style={{ fontSize: 10.5, color: C.text3, fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ana@tmslist.com · Admin</div>
          </div>
          <span style={{ color: C.text3 }}>{Icons.more}</span>
        </div>
      </div>
    </aside>
  );
};

// ── TopBar ─────────────────────────────────────────────────────────────────────
const TopBar = ({ page }: { page: string }) => {
  const titles: Record<string, string> = {
    overview: 'Overview', clinics: 'Clinics', moderation: 'Moderation Queue',
    leads: 'Patient Leads', revenue: 'Revenue', audit: 'Audit Trail',
    analytics: 'Search Analytics', content: 'Content', users: 'Staff & Roles', settings: 'Settings',
  };

  return (
    <header style={{
      height: 56, borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 32px',
      background: 'rgba(17,20,24,0.8)', backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
        <span style={{ color: C.text3 }}>Directory</span>
        <span style={{ color: C.text3 }}>/</span>
        <span style={{ color: C.text, fontWeight: 500 }}>{titles[page] || 'Overview'}</span>
      </div>
      <div style={{ flex: 1, maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12.5 }}>
          <span style={{ color: C.text3 }}>{Icons.search}</span>
          <input placeholder="Search clinics, leads, users, audit log…" style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none', color: C.text, fontSize: 12.5 }} />
          <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '2px 5px', background: C.surface2, border: `1px solid ${C.border}`, borderBottomWidth: 2, borderRadius: 4, color: C.text2 }}>⌘K</kbd>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{ padding: '0 10px', height: 32, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.text2; e.currentTarget.style.background = 'transparent'; }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }}/>
          All systems
        </button>
        <button style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.text2}>
          {Icons.bell}
          <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, background: C.red, borderRadius: '50%' }}/>
        </button>
        <button style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = C.text}
          onMouseLeave={e => e.currentTarget.style.color = C.text2}>
          {Icons.cmd}
        </button>
      </div>
    </header>
  );
};

// ── KPI Card ───────────────────────────────────────────────────────────────────
const KPI = ({ label, value, delta, sub, spark }: { label: string; value: string; delta?: number; sub?: string; spark?: number[] }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, transition: 'border-color 0.15s' }}
    onMouseEnter={e => e.currentTarget.style.borderColor = C.border2}
    onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600 }}>{label}</span>
      {delta != null && (
        <span style={{ fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2, color: delta >= 0 ? C.green : C.red }}>
          <span style={{ fontSize: 10 }}>{delta >= 0 ? Icons.arrUp : Icons.arrDn}</span>
          {Math.abs(delta)}%
        </span>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.02, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, color: C.text }}>{value}</div>
        {sub && <div style={{ fontSize: 11.5, color: C.text3, marginTop: 8 }}>{sub}</div>}
      </div>
      {spark && (
        <svg viewBox="0 0 100 32" style={{ width: 96, height: 40, flexShrink: 0 }}>
          <defs>
            <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.accent} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={C.accent} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={`M 0 ${spark[0]} ${spark.map((v, i) => `L ${i * (100 / (spark.length - 1))} ${v}`).join(' ')} L 100 32 L 0 32 Z`} fill={`url(#sg-${label})`}/>
          <path d={`M 0 ${spark[0]} ${spark.map((v, i) => `L ${i * (100 / (spark.length - 1))} ${v}`).join(' ')}`} stroke={C.accent} strokeWidth="1.5" fill="none"/>
        </svg>
      )}
    </div>
  </div>
);

// ── Overview View ───────────────────────────────────────────────────────────────
const OverviewView = () => {
  const activities = [
    { t: '3m', a: 'Dr. Chen', act: 'approved', target: 'Sunset Mental Health', tag: 'clinic', color: 'green' },
    { t: '8m', a: 'System', act: 'auto-flagged 2 reviews', target: 'NeuroWell', tag: 'moderation', color: 'amber' },
    { t: '12m', a: 'Maria Liu', act: 'responded to lead', target: 'Lead #8211', tag: 'lead', color: 'blue' },
    { t: '19m', a: 'Dr. Chen', act: 'rejected', target: '"Better TMS LLC"', tag: 'moderation', color: 'red', reason: 'Unverified clinician' },
    { t: '24m', a: 'System', act: 'synced 12 insurance plans', target: 'Aetna · BCBS', tag: 'system', color: 'gray' },
    { t: '42m', a: 'New submission', act: 'awaiting review', target: 'Pacific Brain Health', tag: 'clinic', color: 'amber' },
    { t: '1h', a: 'Jose R.', act: 'published blog post', target: 'SAINT protocol explained', tag: 'content', color: 'violet' },
    { t: '2h', a: 'Stripe', act: 'charged $149', target: 'NeuroWell · Practice tier', tag: 'billing', color: 'green' },
  ];

  const tagColor: Record<string, string> = { green: C.green, amber: C.amber, red: C.red, blue: C.accent, violet: '#A78BFA', gray: C.text3 };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.02, color: C.text, marginBottom: 4 }}>Welcome back, Ana</h1>
          <p style={{ fontSize: 13, color: C.text2 }}>Last 7 days · <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span></p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: 4, gap: 4, fontSize: 12 }}>
            {['24h', '7d', '30d', '90d', 'All'].map((t, i) => (
              <button key={t} style={{ padding: '6px 12px', borderRadius: 4, background: i === 1 ? 'rgba(255,255,255,0.06)' : 'transparent', color: i === 1 ? C.text : C.text2, border: 'none', cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
          <button style={{ padding: '0 12px', height: 36, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12.5, cursor: 'pointer' }}>Export</button>
          <button style={{ padding: '0 12px', height: 36, borderRadius: 6, background: C.accent, color: '#fff', fontSize: 12.5, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{Icons.plus}New clinic</button>
        </div>
      </div>

      {/* Alert */}
      <div style={{ background: 'rgba(251,191,36,0.03)', border: `1px solid rgba(251,191,36,0.2)`, borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(251,191,36,0.15)', color: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{Icons.warn}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2, color: C.text }}>14 items need your attention</div>
          <div style={{ fontSize: 12, color: C.text2 }}>9 pending clinic submissions · 3 flagged reviews · 2 insurance disputes</div>
        </div>
        <button style={{ padding: '0 12px', height: 32, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12, cursor: 'pointer' }}>Dismiss</button>
        <button style={{ padding: '0 12px', height: 32, borderRadius: 6, background: 'rgba(251,191,36,0.2)', color: C.amber, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Review queue {Icons.chevR}</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KPI label="Total Clinics" value="1,147" delta={3.2} sub="+34 this week" spark={[28, 24, 20, 24, 18, 16, 12, 14, 10, 8, 6, 4]}/>
        <KPI label="Leads (30d)" value="2,847" delta={24.1} sub="Conv 3.4%" spark={[26, 28, 22, 18, 20, 14, 18, 12, 10, 8, 12, 6]}/>
        <KPI label="Revenue (MTD)" value="$48,230" delta={-2.4} sub="MRR $52,100" spark={[8, 12, 14, 10, 16, 12, 18, 22, 20, 18, 22, 24]}/>
        <KPI label="Active Users" value="412" delta={8.7} sub="228 clinics · 184 patients" spark={[24, 20, 22, 18, 14, 16, 12, 14, 10, 8, 6, 6]}/>
      </div>

      {/* Two-column: chart + queue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, marginBottom: 24 }}>
        {/* Leads chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600, marginBottom: 4 }}>Leads by Channel</div>
              <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>2,847</div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11.5 }}>
              {[{ l: 'Direct', c: C.accent, v: '1,367' }, { l: 'Condition', c: '#A78BFA', v: '798' }, { l: 'City', c: C.green, v: '482' }, { l: 'Referral', c: C.amber, v: '200' }].map(x => (
                <span key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: x.c }}/><span style={{ color: C.text2 }}>{x.l}</span><span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{x.v}</span></span>
              ))}
            </div>
          </div>
          <svg viewBox="0 0 800 260" style={{ width: '100%', height: 260 }}>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.accent} stopOpacity="0.25"/>
                <stop offset="100%" stopColor={C.accent} stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[0, 65, 130, 195].map((y, i) => (
              <line key={i} x1="40" y1={y + 20} x2="800" y2={y + 20} stroke={C.border} strokeWidth="0.5" strokeDasharray="2 4"/>
            ))}
            <path d="M 40 180 Q 140 170 240 140 T 440 110 T 640 90 T 800 70 L 800 220 L 40 220 Z" fill="url(#lg)"/>
            <path d="M 40 180 Q 140 170 240 140 T 440 110 T 640 90 T 800 70" stroke={C.accent} strokeWidth="2" fill="none"/>
            <path d="M 40 210 Q 140 200 240 190 T 440 170 T 640 160 T 800 150" stroke="#A78BFA" strokeWidth="1.5" fill="none"/>
            <path d="M 40 220 Q 140 215 240 210 T 440 200 T 640 195 T 800 185" stroke={C.green} strokeWidth="1.5" fill="none"/>
            {['Mar 1', 'Mar 5', 'Mar 10', 'Mar 15', 'Mar 20', 'Mar 25', 'Today'].map((t, i) => (
              <text key={t} x={40 + i * (760 / 6)} y="250" fill={C.text3} fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">{t}</text>
            ))}
            <circle cx="800" cy="70" r="4" fill={C.accent} stroke={C.surface} strokeWidth="2"/>
          </svg>
        </div>

        {/* Moderation queue */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Moderation Queue</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Oldest first</div>
            </div>
            <button style={{ fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>View all (14)</button>
          </div>
          <div>
            {[
              { t: 'Clinic claim', n: 'Pacific Brain Health Center', w: '14h', col: C.accent },
              { t: 'New review', n: 'Westside Psychiatry · 3★', w: '6h', col: C.amber },
              { t: 'Dispute', n: 'Sunset Mental · Insurance mismatch', w: '4h', col: C.red },
              { t: 'Clinic claim', n: 'Bay Area Neuromodulation', w: '3h', col: C.accent },
              { t: 'New review', n: 'NeuroWell · 1★ (flagged abusive)', w: '1h', col: C.red },
            ].map((x, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: i < 4 ? `1px solid ${C.border}` : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${x.col}15`, color: x.col, flexShrink: 0 }}>
                  {x.t.includes('claim') ? Icons.building : x.t.includes('review') ? Icons.flag : Icons.warn}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: C.text3, fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>{x.t} · {x.w} ago</div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.n}</div>
                </div>
                <span style={{ color: C.text3 }}>{Icons.chevR}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity feed + System health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Activity Feed</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Last 12 hours</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['All', 'Actions', 'System'].map(t => (
                <button key={t} style={{ fontSize: 11, color: C.text2, padding: '2px 8px', borderRadius: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            {activities.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: i < activities.length - 1 ? `1px solid ${C.border}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.surface2, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: C.text2, textTransform: 'uppercase', flexShrink: 0 }}>
                  {a.a === 'System' ? 'SYS' : a.a.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 500 }}>{a.a}</span>
                    <span style={{ color: C.text2 }}> {a.act} </span>
                    <span style={{ fontWeight: 500 }}>{a.target}</span>
                    {a.reason && <span style={{ color: C.text3 }}> · {a.reason}</span>}
                  </div>
                  <div style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace', color: C.text3, marginTop: 2 }}>{a.t} ago · <span style={{ color: tagColor[a.color] || C.text3 }}>{a.tag}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* System health */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>System Health</div>
              <Chip style={{ background: 'rgba(52,211,153,0.15)', color: C.green }}>All green</Chip>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { l: 'API Latency (p95)', v: '142ms', g: 100, c: C.green },
                { l: 'DB Pool Usage', v: '62%', g: 62, c: C.green },
                { l: 'Queue Backlog', v: '14 items', g: 28, c: C.amber },
                { l: 'Error Rate (24h)', v: '0.04%', g: 5, c: C.green },
              ].map(x => (
                <div key={x.l}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: C.text2 }}>{x.l}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: x.c }}>{x.v}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: C.surface2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${x.g}%`, background: x.c, borderRadius: 2 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top cities */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Top Cities (30d)</div>
              <button style={{ fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>Map</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { c: 'Los Angeles', n: 842, p: 100 }, { c: 'New York', n: 678, p: 80 },
                { c: 'Chicago', n: 412, p: 49 }, { c: 'Miami', n: 318, p: 37 }, { c: 'Austin', n: 287, p: 34 },
              ].map(x => (
                <div key={x.c} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 40px', alignItems: 'center', gap: 12, fontSize: 12 }}>
                  <span style={{ color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.c}</span>
                  <div style={{ height: 4, background: C.surface2, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${x.p}%`, background: `${C.accent}99` }}/>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{x.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Clinics View ────────────────────────────────────────────────────────────────
const ClinicsView = () => {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const clinics = [
    { id: 'cl_8f2a', name: 'NeuroWell TMS Institute', city: 'Beverly Hills', state: 'CA', tier: 'Practice', status: 'Verified', leads30: 142, rev: '$149', owner: 'Dr. J. Chen', dev: ['NeuroStar', 'BrainsWay'], rating: 4.9, reviews: 127, fresh: 'ok' },
    { id: 'cl_7d1b', name: 'Pacific Brain Health', city: 'Santa Monica', state: 'CA', tier: 'Free', status: 'Pending', leads30: 0, rev: '—', owner: 'Unclaimed', dev: ['MagVenture'], rating: 4.8, reviews: 92, fresh: 'stale' },
    { id: 'cl_6c9e', name: 'Westside Psychiatry & TMS', city: 'West Hollywood', state: 'CA', tier: 'Premium', status: 'Verified', leads30: 89, rev: '$299', owner: 'Dr. M. Park', dev: ['NeuroStar', 'SAINT'], rating: 4.7, reviews: 64, fresh: 'ok' },
    { id: 'cl_5b4f', name: 'Sunset Mental Health', city: 'Los Angeles', state: 'CA', tier: 'Practice', status: 'Verified', leads30: 63, rev: '$149', owner: 'Dr. A. Rao', dev: ['BrainsWay Deep'], rating: 4.6, reviews: 48, fresh: 'warn' },
    { id: 'cl_4a3d', name: 'Bay Area Neuromodulation', city: 'Palo Alto', state: 'CA', tier: 'Premium', status: 'Verified', leads30: 108, rev: '$299', owner: 'Dr. S. Gupta', dev: ['NeuroStar', 'iTBS', 'SAINT'], rating: 4.9, reviews: 88, fresh: 'ok' },
    { id: 'cl_3d8c', name: 'Austin Behavioral Health', city: 'Austin', state: 'TX', tier: 'Free', status: 'Verified', leads30: 24, rev: '—', owner: 'Dr. P. Nair', dev: ['NeuroStar'], rating: 4.4, reviews: 22, fresh: 'ok' },
    { id: 'cl_2e7b', name: 'Manhattan TMS Center', city: 'New York', state: 'NY', tier: 'Premium', status: 'Verified', leads30: 196, rev: '$299', owner: 'Dr. L. Morales', dev: ['NeuroStar', 'BrainsWay', 'Magstim'], rating: 4.8, reviews: 214, fresh: 'ok' },
    { id: 'cl_1f6a', name: 'Better TMS LLC', city: 'Miami', state: 'FL', tier: '—', status: 'Rejected', leads30: 0, rev: '—', owner: '—', dev: [], rating: null, reviews: 0, fresh: 'none' },
  ];

  const statusChip = (s: string) => {
    const m: Record<string, string> = { Verified: C.green, Pending: C.amber, Rejected: C.red, Unclaimed: C.text3 };
    return <Chip style={{ background: `${m[s] || C.text3}15`, color: m[s] || C.text3 }}>{s}</Chip>;
  };

  const tierChip = (t: string) => {
    const m: Record<string, string> = { Premium: '#A78BFA', Practice: C.accent, Free: C.text3 };
    return <Chip style={{ border: `1px solid ${m[t] || C.border2}30`, color: m[t] || C.text3, background: 'transparent' }}>{t}</Chip>;
  };

  const freshDot = (f: string) => {
    const m: Record<string, string> = { ok: C.green, warn: C.amber, stale: C.red, none: C.text3 };
    return <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: m[f], flexShrink: 0 }}/>;
  };

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const allToggle = () => selected.size === clinics.length ? setSelected(new Set()) : setSelected(new Set(clinics.map(c => c.id)));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.02, color: C.text, marginBottom: 4 }}>Clinics <span style={{ fontFamily: 'JetBrains Mono, monospace', color: C.text3, fontWeight: 400, fontSize: 18, marginLeft: 8 }}>1,147</span></h1>
          <p style={{ fontSize: 13, color: C.text2 }}>Directory of verified TMS providers. Sorted by leads (30d).</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ padding: '0 12px', height: 36, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{Icons.download}Export CSV</button>
          <button style={{ padding: '0 12px', height: 36, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{Icons.upload}Import</button>
          <button style={{ padding: '0 12px', height: 36, borderRadius: 6, background: C.accent, color: '#fff', fontSize: 12.5, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{Icons.plus}Add clinic</button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
          {[{ k: 'all', l: 'All', n: 1147 }, { k: 'verified', l: 'Verified', n: 1068 }, { k: 'pending', l: 'Pending', n: 23 }, { k: 'premium', l: 'Premium tier', n: 142 }, { k: 'unclaimed', l: 'Unclaimed', n: 184 }, { k: 'stale', l: 'Needs update', n: 37 }].map(t => (
            <button key={t.k} onClick={() => setFilter(t.k)}
              style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, background: filter === t.k ? 'rgba(255,255,255,0.06)' : 'transparent', color: filter === t.k ? C.text : C.text2, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
              {t.l}<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.text3 }}>{t.n}</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button style={{ fontSize: 11.5, color: C.text2, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>{Icons.filter}Filters <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '2px 5px', background: C.surface2, border: `1px solid ${C.border}`, borderBottomWidth: 2, borderRadius: 4, color: C.text2 }}>F</kbd></button>
          </div>
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', flex: 1, maxWidth: 400 }}>
            <span style={{ color: C.text3 }}>{Icons.search}</span>
            <input placeholder="Filter by name, city, owner, or ID…" style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none', color: C.text, fontSize: 12.5 }}/>
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: C.text3, marginLeft: 'auto' }}>1,147 rows · 12 shown</span>
        </div>
      </div>

      {/* Selection banner */}
      {selected.size > 0 && (
        <div style={{ background: 'rgba(79,124,255,0.05)', border: `1px solid rgba(79,124,255,0.3)`, borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, fontSize: 12.5 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: C.accent }}>{selected.size} selected</span>
          <div style={{ height: 16, width: 1, background: `${C.accent}30` }}/>
          <button style={{ color: C.text2, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5 }}>Verify</button>
          <button style={{ color: C.text2, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5 }}>Change tier</button>
          <button style={{ color: C.text2, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5 }}>Suspend</button>
          <button style={{ color: C.red, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5 }}>Delete</button>
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[{ l: '', w: 40 }, { l: 'ID', w: 48 }, { l: 'Clinic' }, { l: 'Location' }, { l: 'Owner' }, { l: 'Tier' }, { l: 'Status' }, { l: 'Leads 30d', ta: 'right' }, { l: 'MRR', ta: 'right' }, { l: 'Rating' }, { l: 'Devices' }, { l: '', w: 40 }].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: C.text3, background: C.surface, borderBottom: `1px solid ${C.border}`, textAlign: (h as any).ta as any || 'left', width: (h as any).w || 'auto', whiteSpace: 'nowrap' }}>
                    {h.l === '' ? <input type="checkbox" checked={selected.size === clinics.length} onChange={allToggle} style={{ accentColor: C.accent }}/> : h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clinics.map(c => (
                <tr key={c.id} style={{ background: selected.has(c.id) ? 'rgba(79,124,255,0.04)' : 'transparent', borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => { if (!selected.has(c.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                  onMouseLeave={e => { if (!selected.has(c.id)) e.currentTarget.style.background = 'transparent'; }}>
                  <td style={{ padding: 12 }}>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} style={{ accentColor: C.accent }}/>
                  </td>
                  <td style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: C.text3 }}>{c.id}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {freshDot(c.fresh)}
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: C.text3 }}>{c.reviews ? `${c.reviews} reviews` : 'No reviews yet'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 12, color: C.text2 }}><span style={{ fontWeight: 500, color: C.text }}>{c.city}</span> <span style={{ fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>{c.state}</span></td>
                  <td style={{ padding: 12, color: C.text2 }}>{c.owner}</td>
                  <td style={{ padding: 12 }}>{tierChip(c.tier)}</td>
                  <td style={{ padding: 12 }}>{statusChip(c.status)}</td>
                  <td style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', fontWeight: 500 }}>{c.leads30 || '—'}</td>
                  <td style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', color: C.text2 }}>{c.rev}</td>
                  <td style={{ padding: 12 }}>
                    {c.rating ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: C.text }}>
                        <span style={{ color: C.amber }}>{Icons.starSmall}</span>{c.rating}
                      </span>
                    ) : <span style={{ color: C.text3 }}>—</span>}
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {c.dev.slice(0, 2).map(d => (
                        <span key={d} style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: C.surface2, border: `1px solid ${C.border2}`, color: C.text2 }}>{d}</span>
                      ))}
                      {c.dev.length > 2 && <span style={{ fontSize: 10.5, color: C.text3 }}>+{c.dev.length - 2}</span>}
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button style={{ color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>{Icons.more}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${C.border}`, fontSize: 11.5, color: C.text2 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>Showing 1–12 of 1,147</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${C.border2}`, color: C.text3, background: 'transparent', cursor: 'pointer' }}>{Icons.chevL}</button>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} style={{ width: 28, height: 28, borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', background: n === 1 ? 'rgba(255,255,255,0.06)' : 'transparent', color: n === 1 ? C.text : C.text2, border: 'none', cursor: 'pointer' }}>{n}</button>
            ))}
            <span style={{ color: C.text3, padding: '0 4px' }}>…</span>
            <button style={{ width: 28, height: 28, borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', color: C.text2, background: 'transparent', border: 'none', cursor: 'pointer' }}>96</button>
            <button style={{ padding: '4px 8px', borderRadius: 4, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', cursor: 'pointer' }}>{Icons.chevR}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Moderation View ─────────────────────────────────────────────────────────────
const ModerationView = () => {
  const [activeIdx, setActiveIdx] = useState(1);
  const [tab, setTab] = useState('Queue');

  const queue = [
    { id: 'mq_8001', type: 'Clinic claim', actor: 'sarah.patel@pacbh.com', target: 'Pacific Brain Health Center', city: 'Santa Monica, CA', at: '14h', risk: 'low', ev: ['NPI verified', 'Domain matches email', 'State license active'] },
    { id: 'mq_8002', type: 'Flagged review', actor: 'anon#44711', target: 'NeuroWell TMS Institute', city: 'Beverly Hills, CA', at: '1h', risk: 'high', ev: ['Contains profanity', '3 flags', 'Account age <24h'] },
    { id: 'mq_8003', type: 'Insurance dispute', actor: 'David R. (patient)', target: 'Sunset Mental Health', city: 'Los Angeles, CA', at: '4h', risk: 'med', ev: ['Aetna not listed', 'Patient uploaded EOB'] },
    { id: 'mq_8004', type: 'Clinic claim', actor: 'admin@bayareaneuro.com', target: 'Bay Area Neuromodulation', city: 'Palo Alto, CA', at: '3h', risk: 'low', ev: ['NPI verified', 'DEA registered'] },
    { id: 'mq_8005', type: 'Content edit', actor: 'Dr. L. Morales', target: 'Manhattan TMS Center', city: 'New York, NY', at: '2h', risk: 'low', ev: ['Hours updated', '3 fields changed'] },
    { id: 'mq_8006', type: 'Photo upload', actor: 'Dr. M. Park', target: 'Westside Psychiatry & TMS', city: 'West Hollywood, CA', at: '30m', risk: 'low', ev: ['12 photos', 'NSFW scan passed'] },
    { id: 'mq_8007', type: 'Flagged review', actor: 'anon#44893', target: 'Chicago Brain Stim', city: 'Chicago, IL', at: '6h', risk: 'med', ev: ['1 flag', 'Contains PHI (auto-redacted)'] },
  ];

  const riskPill = (r: string) => {
    const m: Record<string, { bg: string; c: string }> = { high: { bg: `${C.red}15`, c: C.red }, med: { bg: `${C.amber}15`, c: C.amber }, low: { bg: `${C.green}15`, c: C.green } };
    return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', background: m[r].bg, color: m[r].c }}>{r}</span>;
  };

  const item = queue[activeIdx];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.02, color: C.text, marginBottom: 4 }}>Moderation <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: `${C.red}15`, color: C.red, marginLeft: 8 }}>14 pending</span></h1>
          <p style={{ fontSize: 13, color: C.text2 }}>Triage clinic claims, flagged reviews, and user disputes. SLA target: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: C.text }}>24h</span>.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <div style={{ display: 'flex', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: 4, gap: 4 }}>
            {['Queue', 'Resolved', 'All'].map((t, i) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 12px', borderRadius: 4, background: tab === t ? 'rgba(255,255,255,0.06)' : 'transparent', color: tab === t ? C.text : C.text2, border: 'none', cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
          <button style={{ padding: '0 12px', height: 36, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{Icons.filter}Filters · 2</button>
        </div>
      </div>

      {/* SLA bar */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
        {[
          { l: 'Under 4h', n: '8', c: C.green },
          { l: '4–24h', n: '4', c: C.amber },
          { l: 'Breached SLA', n: '2', c: C.red },
          { l: 'Avg. time', n: '3h 12m', c: '#A78BFA', mono: true },
        ].map((x, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${x.c}15`, color: x.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{Icons.timer}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.02, fontFamily: x.mono ? 'JetBrains Mono, monospace' : 'inherit' }}>{x.n}</div>
              <div style={{ fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{x.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Split: queue list + detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, minHeight: 680 }}>
        {/* Queue list */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Queue · sorted by risk</div>
            <button style={{ fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>Sort</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {queue.map((q, i) => {
              const sel = activeIdx === i;
              return (
                <button key={q.id} onClick={() => setActiveIdx(i)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 16px',
                    borderBottom: `1px solid ${C.border}`, borderLeft: `2px solid ${sel ? C.accent : 'transparent'}`,
                    background: sel ? 'rgba(79,124,255,0.06)' : 'transparent',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {riskPill(q.risk)}
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.text3, marginLeft: 'auto' }}>{q.at} ago</span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 2, color: C.text }}>{q.type}</div>
                  <div style={{ fontSize: 12, color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.target}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.actor}</div>
                </button>
              );
            })}
          </div>
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.text3, fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>7 of 14</span>
            <button style={{ color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>Load more</button>
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {riskPill(item.risk)}
            <span style={{ fontSize: 13, fontWeight: 500 }}>{item.type}</span>
            <span style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>{item.id}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ padding: '0 12px', height: 32, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Prev <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '2px 5px', background: C.surface2, border: `1px solid ${C.border}`, borderBottomWidth: 2, borderRadius: 4, color: C.text2 }}>K</kbd>
              </button>
              <button style={{ padding: '0 12px', height: 32, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Next <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '2px 5px', background: C.surface2, border: `1px solid ${C.border}`, borderBottomWidth: 2, borderRadius: 4, color: C.text2 }}>J</kbd>
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Summary */}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
                <div>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600, marginBottom: 6 }}>Target</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{item.target}</div>
                  <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>{item.city}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600, marginBottom: 6 }}>Submitted by</div>
                  <div style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>{item.actor}</div>
                  <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>IP 73.245.11.8 · Los Angeles</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600, marginBottom: 6 }}>Submitted</div>
                  <div style={{ fontSize: 13 }}>{item.at} ago</div>
                  <div style={{ fontSize: 12, color: C.text2, marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>14:32 UTC today</div>
                </div>
              </div>
            </div>

            {/* Evidence */}
            {item.type === 'Flagged review' ? (
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600, marginBottom: 12 }}>Flagged Content</div>
                <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: `${C.red}15`, color: C.red }}>1★</span>
                    <span style={{ color: C.text2 }}>anon#44711</span>
                    <span style={{ color: C.text3 }}>· 2 hours ago</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(230,234,240,0.9)', lineHeight: 1.6 }}>
                    "This place is a total <span style={{ background: `${C.red}20`, color: C.red, padding: '0 2px', borderRadius: 2 }}>[REDACTED]</span> scam. Dr. Chen doesn't even see patients properly and the billing is — I wouldn't send my worst enemy here."
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 11, color: C.text3 }}>
                    <span>3 flags by users</span><span>·</span><span>Account age: 14 hours</span><span>·</span><span>No verified visit</span>
                  </div>
                </div>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600, marginBottom: 8 }}>Signals</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { l: 'Profanity detected', s: '2 instances', c: C.red },
                    { l: 'User reports', s: '3 flags from 3 unique users', c: C.red },
                    { l: 'Account age', s: '14 hours · single review', c: C.amber },
                    { l: 'Clinic response', s: 'Not yet submitted', c: C.text3 },
                    { l: 'Sentiment model', s: '-0.94 (toxic)', c: C.red },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: C.surface2, borderRadius: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.c, flexShrink: 0 }}/>
                      <span style={{ fontSize: 12.5, flex: 1 }}>{s.l}</span>
                      <span style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: s.c }}>{s.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600, marginBottom: 12 }}>Verification Evidence</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {item.ev.map((e, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: C.surface2, borderRadius: 6 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: `${C.green}15`, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{Icons.check}</span>
                      <span style={{ fontSize: 12.5 }}>{e}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600 }}>Reviewer Notes</div>
                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>3 prior actions on this target</div>
              </div>
              <textarea placeholder="Add an internal note… (visible only to admins)" rows={3} style={{ width: '100%', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, fontSize: 12.5, color: C.text, outline: 'none', resize: 'none' }}/>
            </div>
          </div>

          {/* Action bar */}
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button style={{ padding: '0 16px', height: 36, borderRadius: 6, background: `${C.red}15`, color: C.red, border: `1px solid ${C.red}20`, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              Remove <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '2px 5px', background: `${C.red}15`, border: `1px solid ${C.red}30`, borderRadius: 4 }}>R</kbd>
            </button>
            <button style={{ padding: '0 16px', height: 36, borderRadius: 6, background: C.surface2, border: `1px solid ${C.border2}`, color: C.text2, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              Hide <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '2px 5px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 4 }}>H</kbd>
            </button>
            <button style={{ padding: '0 16px', height: 36, borderRadius: 6, background: C.surface2, border: `1px solid ${C.border2}`, color: C.text2, fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>Escalate</button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>Auto-apply recommended:</span>
              <button style={{ padding: '0 16px', height: 36, borderRadius: 6, background: `${C.green}15`, color: C.green, border: `1px solid ${C.green}20`, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Remove & cooldown <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '2px 5px', background: `${C.green}15`, border: `1px solid ${C.green}30`, borderRadius: 4 }}>⏎</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Leads View ─────────────────────────────────────────────────────────────────
const LeadsView = () => {
  const [stageFilter, setStageFilter] = useState('All');
  const leads = [
    { id: 'ld_8a', p: 'Michael Torres', e: 'm.torres@email.com', ph: '(310) 555-0142', clinic: 'NeuroWell TMS', cond: 'TRD', ins: 'Aetna', stage: 'New', at: '3h', score: 92 },
    { id: 'ld_7b', p: 'Jennifer Liu', e: 'jliu@email.com', ph: '(310) 555-0188', clinic: 'NeuroWell TMS', cond: 'OCD', ins: 'BCBS', stage: 'New', at: '14h', score: 88 },
    { id: 'ld_6c', p: 'David Park', e: 'dpark@email.com', ph: '—', clinic: 'Westside Psych', cond: 'Anxiety', ins: 'Self-pay', stage: 'Contacted', at: '2d', score: 64 },
    { id: 'ld_5d', p: 'Amy Rodriguez', e: 'arod@email.com', ph: '(310) 555-0113', clinic: 'Pacific Brain', cond: 'TRD', ins: 'Cigna', stage: 'Contacted', at: '3d', score: 76 },
    { id: 'ld_4e', p: 'Chris Johnson', e: 'cjohnson@email.com', ph: '(310) 555-0197', clinic: 'Sunset Mental', cond: 'TRD', ins: 'Self-pay', stage: 'Scheduled', at: '5d', score: 81 },
    { id: 'ld_3f', p: 'Priya Sharma', e: 'psharma@email.com', ph: '(415) 555-0234', clinic: 'Bay Area Neuro', cond: 'PTSD', ins: 'Kaiser', stage: 'Scheduled', at: '6d', score: 89 },
    { id: 'ld_2g', p: 'Marcus Webb', e: 'mwebb@email.com', ph: '(212) 555-0111', clinic: 'Manhattan TMS', cond: 'TRD', ins: 'Aetna', stage: 'Won', at: '12d', score: 95 },
    { id: 'ld_1h', p: 'Sarah Kim', e: 'skim@email.com', ph: '—', clinic: 'Manhattan TMS', cond: 'Depression', ins: 'Self-pay', stage: 'Lost', at: '18d', score: 41 },
  ];

  const stageChip = (s: string) => {
    const m: Record<string, string> = { New: C.accent, Contacted: '#A78BFA', Scheduled: C.amber, Won: C.green, Lost: C.red };
    return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: `${m[s] || C.text3}15`, color: m[s] || C.text3 }}>{s}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.02, color: C.text, marginBottom: 4 }}>Leads <span style={{ fontFamily: 'JetBrains Mono, monospace', color: C.text3, fontWeight: 400, fontSize: 18, marginLeft: 8 }}>2,847</span></h1>
          <p style={{ fontSize: 13, color: C.text2 }}>Patient enquiries across all directory clinics · 30 day window</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ padding: '0 12px', height: 36, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{Icons.download}Export</button>
          <button style={{ padding: '0 12px', height: 36, borderRadius: 6, background: C.accent, color: '#fff', fontSize: 12.5, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Route rules</button>
        </div>
      </div>

      {/* Funnel */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600, marginBottom: 16 }}>Conversion Funnel · March</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { s: 'Visits', n: '84,204', p: 100, c: C.accent },
            { s: 'Enquiry', n: '2,847', p: 3.4, c: '#A78BFA', delta: '3.4%' },
            { s: 'Contacted', n: '2,104', p: 2.5, c: C.amber, delta: '74%' },
            { s: 'Scheduled', n: '1,108', p: 1.3, c: C.green, delta: '53%' },
            { s: 'Won', n: '687', p: 0.8, c: C.green, delta: '62%' },
          ].map((x, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 11, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <span>{x.s}</span>
                {x.delta && <span style={{ fontFamily: 'JetBrains Mono, monospace', color: x.c }}>{x.delta}</span>}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 600, letterSpacing: -0.02, marginBottom: 8 }}>{x.n}</div>
              <div style={{ height: 4, background: C.surface2, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: x.c, borderRadius: 2, width: `${Math.max(x.p * 12, 8)}%` }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          <div style={{ display: 'flex', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: 4, gap: 4 }}>
            {['All', 'New (92)', 'Contacted', 'Scheduled', 'Won', 'Lost'].map((t, i) => (
              <button key={t} onClick={() => setStageFilter(t)}
                style={{ padding: '4px 10px', borderRadius: 4, background: stageFilter === t ? 'rgba(255,255,255,0.06)' : 'transparent', color: stageFilter === t ? C.text : C.text2, border: 'none', cursor: 'pointer', fontSize: 12 }}>{t}</button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: C.text3 }}>Showing 8 of 2,847</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['ID', 'Patient', 'Routed to', 'Condition · Insurance', 'Score', 'Stage', 'Age', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 12px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: C.text3, background: C.surface, borderBottom: `1px solid ${C.border}`, textAlign: i === 0 || i === 4 || i === 6 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: C.text3, textAlign: 'right' }}>{l.id}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.surface2, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                        {l.p.split(' ').map((w: string) => w[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{l.p}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, color: C.text3 }}>{l.e}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 12, color: C.text2 }}>{l.clinic}</td>
                  <td style={{ padding: 12, color: C.text2 }}>{l.cond} <span style={{ color: C.text3 }}>·</span> {l.ins}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <div style={{ width: 56, height: 4, background: C.surface2, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: l.score > 80 ? C.green : l.score > 60 ? C.amber : C.red, width: `${l.score}%` }}/>
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: C.text2, width: 24, textAlign: 'right' }}>{l.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: 12 }}>{stageChip(l.stage)}</td>
                  <td style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: C.text3, textAlign: 'right' }}>{l.at}</td>
                  <td style={{ padding: 12 }}>
                    <button style={{ color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>{Icons.chevR}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Revenue View ────────────────────────────────────────────────────────────────
const RevenueView = () => (
  <div>
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.02, color: C.text, marginBottom: 4 }}>
          Revenue <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: `${C.green}15`, color: C.green, marginLeft: 8 }}>+11.2% MoM</span>
        </h1>
        <p style={{ fontSize: 13, color: C.text2 }}>Subscription and ad revenue across all tiers</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ padding: '0 12px', height: 36, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>View in Stripe {Icons.ext}</button>
        <button style={{ padding: '0 12px', height: 36, borderRadius: 6, background: C.accent, color: '#fff', fontSize: 12.5, fontWeight: 500, border: 'none', cursor: 'pointer' }}>Run billing</button>
      </div>
    </div>

    {/* KPIs */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
      <KPI label="MRR" value="$52,100" delta={11.2} sub="228 paying · $228 ARPU" spark={[28, 26, 24, 22, 20, 18, 14, 12, 10, 8, 6, 4]}/>
      <KPI label="ARR" value="$625K" delta={14.8} sub="Trailing 12mo" spark={[24, 22, 20, 18, 14, 16, 12, 14, 10, 8, 6, 4]}/>
      <KPI label="New MRR" value="$8,940" delta={24.1} sub="+62 clinics this mo" spark={[8, 12, 10, 16, 14, 18, 12, 20, 22, 18, 24, 20]}/>
      <KPI label="Churn (logo)" value="2.1%" delta={-0.4} sub="3 cancelled · 2 downgrades" spark={[18, 16, 18, 14, 16, 12, 14, 10, 12, 8, 10, 6]}/>
    </div>

    {/* Big chart */}
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, fontWeight: 600, marginBottom: 4 }}>MRR Movement · 12 Months</div>
          <div style={{ fontSize: 24, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>$52,100</div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11.5 }}>
          {[{ l: 'New', c: C.green }, { l: 'Expansion', c: C.accent }, { l: 'Contraction', c: C.amber }, { l: 'Churn', c: C.red }].map(x => (
            <span key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: x.c }}/><span style={{ color: C.text2 }}>{x.l}</span></span>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 800 240" style={{ width: '100%', height: 240 }}>
        {[48, 96, 144, 192].map((y, i) => <line key={i} x1="40" y1={y} x2="800" y2={y} stroke={C.border} strokeWidth="0.5" strokeDasharray="2 4"/>)}
        {Array.from({ length: 12 }).map((_, i) => {
          const x = 60 + i * 62;
          const h = 50 + Math.sin(i * 0.8) * 40;
          return (
            <g key={i}>
              <rect x={x} y={240 - 60 - h} width="40" height={h} fill={C.accent} opacity="0.2" rx="2"/>
              <rect x={x} y={240 - 60 - Math.max(0, h - 20)} width="40" height={20} fill={C.green} rx="2"/>
              <text x={x + 20} y="232" fill={C.text3} fontSize="10" fontFamily="JetBrains Mono" textAnchor="middle">{['A','M','J','J','A','S','O','N','D','J','F','M'][i]}</text>
            </g>
          );
        })}
      </svg>
    </div>

    {/* Split */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Tier Breakdown</div>
          <button style={{ fontSize: 11, color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>Manage plans</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Tier', 'Price', 'Clinics', 'MRR', '% of Total'].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, color: C.text3, background: C.surface, borderBottom: `1px solid ${C.border}`, textAlign: i > 0 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { t: 'Premium', p: '$299/mo', c: 42, m: '$12,558', pct: 24.1, col: '#A78BFA' },
              { t: 'Practice', p: '$149/mo', c: 148, m: '$22,052', pct: 42.3, col: C.accent },
              { t: 'Free', p: '$0', c: 919, m: '$0', pct: 0, col: C.text3 },
              { t: 'Ad placement', p: 'CPC', c: 38, m: '$17,490', pct: 33.6, col: C.amber },
            ].map((r, i) => (
              <tr key={i} style={{ borderBottom: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                <td style={{ padding: 12 }}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, border: `1px solid ${r.col}30`, color: r.col, background: 'transparent' }}>{r.t}</span></td>
                <td style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', color: C.text2 }}>{r.p}</td>
                <td style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{r.c}</td>
                <td style={{ padding: 12, fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', fontWeight: 500 }}>{r.m}</td>
                <td style={{ padding: 12, textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                    <div style={{ width: 80, height: 4, background: C.surface2, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: r.col, borderRadius: 2, width: `${r.pct}%` }}/>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: C.text2, width: 40, textAlign: 'right' }}>{r.pct}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Failed payments */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Failed Payments</div>
          <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: `${C.red}15`, color: C.red }}>3</span>
        </div>
        {[
          { c: 'Chicago Brain Stim', amt: '$149', err: 'card_declined', at: '2h' },
          { c: 'Better TMS LLC', amt: '$0', err: 'no_payment_method', at: '1d' },
          { c: 'Austin Behavioral', amt: '$149', err: 'expired_card', at: '3d' },
        ].map((x, i) => (
          <div key={i} style={{ padding: '12px 20px', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{x.c}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: C.red, fontSize: 12 }}>{x.amt}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.text3, marginBottom: 8 }}>
              <span>{x.err}</span><span>·</span><span>{x.at} ago</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ fontSize: 11, color: C.text2, padding: '2px 8px', borderRadius: 4, background: C.surface2, border: 'none', cursor: 'pointer' }}>Retry</button>
              <button style={{ fontSize: 11, color: C.text2, padding: '2px 8px', borderRadius: 4, background: C.surface2, border: 'none', cursor: 'pointer' }}>Dunning email</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Audit View ─────────────────────────────────────────────────────────────────
const AuditView = () => {
  const audit = [
    { t: '2024-03-28 14:32:11', actor: 'ana@tmslist.com', ip: '73.245.11.8', act: 'clinic.verified', target: 'cl_8f2a', detail: 'verified NeuroWell TMS Institute', sev: 'info' },
    { t: '2024-03-28 14:28:04', actor: 'system', ip: 'internal', act: 'review.auto_flagged', target: 'rv_4411', detail: '2 signals: profanity, low account age', sev: 'warn' },
    { t: '2024-03-28 14:12:58', actor: 'maria@tmslist.com', ip: '24.18.88.102', act: 'lead.viewed', target: 'ld_8a', detail: 'opened lead from Manhattan TMS', sev: 'info' },
    { t: '2024-03-28 13:59:21', actor: 'ana@tmslist.com', ip: '73.245.11.8', act: 'clinic.rejected', target: 'cl_1f6a', detail: 'Better TMS LLC · reason: unverified clinician', sev: 'warn' },
    { t: '2024-03-28 13:45:02', actor: 'system', ip: 'internal', act: 'billing.auto_charge', target: 'cl_2e7b', detail: 'Manhattan TMS · $299 Premium', sev: 'info' },
    { t: '2024-03-28 13:22:14', actor: 'jose@tmslist.com', ip: '66.12.44.1', act: 'content.published', target: 'post_8812', detail: 'SAINT protocol explained', sev: 'info' },
    { t: '2024-03-28 12:58:39', actor: 'system', ip: 'internal', act: 'security.login_failed', target: 'admin panel', detail: '4 failed attempts · ana@tmslist.com · locked for 15m', sev: 'danger' },
    { t: '2024-03-28 12:41:07', actor: 'ana@tmslist.com', ip: '73.245.11.8', act: 'user.role_changed', target: 'maria@tmslist.com', detail: 'editor → admin', sev: 'warn' },
    { t: '2024-03-28 12:14:55', actor: 'api_key:k_c4e1', ip: '34.102.8.44', act: 'clinic.api_created', target: 'cl_new_3398', detail: 'via Zapier integration', sev: 'info' },
    { t: '2024-03-28 11:42:18', actor: 'system', ip: 'internal', act: 'backup.completed', target: 'full_db', detail: 'size: 4.2GB · duration 2m 14s', sev: 'info' },
  ];

  const sevColor: Record<string, string> = { info: C.text2, warn: C.amber, danger: C.red };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.02, color: C.text, marginBottom: 4 }}>Audit Trail</h1>
          <p style={{ fontSize: 13, color: C.text2 }}>Immutable record of all privileged actions. Retained 7 years per HIPAA policy.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ padding: '0 12px', height: 36, borderRadius: 6, border: `1px solid ${C.border2}`, color: C.text2, background: 'transparent', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{Icons.download}Export signed log</button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', flex: 1, minWidth: 280 }}>
          <span style={{ color: C.text3 }}>{Icons.search}</span>
          <input placeholder="Filter: actor:ana@ action:clinic.* target:cl_*" style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none', color: C.text, fontSize: 11.5, fontFamily: 'JetBrains Mono, monospace' }}/>
        </div>
        {['All actions', 'All users', 'Last 24h'].map(t => (
          <button key={t} style={{ padding: '0 12px', height: 32, borderRadius: 6, background: C.surface2, border: `1px solid ${C.border}`, color: C.text2, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>{t} {Icons.chevD}</button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>Severity:</span>
          {[{ l: 'info', c: C.text3 }, { l: 'warn', c: C.amber }, { l: 'danger', c: C.red }].map(x => (
            <button key={x.l} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: x.l === 'warn' ? `${C.amber}15` : x.l === 'danger' ? `${C.red}15` : 'rgba(255,255,255,0.05)', color: x.c, border: 'none', cursor: 'pointer' }}>{x.l}</button>
          ))}
        </div>
      </div>

      {/* Log table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.green }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }}/> Live</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>Tailing · last 10</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>10,284 events today</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          {audit.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 180px 180px 1fr 60px', gap: 16, padding: '10px 16px', borderBottom: i < audit.length - 1 ? `1px solid ${C.border}` : 'none', fontSize: 11.5, alignItems: 'start' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ color: C.text3 }}>{r.t.slice(5, 19)}</span>
              <span style={{ color: sevColor[r.sev] || C.text2 }}>{r.actor}</span>
              <span style={{ color: C.text, fontWeight: 500 }}>{r.act}</span>
              <span style={{ color: C.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.detail} <span style={{ color: C.text3 }}>→ {r.target}</span></span>
              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 500, background: r.sev === 'info' ? 'rgba(255,255,255,0.05)' : r.sev === 'warn' ? `${C.amber}15` : `${C.red}15`, color: sevColor[r.sev] || C.text3, marginLeft: 'auto' }}>{r.sev}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: C.text3 }}>
          <span>10 / 10,284</span>
          <button style={{ color: C.accent, background: 'none', border: 'none', cursor: 'pointer' }}>Load more ↓</button>
        </div>
      </div>
    </div>
  );
};

// ── Main App ────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [page, setPage] = useState('overview');

  useEffect(() => {
    // Apply global font
    document.body.style.fontFamily = "'Inter', system-ui, sans-serif";
    document.body.style.fontFeatureSettings = "'tnum' on";
  }, []);

  const render = () => {
    switch (page) {
      case 'overview': return <OverviewView/>;
      case 'clinics': return <ClinicsView/>;
      case 'moderation': return <ModerationView/>;
      case 'leads': return <LeadsView/>;
      case 'revenue': return <RevenueView/>;
      case 'audit': return <AuditView/>;
      default: return <OverviewView/>;
    }
  };

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: ${C.border2}; border-radius: 4px; }
        *::-webkit-scrollbar-thumb:hover { background: ${C.text3}; }
        html { scroll-behavior: smooth; }
      `}</style>
      <Sidebar page={page} onNav={setPage}/>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar page={page}/>
        <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
          <div style={{ maxWidth: 1500, margin: '0 auto' }}>{render()}</div>
        </main>
      </div>
    </div>
  );
}
