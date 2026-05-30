import { useState, useEffect } from 'react';
import { PortalCard, PortalButton, PortalInput, LoadingScreen, ErrorScreen } from './PortalUI';

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  alt: string;
}

export default function PortalGallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [media, setMedia] = useState<{ hero_image_url?: string; logo_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    fetch('/api/portal/gallery')
      .then(async r => {
        if (!r.ok) throw new Error('Failed to load gallery');
        const d = await r.json();
        setPhotos(d.data ?? []);
        setMedia(d.media ?? null);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function saveGallery(urls: string[]) {
    setSaving(true);
    try {
      const res = await fetch('/api/portal/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery_urls: urls }),
      });
      if (!res.ok) throw new Error('Save failed');
      setPhotos(urls.map((url, i) => ({ id: `img:${i}`, url, caption: '', alt: '' })));
    } catch {
      alert('Failed to save gallery');
    } finally {
      setSaving(false);
    }
  }

  function addPhoto() {
    if (!newUrl.trim()) return;
    const updated = [...photos.map(p => p.url), newUrl.trim()];
    saveGallery(updated);
    setNewUrl('');
  }

  function removePhoto(id: string) {
    const updated = photos.filter(p => p.id !== id).map(p => p.url);
    saveGallery(updated);
  }

  if (loading) return <LoadingScreen message="Loading gallery..." />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      {/* Add photo */}
      <PortalCard padding="md">
        <h3 className="text-sm font-semibold text-[var(--ink)] mb-3">Add Photo</h3>
        <div className="flex gap-3">
          <PortalInput
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="flex-1"
          />
          <PortalButton variant="primary" onClick={addPhoto} disabled={!newUrl.trim() || saving}>
            {saving ? 'Saving...' : 'Add'}
          </PortalButton>
        </div>
        <p className="text-xs text-[var(--muted)] mt-2">Enter an image URL. Supported: JPG, PNG, WebP.</p>
      </PortalCard>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <PortalCard padding="lg">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--paper2)] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[var(--muted)] text-sm">No photos in gallery</p>
            <p className="text-[var(--muted)] text-xs mt-1">Add treatment room, waiting area, and team photos.</p>
          </div>
        </PortalCard>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, i) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url}
                alt={photo.alt || `Gallery photo ${i + 1}`}
                className="w-full aspect-square object-cover rounded-xl border border-[var(--line)]"
                onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Invalid+Image'; }}
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-red-600 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Storage indicator */}
      <p className="text-xs text-[var(--muted)] text-center">
        {photos.length} photo{photos.length !== 1 ? 's' : ''} in gallery
      </p>
    </div>
  );
}