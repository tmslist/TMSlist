import { useState, useCallback, useMemo } from 'react';

interface CrashReport {
  id: string;
  appVersion: string;
  platform: 'ios' | 'android';
  osVersion: string;
  deviceModel: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  errorType: string;
  errorMessage: string;
  stackTrace: string;
  occurredAt: string;
  resolvedAt: string | null;
  userId: string | null;
  crashCount: number;
}

const SEVERITY_COLORS = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;

export default function AdminAppCrashReports() {
  const [reports, setReports] = useState<CrashReport[]>([
    {
      id: '1',
      appVersion: '3.2.1',
      platform: 'ios',
      osVersion: '17.4.1',
      deviceModel: 'iPhone 15 Pro',
      severity: 'critical',
      errorType: 'NullPointerException',
      errorMessage: 'Attempt to invoke virtual method on a null object reference',
      stackTrace: `Fatal Exception: java.lang.NullPointerException: Attempt to invoke virtual method on a null object reference
  at com.tmslist.app.MainActivity.onResume(MainActivity.java:142)
  at android.app.Activity.performResume(Activity.java:8766)
  at android.app.Instrumentation.callActivityOnResume(Instrumentation.java:1344)
  at android.app.Activity.onResume(Activity.java:8728)
  at androidx.fragment.app.FragmentActivity.onResume(FragmentActivity.java:164)
  at com.tmslist.app.MainActivity.onResume(MainActivity.java:138)
  ... 7 more

   at com.tmslist.app.utils.SessionManager.getCurrentUser(SessionManager.java:89)
  at com.tmslist.app.ui.clinic.ClinicListFragment.loadClinics(ClinicListFragment.java:234)`,
      occurredAt: '2026-04-18T14:23:11Z',
      resolvedAt: '2026-04-18T16:45:00Z',
      userId: 'user_8f3k2',
      crashCount: 47,
    },
    {
      id: '2',
      appVersion: '3.2.0',
      platform: 'android',
      osVersion: '14.0',
      deviceModel: 'Samsung Galaxy S24',
      severity: 'high',
      errorType: 'OutOfMemoryError',
      errorMessage: 'Failed to allocate memory for image bitmap',
      stackTrace: `java.lang.OutOfMemoryError: Failed to allocate memory for image bitmap
  at android.graphics.Bitmap.nativeCreate(Bitmap.java)
  at android.graphics.Bitmap.createBitmap(Bitmap.java:212)
  at com.tmslist.app.utils.ImageLoader.loadImage(ImageLoader.java:56)
  at com.tmslist.app.ui.review.ReviewImageAdapter.onBindViewHolder(ReviewImageAdapter.java:88)
  at androidx.recyclerview.widget.RecyclerView.onBindViewHolder(RecyclerView.java:7248)
  at androidx.recyclerview.widget.RecyclerView$Adapter.onBindViewHolder(RecyclerView.java:6548)`,
      occurredAt: '2026-04-17T09:15:33Z',
      resolvedAt: null,
      userId: 'user_2m9p5',
      crashCount: 23,
    },
    {
      id: '3',
      appVersion: '3.1.5',
      platform: 'ios',
      osVersion: '16.7.2',
      deviceModel: 'iPhone 12',
      severity: 'medium',
      errorType: 'SIGABRT',
      errorMessage: 'Application received SIGABRT signal',
      stackTrace: `Crashed: com.apple.main-thread
0  libsystem_kernel.dylib  0x1a2e3d5a8 __pthread_kill + 8
1  libsystem_pthread.dylib 0x1c8f6b144 pthread_kill + 208
2  libsystem_c.dylib       0x1c8d7a2d4 abort + 268
3  TMSListApp              0x104a3c21c +[SentryCrashSignalHandler handleSignal:]
4  TMSListApp              0x104a39e38 SentryCrash->handleFatalSignal
5  TMSListApp              0x104a38f44 SentryCrashInstallation.send
6  TMSListApp              0x104a375f0 -[SentryCrashMonitorAppLifeCycle didBecomeActive]`,
      occurredAt: '2026-04-16T22:08:44Z',
      resolvedAt: '2026-04-17T08:00:00Z',
      userId: null,
      crashCount: 8,
    },
    {
      id: '4',
      appVersion: '3.2.1',
      platform: 'ios',
      osVersion: '17.3.0',
      deviceModel: 'iPhone 14',
      severity: 'high',
      errorType: 'NSInvalidArgumentException',
      errorMessage: '-[__NSCFString containsString:]: unrecognized selector sent to instance',
      stackTrace: `Terminating app due to uncaught exception 'NSInvalidArgumentException'
0   CoreFoundation  0x1a1c8b1e4 __exceptionPreprocess
1   libobjc.A.dylib  0x1b3d8d8  objc_exception_throw
2   CoreFoundation  0x1a1d3ab34 -[NSObject(NSObject) doesNotRecognizeSelector:]
3   CoreFoundation  ____forwarding___
4   TMSListApp      0x1024c6f80 -[TMSListAPIClient searchClinics:]
5   TMSListApp      0x1023f8e20 -[ClinicSearchViewController viewDidLoad]`,
      occurredAt: '2026-04-18T11:55:02Z',
      resolvedAt: null,
      userId: 'user_4n7q1',
      crashCount: 15,
    },
    {
      id: '5',
      appVersion: '3.0.9',
      platform: 'android',
      osVersion: '12.0',
      deviceModel: 'Google Pixel 6',
      severity: 'low',
      errorType: 'IllegalStateException',
      errorMessage: 'Fragment already added',
      stackTrace: `java.lang.IllegalStateException: Fragment already added
  at androidx.fragment.app.FragmentManagerImpl.addFragment(FragmentManagerImpl.java:1440)
  at androidx.fragment.app.BackStackRecord.addFragment(BackStackRecord.java:398)
  at com.tmslist.app.ui.MainActivity.navigateToClinic(MainActivity.java:567)
  at com.tmslist.app.ui.MainActivity.lambda$handleDeepLink$3(MainActivity.java:445)`,
      occurredAt: '2026-04-15T16:30:18Z',
      resolvedAt: '2026-04-16T10:00:00Z',
      userId: 'user_1x8v3',
      crashCount: 3,
    },
    {
      id: '6',
      appVersion: '3.2.0',
      platform: 'android',
      osVersion: '13.0',
      deviceModel: 'OnePlus 11',
      severity: 'medium',
      errorType: 'RuntimeException',
      errorMessage: 'Unable to start activity ComponentInfo',
      stackTrace: `android.runtime.RuntimeException: Unable to start activity ComponentInfo{com.tmslist.app/com.tmslist.app.ui.booking.BookingActivity}
  at android.app.ActivityThread.performLaunchActivity(ActivityThread.java:3674)
  at android.app.ActivityThread.handleLaunchActivity(ActivityThread.java:3816)
  at android.app.ActivityThread.access.1200(ActivityThread.java:154)
  at android.app.Instrumentation.callActivityOnCreate(Instrumentation.java:1346)`,
      occurredAt: '2026-04-17T14:22:55Z',
      resolvedAt: null,
      userId: 'user_7t5y9',
      crashCount: 12,
    },
  ]);

  const [selectedCrash, setSelectedCrash] = useState<CrashReport | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterOS, setFilterOS] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
      if (filterPlatform !== 'all' && r.platform !== filterPlatform) return false;
      if (filterOS && !r.osVersion.toLowerCase().includes(filterOS.toLowerCase())) return false;
      if (searchTerm && !r.errorType.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !r.errorMessage.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [reports, filterSeverity, filterPlatform, filterOS, searchTerm]);

  const stats = useMemo(() => {
    const total = reports.length;
    const unresolved = reports.filter(r => !r.resolvedAt).length;
    const criticalCount = reports.filter(r => r.severity === 'critical').length;
    const totalCrashes = reports.reduce((sum, r) => sum + r.crashCount, 0);
    const byPlatform = {
      ios: reports.filter(r => r.platform === 'ios').length,
      android: reports.filter(r => r.platform === 'android').length,
    };
    return { total, unresolved, criticalCount, totalCrashes, byPlatform };
  }, [reports]);

  const handleResolve = useCallback((id: string) => {
    setReports(prev =>
      prev.map(r => r.id === id ? { ...r, resolvedAt: new Date().toISOString() } : r)
    );
    setSelectedCrash(null);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Crash Reports</h1>
          <p className="text-gray-500 mt-1">Monitor and resolve mobile app crashes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Reports</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Unresolved</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.unresolved}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Critical</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.criticalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Crashes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCrashes}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Platform</p>
          <div className="flex gap-2 mt-1">
            <span className="text-sm font-bold text-gray-900">{stats.byPlatform.ios} iOS</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-bold text-green-600">{stats.byPlatform.android} And</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="Search by error type or message..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
            />
          </div>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Severities</option>
            {SEVERITY_ORDER.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Platforms</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
          <input
            type="text"
            placeholder="Filter by OS version..."
            value={filterOS}
            onChange={e => setFilterOS(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500 w-40"
          />
        </div>
      </div>

      {/* Crash list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crashes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occurred</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReports.map(report => (
              <tr key={report.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCrash(report)}>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">{report.errorType}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{report.errorMessage}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                    report.platform === 'ios' ? 'bg-gray-900 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {report.platform.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${SEVERITY_COLORS[report.severity]}`}>
                    {report.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-mono text-gray-900">{report.appVersion}</p>
                  <p className="text-xs text-gray-500">{report.deviceModel}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">
                    {report.crashCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {new Date(report.occurredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  <br />
                  {new Date(report.occurredAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4">
                  {report.resolvedAt ? (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Resolved</span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Open</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedCrash(report); }}
                    className="text-xs font-medium text-violet-600 hover:text-violet-700"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredReports.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No crash reports match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Frequency chart placeholder */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Crash Frequency (Last 30 Days)</h3>
        <div className="flex items-end gap-1 h-32">
          {[65, 42, 78, 55, 89, 34, 91, 67, 45, 88, 52, 76, 41, 83, 29, 95, 48, 72, 38, 86, 54, 69, 43, 79, 31, 87, 46, 71, 37, 58].map((h, i) => (
            <div key={i} className="flex-1 bg-violet-200 rounded-t transition-colors hover:bg-violet-400" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Apr 1</span><span>Apr 8</span><span>Apr 15</span><span>Apr 18</span>
        </div>
      </div>

      {/* Crash Detail Modal */}
      {selectedCrash && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${SEVERITY_COLORS[selectedCrash.severity]}`}>
                      {selectedCrash.severity.toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      selectedCrash.platform === 'ios' ? 'bg-gray-900 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {selectedCrash.platform.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mt-2">{selectedCrash.errorType}</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedCrash.errorMessage}</p>
                </div>
                <button onClick={() => setSelectedCrash(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Context info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Version</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedCrash.appVersion}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Device</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedCrash.deviceModel}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">OS Version</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedCrash.osVersion}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Crash Count</p>
                  <p className="text-sm font-semibold text-red-600 mt-0.5">{selectedCrash.crashCount} users</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Occurred</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {new Date(selectedCrash.occurredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">User ID</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedCrash.userId || 'Anonymous'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {selectedCrash.resolvedAt ? (
                      <span className="text-emerald-600">Resolved {new Date(selectedCrash.resolvedAt).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-amber-600">Open</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Stack trace */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">Stack Trace</h3>
                  <button className="text-xs font-medium text-violet-600 hover:text-violet-700">Copy</button>
                </div>
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed font-mono max-h-64 overflow-y-auto">
                  {selectedCrash.stackTrace}
                </pre>
              </div>

              {/* Actions */}
              {!selectedCrash.resolvedAt && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleResolve(selectedCrash.id)}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Mark as Resolved
                  </button>
                  <button className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                    Create Issue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
