import { lazy, Suspense } from 'react'
import { FiberProvider } from 'its-fine'

const TMSViewer = lazy(() => import('./TMSViewer'))

function LoadingState() {
  return (
    <div
      role="status"
      aria-label="Loading 3D TMS simulator"
      className="w-full rounded-2xl border flex flex-col items-center justify-center gap-4 relative overflow-hidden"
      style={{ height: 560, background: '#0A1628', borderColor: 'rgba(201,101,74,0.18)' }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,101,74,0.12), transparent 70%)',
        }}
      />
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#C9654A', borderTopColor: 'transparent' }}
      />
      <div className="text-center relative">
        <div className="text-sm font-semibold mb-1" style={{ color: '#FBFAF7' }}>
          Loading 3D simulator…
        </div>
        <div
          className="text-[11px]"
          style={{ color: 'rgba(251,250,247,0.5)', fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace' }}
        >
          WebGL · 3D meshes · physics
        </div>
      </div>
    </div>
  )
}

export default function TMSViewerLazy() {
  return (
    <FiberProvider>
      <Suspense fallback={<LoadingState />}>
        <TMSViewer />
      </Suspense>
    </FiberProvider>
  )
}
