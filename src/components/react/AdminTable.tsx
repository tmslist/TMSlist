import { useState, useEffect, useCallback, ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

interface AdminTableProps<T extends { id: string }> {
  columns: Column<T>[];
  fetchFn: (params: { page: number; search: string; filter?: string; sort?: string }) => Promise<{ data: T[]; total: number }>;
  searchPlaceholder?: string;
  filters?: { key: string; label: string; options: FilterOption[] }[];
  sortOptions?: { value: string; label: string }[];
  defaultSort?: string;
  rowActions?: (row: T) => ReactNode;
  bulkActions?: { label: string; onClick: (ids: string[]) => void; variant?: 'default' | 'danger' }[];
  exportFn?: (data: T[]) => void;
  emptyMessage?: string;
  filterDefault?: string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  fetchFn,
  searchPlaceholder = 'Search...',
  filters,
  sortOptions,
  defaultSort = 'newest',
  rowActions,
  bulkActions,
  exportFn,
  emptyMessage = 'No data found.',
  filterDefault,
}: AdminTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(filterDefault || '');
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchFn({ page, search, filter: activeFilter, sort });
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, search, activeFilter, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSelected(new Set()); }, [page, search, activeFilter, sort]);
  useEffect(() => { setShowBulkBar(selected.size > 0); }, [selected]);

  function toggleAll() {
    setSelected(selected.size === data.length ? new Set() : new Set(data.map(d => d.id)));
  }
  function toggleOne(id: string) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function handleBulkDelete() {
    setConfirmDelete(false);
    bulkActions?.find(a => a.variant === 'danger')?.onClick(Array.from(selected));
  }
  function handleBulkAction(action: string) {
    bulkActions?.find(a => a.label.toLowerCase() === action)?.onClick(Array.from(selected));
    setSelected(new Set());
  }

  function SkeletonRow({ cols }: { cols: number }) {
    return (
      <tr>
        <td className="px-4 py-3.5"><div className="w-4 h-4 bg-gray-200 rounded animate-pulse" /></td>
        {Array.from({ length: cols - 1 }).map((_, i) => (
          <td key={i} className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + (i * 15) % 40}%` }} /></td>
        ))}
      </tr>
    );
  }

  const totalPages = Math.ceil(total / limit);
  const allSelected = data.length > 0 && selected.size === data.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <input type="text" placeholder={searchPlaceholder} value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-violet-500 focus:ring-violet-500" />
        </div>
        {filters?.map(f => (
          <div key={f.key} className="flex gap-1 flex-wrap">
            {f.options.map(opt => (
              <button key={opt.value} onClick={() => { setActiveFilter(opt.value); setPage(0); }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeFilter === opt.value ? 'bg-violet-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        ))}
        {sortOptions && (
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:border-violet-500 focus:ring-violet-500">
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          {error} <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 text-xs font-medium">Dismiss</button>
        </div>
      )}

      <div className="text-sm text-gray-500">{total} item{total !== 1 ? 's' : ''} found{selected.size > 0 && <span className="ml-2 font-medium text-violet-600">{selected.size} selected</span>}</div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3"><input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer" /></th>
                {columns.map(col => <th key={col.key} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${col.sortable ? 'cursor-pointer hover:text-gray-700' : ''} ${col.className || ''}`}>{col.header}</th>)}
                {rowActions && <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={columns.length + (rowActions ? 2 : 1)} />)
               : data.length === 0 ? <tr><td colSpan={columns.length + (rowActions ? 3 : 2)} className="px-4 py-12 text-center text-gray-500">{emptyMessage}</td></tr>
               : data.map(row => (
                <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${selected.has(row.id) ? 'bg-violet-50/40' : ''}`}>
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer" /></td>
                  {columns.map(col => <td key={col.key} className={`px-4 py-3 text-sm ${col.className || ''}`}>{col.render ? col.render(row) : (row as any)[col.key]}</td>)}
                  {rowActions && <td className="px-4 py-3"><div className="flex gap-2">{rowActions(row)}</div></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">Page {page + 1} of {totalPages}</div>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {showBulkBar && (bulkActions || exportFn) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-medium">{selected.size} selected</span><div className="w-px h-5 bg-gray-600" />
          {exportFn && <button onClick={() => exportFn(data.filter(d => selected.has(d.id)))} className="flex items-center gap-1.5 text-sm text-gray-200 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Export CSV</button>}
          {bulkActions?.map(action => (
            <button key={action.label} onClick={() => action.variant === 'danger' ? setConfirmDelete(true) : handleBulkAction(action.label.toLowerCase())}
              className={`flex items-center gap-1.5 text-sm ${action.variant === 'danger' ? 'text-red-400 hover:text-red-300' : 'text-gray-200 hover:text-white'}`}>
              {action.label}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-600" />
          <button onClick={() => setSelected(new Set())} className="text-sm text-gray-400 hover:text-white"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
              <div><h3 className="text-lg font-semibold text-gray-900">Delete {selected.size} items?</h3><p className="text-sm text-gray-500">This cannot be undone.</p></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleBulkDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}