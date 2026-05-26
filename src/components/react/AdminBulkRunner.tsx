import { useEffect, useMemo, useState } from 'react';

type EntityKey = 'clinics' | 'reviews' | 'leads';

interface EntityConfig {
  key: EntityKey;
  label: string;
  endpoint: string;
  resultsKey: string;
  searchParam: string;
  rowLabel: (row: Record<string, unknown>) => string;
  rowSubtitle: (row: Record<string, unknown>) => string;
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  actions: {
    key: string;
    label: string;
    description: string;
    destructive?: boolean;
    confirm?: string;
  }[];
}

const ENTITIES: Record<EntityKey, EntityConfig> = {
  clinics: {
    key: 'clinics',
    label: 'Clinics',
    endpoint: '/api/admin/clinics',
    resultsKey: 'data',
    searchParam: 'search',
    rowLabel: r => String(r.name || r.slug || r.id),
    rowSubtitle: r => [r.city, r.state, r.country].filter(Boolean).join(', ') || '—',
    filters: [
      {
        key: 'verified',
        label: 'Verification',
        options: [
          { value: '', label: 'Any' },
          { value: 'true', label: 'Verified only' },
          { value: 'false', label: 'Unverified only' },
        ],
      },
    ],
    actions: [
      { key: 'verify_clinics', label: 'Verify', description: 'Mark all as verified.' },
      { key: 'unverify_clinics', label: 'Un-verify', description: 'Mark all as unverified.' },
      { key: 'feature_clinics', label: 'Feature', description: 'Feature on listings.' },
      { key: 'unfeature_clinics', label: 'Un-feature', description: 'Remove featured flag.' },
      {
        key: 'delete_clinics',
        label: 'Delete',
        description: 'Permanently delete. Cannot be undone.',
        destructive: true,
        confirm: 'Type DELETE to confirm',
      },
    ],
  },
  reviews: {
    key: 'reviews',
    label: 'Reviews',
    endpoint: '/api/admin/reviews',
    resultsKey: 'data',
    searchParam: 'search',
    rowLabel: r => `${r.userName || 'Anonymous'} — ${r.rating || '?'}★`,
    rowSubtitle: r => String(r.title || r.body || '').slice(0, 80),
    actions: [
      { key: 'approve_reviews', label: 'Approve', description: 'Mark as approved.' },
      { key: 'reject_reviews', label: 'Reject', description: 'Set approved=false.' },
      {
        key: 'delete_reviews',
        label: 'Delete',
        description: 'Permanently delete reviews.',
        destructive: true,
        confirm: 'Type DELETE to confirm',
      },
    ],
  },
  leads: {
    key: 'leads',
    label: 'Leads',
    endpoint: '/api/admin/leads',
    resultsKey: 'data',
    searchParam: 'search',
    rowLabel: r => String(r.name || r.email || r.id),
    rowSubtitle: r => `${r.email || ''}${r.phone ? ` · ${r.phone}` : ''} · ${r.type || ''}`,
    actions: [
      { key: 'export_leads', label: 'Export JSON', description: 'Download selected leads as JSON.' },
      {
        key: 'delete_leads',
        label: 'Delete',
        description: 'Permanently delete leads.',
        destructive: true,
        confirm: 'Type DELETE to confirm',
      },
    ],
  },
};

const BATCH_SIZE = 100;

