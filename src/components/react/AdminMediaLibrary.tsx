import { useState, useEffect, useRef } from 'react';

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadedBy: string;
  createdAt: string;
  tags: string[];
}

type SortField = 'createdAt' | 'size' | 'filename';
type SortDir = 'asc' | 'desc';

export default function AdminMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: 'createdAt', dir: 'desc' });
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/media')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.item) setItems(prev => [data.item, ...prev]);
      } catch { /* silent */ }
    }
    setUploading(false);
  }

  async function deleteItems(ids: string[]) {
    try {
      await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setItems(prev => prev.filter(i => !ids.includes(i.id)));
      setSelected([]);
    } catch { /* silent */ }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).catch(() => {});
  }

  const filtered = items
    .filter(i => !filter || i.filename.toLowerCase().includes(filter.toLowerCase()) || i.tags.some(t => t.includes(filter)))
    .sort((a, b) => {
      let cmp = 0;
      if (sort.field === 'createdAt') cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      else if (sort.field === 'size') cmp = b.size - a.size;
      else cmp = a.filename.localeCompare(b.filename);
      return sort.dir === 'asc' ? cmp : -cmp;
    });

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isImage(mime: string): boolean {
    return mime.startsWith('image/');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[rgba(10,22,40,0.15)] border-t-[#0A1628] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Media Library</h1>
          <p className="text-[var(--muted)] mt-1">{items.length} files, {formatSize(items.reduce((s, i) => s + i.size, 0))} total</p>
        </div>
        {selected.length > 0 && (
          <button
            onClick={() => deleteItems(selected)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete {selected.length} selected
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[var(--line)] rounded-lg focus:outline-none focus:border-[rgba(10,22,40,0.2)] focus:ring-2 focus:ring-[rgba(10,22,40,0.1)]"
          />
        </div>
        <div className="flex gap-1 bg-[var(--paper2)] rounded-lg p-1">
          {(['createdAt', 'size', 'filename'] as SortField[]).map(field => (
            <button
              key={field}
              onClick={() => setSort(prev => prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'desc' })}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                sort.field === field ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--ink2)] hover:text-[var(--ink)]'
              }`}
            >
              {field === 'createdAt' ? 'Date' : field} {sort.field === field ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-[var(--ink)] text-white text-sm font-medium rounded-lg hover:bg-[var(--ink)] disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading...' : '+ Upload'}
        </button>
        <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,application/pdf" onChange={e => e.target.files && handleUpload(e.target.files)} className="hidden" />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[var(--line)]">
          <svg className="w-12 h-12 text-[var(--line)] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-[var(--muted)]">No media files found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className={`relative bg-white rounded-xl border overflow-hidden group cursor-pointer transition-all ${
                selected.includes(item.id) ? 'border-[var(--ink2)] ring-2 ring-[rgba(10,22,40,0.1)]' : 'border-[var(--line)] hover:border-[rgba(10,22,40,0.2)]'
              }`}
              onClick={() => setPreviewItem(item)}
            >
              <div className="aspect-square bg-[var(--paper2)] flex items-center justify-center overflow-hidden">
                {isImage(item.mimeType) ? (
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <svg className="w-10 h-10 text-[var(--line)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-[var(--ink)] truncate">{item.filename}</p>
                <p className="text-[11px] text-[var(--muted)]">{formatSize(item.size)}</p>
              </div>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={e => {
                  e.stopPropagation();
                  setSelected(prev => e.target.checked ? [...prev, item.id] : prev.filter(id => id !== item.id));
                }}
                className="absolute top-2 left-2 w-4 h-4 rounded border-[var(--line)] text-[var(--ink)]"
                onClick={e => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewItem(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--ink)] truncate">{previewItem.filename}</h3>
              <button onClick={() => setPreviewItem(null)} className="text-[var(--muted)] hover:text-[var(--ink2)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4">
              {isImage(previewItem.mimeType) ? (
                <img src={previewItem.url} alt={previewItem.filename} className="max-w-full rounded-lg" />
              ) : (
                <div className="text-center py-8 text-[var(--muted)]">Preview not available for this file type</div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium text-[var(--muted)]">Size:</span> {formatSize(previewItem.size)}</div>
                <div><span className="font-medium text-[var(--muted)]">Type:</span> {previewItem.mimeType}</div>
                <div><span className="font-medium text-[var(--muted)]">Uploaded:</span> {new Date(previewItem.createdAt).toLocaleDateString()}</div>
                {previewItem.width && <div><span className="font-medium text-[var(--muted)]">Dimensions:</span> {previewItem.width}x{previewItem.height}</div>}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-[var(--ink2)] mb-1">URL</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={previewItem.url} className="flex-1 px-3 py-2 text-sm bg-[var(--paper2)] border border-[var(--line)] rounded-lg font-mono" />
                  <button onClick={() => copyUrl(previewItem.url)} className="px-3 py-2 text-sm font-medium text-[var(--ink)] bg-[rgba(10,22,40,0.08)] hover:bg-[rgba(10,22,40,0.08)] rounded-lg transition-colors">Copy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}