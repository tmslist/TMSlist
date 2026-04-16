import { useState, useCallback } from 'react';

// ---- Types ----

interface BannerSlot {
  id: string;
  slot: string;
  size: string;
  active: boolean;
  preview?: string;
}

// ---- Toggle component ----

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-violet-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ---- Coming Soon Badge ----

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Coming Soon
    </span>
  );
}

// ---- Active Badge ----

function ActiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  );
}

// ---- Inactive Badge ----

function InactiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Inactive
    </span>
  );
}

// ---- Main Component ----

export default function AdminAdvertising() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [banners, setBanners] = useState<BannerSlot[]>([
    {
      id: 'homepage-hero',
      slot: 'Homepage Hero',
      size: '728 x 90',
      active: false,
    },
  ]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  function handleToggleActive(id: string, current: boolean) {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !current } : b))
    );
    showToast('success', `Banner ${!current ? 'activated' : 'deactivated'}`);
  }

  function handleDmToAdvertise() {
    window.location.href = '/advertise/';
  }

  function handleMailto() {
    window.location.href = 'mailto:advertise@tmslist.com?subject=Advertising%20Inquiry&body=Hello%2C%20I%20would%20like%20to%20discuss%20advertising%20opportunities%20on%20TMS%20List.';
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* DM to Advertise Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 px-6 py-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Placeholder image area */}
          <div className="shrink-0 w-32 h-20 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-dashed border-white/40 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Text content */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <h3 className="text-lg font-bold text-white">Reserve this Ad Slot</h3>
              <ComingSoonBadge />
            </div>
            <p className="text-sm text-white/80 max-w-md">
              Turnkey banner placement for clinics, device manufacturers, and healthcare advertisers.
              Reach TMS patients and providers at the moment they are searching for treatment.
            </p>
          </div>

          {/* CTA */}
          <div className="shrink-0 flex flex-col gap-2">
            <button
              onClick={handleDmToAdvertise}
              className="px-6 py-2.5 bg-white text-violet-700 font-semibold text-sm rounded-lg hover:bg-violet-50 transition-colors shadow-sm"
            >
              View Pricing
            </button>
            <button
              onClick={handleMailto}
              className="px-6 py-2.5 bg-white/20 text-white font-medium text-sm rounded-lg hover:bg-white/30 transition-colors border border-white/30"
            >
              DM to Advertise
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          <div className="px-6 py-4 text-center">
            <div className="text-xl font-bold text-gray-900">728x90</div>
            <div className="text-xs text-gray-500 mt-0.5">Leaderboard</div>
          </div>
          <div className="px-6 py-4 text-center">
            <div className="text-xl font-bold text-gray-900">40K+</div>
            <div className="text-xs text-gray-500 mt-0.5">Monthly Impressions</div>
          </div>
          <div className="px-6 py-4 text-center">
            <div className="text-xl font-bold text-gray-900">$299</div>
            <div className="text-xs text-gray-500 mt-0.5">Starting / mo</div>
          </div>
        </div>
      </div>

      {/* Banner Slots Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Banner Slots</h3>
            <p className="text-xs text-gray-500 mt-0.5">Manage ad placements across the site</p>
          </div>
          <button
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
            title="Coming soon"
          >
            + Add Slot
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-50">
          {banners.map((banner) => (
            <div key={banner.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              {/* Toggle */}
              <div className="shrink-0">
                <Toggle
                  checked={banner.active}
                  onChange={() => handleToggleActive(banner.id, banner.active)}
                />
              </div>

              {/* Slot info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900">{banner.slot}</span>
                  {banner.active ? <ActiveBadge /> : <InactiveBadge />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{banner.size}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400">{banner.id}</span>
                </div>
              </div>

              {/* Preview thumbnail */}
              <div className="shrink-0">
                <div className="w-24 h-8 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                  {banner.active ? (
                    <div className="w-full h-full bg-gradient-to-r from-violet-100 to-purple-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Status + Edit */}
              <div className="shrink-0 flex items-center gap-2">
                <ComingSoonBadge />
                <button
                  disabled
                  className="px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state guard */}
        {banners.length === 0 && (
          <div className="px-6 py-12 text-center">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">No banner slots configured</p>
            <p className="text-xs text-gray-400 mt-1">Banner management is coming soon.</p>
          </div>
        )}

        {/* Footer note */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">
            Banner management will allow you to upload creative assets, set rotation schedules, and track performance metrics.
            Reach out to <a href="mailto:advertise@tmslist.com" className="text-violet-600 hover:underline">advertise@tmslist.com</a> for early access.
          </p>
        </div>
      </div>
    </div>
  );
}