export default function AdminBulkRunner() {
  const [entityKey, setEntityKey] = useState<EntityKey>('clinics');
  const entity = ENTITIES[entityKey];

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [pasteIds, setPasteIds] = useState('');

  const [previewing, setPreviewing] = useState(false);
  const [items, setItems] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const [actionKey, setActionKey] = useState<string>('');
  const [confirmInput, setConfirmInput] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const action = entity.actions.find(a => a.key === actionKey);

  // Reset filters/selection when entity changes.
  useEffect(() => {
    setSearch('');
    setFilters({});
    setItems([]);
    setSelected(new Set());
    setActionKey('');
    setResult(null);
    setError('');
  }, [entityKey]);

  const idList = useMemo(() => {
    return pasteIds
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [pasteIds]);

  async function preview() {
    setPreviewing(true);
    setError('');
    setResult(null);
    try {
      if (idList.length > 0) {
        // Trust pasted IDs as-is; show as opaque rows.
        const rows = idList.map(id => ({ id, _pasted: true } as any));
        setItems(rows);
        setSelected(new Set(idList));
        return;
      }
      const params = new URLSearchParams();
      if (search) params.set(entity.searchParam, search);
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }
      params.set('limit', '200');
      const res = await fetch(`${entity.endpoint}?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows = (data[entity.resultsKey] || []) as Array<Record<string, unknown> & { id: string }>;
      setItems(rows);
      setSelected(new Set(rows.map(r => r.id)));
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setItems([]);
      setSelected(new Set());
    } finally {
      setPreviewing(false);
    }
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(r => r.id)));
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function run() {
    if (!action) return;
    if (selected.size === 0) return;
    if (action.confirm && confirmInput !== 'DELETE') {
      setError('Type DELETE to confirm.');
      return;
    }
    setError('');
    setResult(null);
    setRunning(true);
    const ids = [...selected];
    setProgress({ done: 0, total: ids.length });

    let exportData: any[] = [];
    try {
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const res = await fetch('/api/admin/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: actionKey, ids: batch }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Batch ${i / BATCH_SIZE + 1} failed (${res.status})`);
        }
        const j = await res.json();
        if (j.data && Array.isArray(j.data)) exportData = exportData.concat(j.data);
        setProgress(p => ({ ...p, done: Math.min(p.done + batch.length, ids.length) }));
      }
      if (actionKey === 'export_leads') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setResult({ ok: true, message: `${action.label} succeeded for ${ids.length} item${ids.length === 1 ? '' : 's'}.` });
      setConfirmInput('');
      // Refresh preview if we deleted items.
      if (actionKey.startsWith('delete_')) {
        setItems([]);
        setSelected(new Set());
      }
    } catch (e: any) {
      setResult({ ok: false, message: e.message || 'Bulk operation failed.' });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--ink)]">Bulk Operations</h1>
        <p className="text-sm text-[var(--muted)] mt-1 max-w-3xl">
          Select an entity, narrow with filters or paste IDs, preview, then run an action against all matching items.
          Operations larger than {BATCH_SIZE} are auto-batched. All actions are audit-logged.
        </p>
      </header>

      {/* Entity tabs */}
      <div className="flex gap-2 border-b border-[var(--line)]">
        {(Object.keys(ENTITIES) as EntityKey[]).map(k => (
          <button
            key={k}
            onClick={() => setEntityKey(k)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              entityKey === k
                ? 'border-[var(--ink)] text-[var(--ink)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {ENTITIES[k].label}
          </button>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-[var(--line)] p-5 space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-3">
            1. Select items
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--ink2)] mb-1">Search</label>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, slug, email…"
                className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm focus:ring-2 focus:ring-[#1E2A3B]"
              />
            </div>
            {entity.filters?.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-[var(--ink2)] mb-1">{f.label}</label>
                <select
                  value={filters[f.key] || ''}
                  onChange={e => setFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm bg-white"
                >
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>

          <details className="mt-3">
            <summary className="text-xs font-medium text-[var(--muted)] cursor-pointer hover:text-[var(--ink)]">
              Or paste IDs (one per line / comma-separated)
            </summary>
            <textarea
              value={pasteIds}
              onChange={e => setPasteIds(e.target.value)}
              rows={4}
              placeholder="uuid-1, uuid-2, uuid-3…"
              className="w-full mt-2 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#1E2A3B]"
              spellCheck={false}
            />
            {idList.length > 0 && (
              <p className="text-xs text-[var(--muted)] mt-1">{idList.length} ID{idList.length === 1 ? '' : 's'} parsed.</p>
            )}
          </details>

          <div className="mt-3 flex gap-2">
            <button
              onClick={preview}
              disabled={previewing}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--ink)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {previewing ? 'Loading…' : 'Preview matches'}
            </button>
            {(items.length > 0 || pasteIds) && (
              <button
                onClick={() => { setItems([]); setSelected(new Set()); setPasteIds(''); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            {error}
          </div>
        )}

        {items.length > 0 && (
          <div className="border border-[var(--line)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--paper2)] border-b border-[var(--line)]">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--ink2)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === items.length && items.length > 0}
                  onChange={toggleAll}
                />
                {selected.size} of {items.length} selected
              </label>
              <span className="text-[11px] text-[var(--muted)]">
                {items.length === 200 && '(showing first 200 — narrow your filter to see more)'}
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {items.map(row => (
                <label
                  key={row.id}
                  className="flex items-center gap-3 px-3 py-2 border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--paper2)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--ink)] truncate">
                      {(row as any)._pasted ? <code className="text-xs">{row.id}</code> : entity.rowLabel(row)}
                    </div>
                    {!(row as any)._pasted && (
                      <div className="text-xs text-[var(--muted)] truncate">{entity.rowSubtitle(row)}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-[var(--line)] p-5 space-y-4">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">
          2. Choose action
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entity.actions.map(a => (
            <label
              key={a.key}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                actionKey === a.key
                  ? 'border-[var(--ink)] bg-[var(--paper2)]'
                  : 'border-[var(--line)] hover:bg-[var(--paper2)]'
              }`}
            >
              <input
                type="radio"
                name="bulk-action"
                value={a.key}
                checked={actionKey === a.key}
                onChange={() => setActionKey(a.key)}
                className="mt-0.5"
              />
              <div>
                <div className={`text-sm font-semibold ${a.destructive ? 'text-rose-700' : 'text-[var(--ink)]'}`}>
                  {a.label}
                </div>
                <div className="text-xs text-[var(--muted)] mt-0.5">{a.description}</div>
              </div>
            </label>
          ))}
        </div>

        {action?.confirm && (
          <div>
            <label className="block text-xs font-medium text-rose-700 mb-1">{action.confirm}</label>
            <input
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              placeholder="DELETE"
              className="w-48 rounded-lg border border-rose-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-rose-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-[var(--line)]">
          <p className="text-sm text-[var(--muted)]">
            {selected.size > 0 && action ? (
              <>
                Will run <strong className="text-[var(--ink)]">{action.label}</strong> on{' '}
                <strong className="text-[var(--ink)]">{selected.size}</strong> {entity.label.toLowerCase()}
              </>
            ) : (
              'Select items and an action above to enable.'
            )}
          </p>
          <button
            onClick={run}
            disabled={running || selected.size === 0 || !action}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
              action?.destructive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[var(--ink)] hover:opacity-90'
            }`}
          >
            {running
              ? `Running… ${progress.done}/${progress.total}`
              : action?.destructive
                ? `Run ${action.label} (destructive)`
                : `Run ${action?.label || 'action'}`}
          </button>
        </div>

        {running && progress.total > 0 && (
          <div className="w-full h-2 rounded-full bg-[var(--paper2)] overflow-hidden">
            <div
              className="h-full bg-[var(--ink)] transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        )}

        {result && (
          <div
            className={`px-4 py-3 rounded-lg text-sm border ${
              result.ok
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {result.message}
          </div>
        )}
      </section>
    </div>
  );
}
