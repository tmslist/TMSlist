import { lazy, Suspense } from 'react'

const TMSViewer = lazy(() => import('./TMSViewer'))

export default function TMSViewerLazy() {
  return (
    <Suspense fallback={<div className="w-full rounded-2xl bg-slate-900/50 border border-slate-700/50 animate-pulse" style={{ height: 560 }} />}>
      <TMSViewer />
    </Suspense>
  )
}
