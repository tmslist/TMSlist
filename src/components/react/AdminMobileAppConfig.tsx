import { useState, useCallback } from 'react';

interface AppVersion {
  id: string;
  platform: 'ios' | 'android';
  version: string;
  buildNumber: string;
  minOsVersion: string;
  releaseDate: string;
  status: 'active' | 'deprecated' | 'required_update';
  releaseNotes: string;
}

interface FeatureToggle {
  id: string;
  key: string;
  label: string;
  description: string;
  enabledIOS: boolean;
  enabledAndroid: boolean;
  rolloutPercent: number;
}

interface PushNotificationSettings {
  enabled: boolean;
  newReviews: boolean;
  appointmentReminders: boolean;
  marketingMessages: boolean;
  weeklyDigest: boolean;
  crashAlerts: boolean;
}

interface DeepLinkConfig {
  scheme: string;
  host: string;
  paths: Record<string, string>;
}

interface AppStoreMetadata {
  ios: {
    iconUrl: string;
    screenshots: string[];
    appName: string;
    subtitle: string;
  };
  android: {
    iconUrl: string;
    screenshots: string[];
    appName: string;
    shortDescription: string;
  };
}

export default function AdminMobileAppConfig() {
  const [activeTab, setActiveTab] = useState<'versions' | 'features' | 'push' | 'deeplinks' | 'metadata'>('versions');
  const [versions, setVersions] = useState<AppVersion[]>([
    {
      id: '1',
      platform: 'ios',
      version: '3.2.1',
      buildNumber: '142',
      minOsVersion: '15.0',
      releaseDate: '2026-03-15',
      status: 'active',
      releaseNotes: 'Bug fixes and performance improvements',
    },
    {
      id: '2',
      platform: 'ios',
      version: '3.1.0',
      buildNumber: '138',
      minOsVersion: '14.0',
      releaseDate: '2026-02-01',
      status: 'deprecated',
      releaseNotes: 'Previous major release',
    },
    {
      id: '3',
      platform: 'android',
      version: '3.2.0',
      buildNumber: '89',
      minOsVersion: '8.0',
      releaseDate: '2026-03-10',
      status: 'active',
      releaseNotes: 'Stability improvements and crash fixes',
    },
  ]);

  const [features, setFeatures] = useState<FeatureToggle[]>([
    { id: '1', key: 'biometric_login', label: 'Biometric Login', description: 'Face ID / Fingerprint authentication', enabledIOS: true, enabledAndroid: true, rolloutPercent: 100 },
    { id: '2', key: 'dark_mode', label: 'Dark Mode', description: 'System-wide dark theme support', enabledIOS: true, enabledAndroid: true, rolloutPercent: 100 },
    { id: '3', key: 'appointment_booking', label: 'In-App Booking', description: 'Book TMS appointments directly', enabledIOS: true, enabledAndroid: false, rolloutPercent: 50 },
    { id: '4', key: 'ai_chatbot', label: 'AI Chatbot', description: 'AI-powered symptom checker', enabledIOS: true, enabledAndroid: true, rolloutPercent: 25 },
    { id: '5', key: 'health_tracking', label: 'Health Tracking', description: 'Track treatment progress', enabledIOS: false, enabledAndroid: true, rolloutPercent: 10 },
    { id: '6', key: 'push_reminders', label: 'Push Reminders', description: 'Medication and appointment reminders', enabledIOS: true, enabledAndroid: true, rolloutPercent: 100 },
  ]);

  const [pushSettings, setPushSettings] = useState<PushNotificationSettings>({
    enabled: true,
    newReviews: true,
    appointmentReminders: true,
    marketingMessages: false,
    weeklyDigest: true,
    crashAlerts: true,
  });

  const [deepLinks, setDeepLinks] = useState<DeepLinkConfig>({
    scheme: 'tmslist',
    host: 'app.tmslist.com',
    paths: {
      '/clinic': '/clinics',
      '/doctor': '/doctors',
      '/booking': '/appointments/book',
      '/review': '/reviews/new',
      '/profile': '/account',
    },
  });

  const [metadata, setMetadata] = useState<AppStoreMetadata>({
    ios: {
      iconUrl: '/icons/ios-icon.png',
      screenshots: ['/screenshots/ios/1.png', '/screenshots/ios/2.png', '/screenshots/ios/3.png'],
      appName: 'TMS List',
      subtitle: 'Find TMS Providers Near You',
    },
    android: {
      iconUrl: '/icons/android-icon.png',
      screenshots: ['/screenshots/android/1.png', '/screenshots/android/2.png', '/screenshots/android/3.png'],
      appName: 'TMS List',
      shortDescription: 'Discover transcranial magnetic stimulation providers',
    },
  });

  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [saving, setSaving] = useState(false);

  const handleToggleFeature = useCallback(async (feature: FeatureToggle, platform: 'ios' | 'android') => {
    const key = platform === 'ios' ? 'enabledIOS' : 'enabledAndroid';
    setFeatures(prev =>
      prev.map(f =>
        f.id === feature.id ? { ...f, [key]: !feature[key] } : f
      )
    );
  }, []);

  const handleRolloutChange = useCallback((feature: FeatureToggle, percent: number) => {
    setFeatures(prev =>
      prev.map(f => f.id === feature.id ? { ...f, rolloutPercent: percent } : f)
    );
  }, []);

  const handlePushToggle = useCallback((key: keyof PushNotificationSettings) => {
    setPushSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSaveVersion = useCallback(() => {
    if (!editingVersion) return;
    setSaving(true);
    setTimeout(() => {
      setVersions(prev => {
        const idx = prev.findIndex(v => v.id === editingVersion.id);
        if (idx >= 0) {
          return prev.map(v => v.id === editingVersion.id ? editingVersion : v);
        }
        return [...prev, editingVersion];
      });
      setEditingVersion(null);
      setSaving(false);
    }, 500);
  }, [editingVersion]);

  const TABS = [
    { id: 'versions', label: 'App Versions' },
    { id: 'features', label: 'Feature Toggles' },
    { id: 'push', label: 'Push Notifications' },
    { id: 'deeplinks', label: 'Deep Links' },
    { id: 'metadata', label: 'Store Metadata' },
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mobile App Configuration</h1>
          <p className="text-gray-500 mt-1">Manage iOS and Android app settings, versions, and feature rollouts</p>
        </div>
      </div>

      {/* Platform overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">iOS App</p>
              <p className="text-lg font-semibold text-gray-900">{versions.find(v => v.platform === 'ios' && v.status === 'active')?.version || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Latest: {versions.find(v => v.platform === 'ios')?.version || 'N/A'}</span>
            <span className="text-xs text-gray-500">Build {versions.find(v => v.platform === 'ios')?.buildNumber || 'N/A'}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3,3h18v18H3V3m16.525,14.457l-2.333-2.333a1.5,1.5,0,0,0-1.414,2.121l1.263,1.263-4.596,4.596a2.4,2.4,0,0,1-1.728-.723L4.55,13.41a2.25,2.25,0,1,1,3.182-3.182L14.91,17.41a.4.4,0,0,0,.723-.121l4.596-4.596,1.263,1.263a1.5,1.5,0,0,0,2.121-1.414l-2.333-2.333a1.464,1.464,0,0,0-2.121,0"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Android App</p>
              <p className="text-lg font-semibold text-gray-900">{versions.find(v => v.platform === 'android' && v.status === 'active')?.version || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Latest: {versions.find(v => v.platform === 'android')?.version || 'N/A'}</span>
            <span className="text-xs text-gray-500">Build {versions.find(v => v.platform === 'android')?.buildNumber || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* App Versions Tab */}
      {activeTab === 'versions' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">App Versions</h2>
            <button
              onClick={() => setEditingVersion({
                id: `new-${Date.now()}`,
                platform: 'ios',
                version: '',
                buildNumber: '',
                minOsVersion: '',
                releaseDate: new Date().toISOString().split('T')[0],
                status: 'active',
                releaseNotes: '',
              })}
              className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              + New Version
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {versions.map(version => (
              <div key={version.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      version.platform === 'ios'
                        ? 'bg-gray-900 text-white'
                        : 'bg-green-600 text-white'
                    }`}>
                      {version.platform.toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                      version.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      version.status === 'deprecated' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {version.status === 'required_update' ? 'Required Update' : version.status.charAt(0).toUpperCase() + version.status.slice(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingVersion(version)}
                    className="text-xs font-medium text-violet-600 hover:text-violet-700"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-lg font-bold text-gray-900">{version.version}</p>
                  <p className="text-xs text-gray-500">Build {version.buildNumber} &middot; Min iOS {version.minOsVersion}</p>
                  <p className="text-xs text-gray-400">Released {new Date(version.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2.5">{version.releaseNotes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature Toggles Tab */}
      {activeTab === 'features' && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Feature Toggles per Platform</h2>
            <p className="text-sm text-gray-500">Control which features are enabled for iOS and Android users</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">iOS</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Android</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rollout %</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {features.map(feature => (
                  <tr key={feature.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{feature.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleFeature(feature, 'ios')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          feature.enabledIOS ? 'bg-violet-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          feature.enabledIOS ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleFeature(feature, 'android')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          feature.enabledAndroid ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          feature.enabledAndroid ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={10}
                          value={feature.rolloutPercent}
                          onChange={e => handleRolloutChange(feature, parseInt(e.target.value))}
                          className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                        />
                        <span className="text-xs font-medium text-gray-600 w-8">{feature.rolloutPercent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono text-xs text-gray-400">{feature.key}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Push Notifications Tab */}
      {activeTab === 'push' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Push Notification Settings</h2>
            <p className="text-sm text-gray-500">Configure which notifications are sent to mobile users</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <p className="text-sm font-semibold text-gray-900">Master Toggle</p>
                <p className="text-xs text-gray-500">Enable or disable all push notifications</p>
              </div>
              <button
                onClick={() => handlePushToggle('enabled')}
                className={`w-14 h-7 rounded-full transition-colors ${
                  pushSettings.enabled ? 'bg-violet-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  pushSettings.enabled ? 'translate-x-7' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div className="space-y-4">
              {([
                { key: 'newReviews' as const, label: 'New Reviews', desc: 'Notify when a new clinic review is posted' },
                { key: 'appointmentReminders' as const, label: 'Appointment Reminders', desc: 'Remind users of upcoming TMS appointments' },
                { key: 'marketingMessages' as const, label: 'Marketing Messages', desc: 'Promotional and newsletter notifications' },
                { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Summary of top-rated TMS providers each week' },
                { key: 'crashAlerts' as const, label: 'Crash Alerts', desc: 'Immediate alerts when app crashes are detected' },
              ]).map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handlePushToggle(item.key)}
                    disabled={!pushSettings.enabled}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      pushSettings.enabled && pushSettings[item.key] ? 'bg-violet-600' : 'bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      pushSettings.enabled && pushSettings[item.key] ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deep Links Tab */}
      {activeTab === 'deeplinks' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Deep Link Configuration</h2>
            <p className="text-sm text-gray-500">Configure URI schemes and paths for app deep linking</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Scheme</label>
                <input
                  type="text"
                  value={deepLinks.scheme}
                  onChange={e => setDeepLinks({ ...deepLinks, scheme: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                <input
                  type="text"
                  value={deepLinks.host}
                  onChange={e => setDeepLinks({ ...deepLinks, host: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Path Mappings</label>
            </div>
            <div className="space-y-3">
              {Object.entries(deepLinks.paths).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={key}
                      readOnly
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-mono bg-gray-50 text-gray-600"
                    />
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={value}
                      onChange={e => setDeepLinks({
                        ...deepLinks,
                        paths: { ...deepLinks.paths, [key]: e.target.value },
                      })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Example: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{deepLinks.scheme}://{deepLinks.host}/clinic</code> opens the clinics screen
            </p>
          </div>
        </div>
      )}

      {/* Store Metadata Tab */}
      {activeTab === 'metadata' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">App Store Metadata</h2>
            <p className="text-sm text-gray-500">Manage app icons, screenshots, and store listing details</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* iOS */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Apple App Store</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                  <input
                    type="text"
                    value={metadata.ios.appName}
                    onChange={e => setMetadata({ ...metadata, ios: { ...metadata.ios, appName: e.target.value } })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={metadata.ios.subtitle}
                    onChange={e => setMetadata({ ...metadata, ios: { ...metadata.ios, subtitle: e.target.value } })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App Icon URL</label>
                  <input
                    type="text"
                    value={metadata.ios.iconUrl}
                    onChange={e => setMetadata({ ...metadata, ios: { ...metadata.ios, iconUrl: e.target.value } })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Screenshots ({metadata.ios.screenshots.length})</label>
                  <div className="flex gap-2 flex-wrap">
                    {metadata.ios.screenshots.map((s, i) => (
                      <div key={i} className="w-16 h-28 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-mono">
                        {i + 1}
                      </div>
                    ))}
                    <button className="w-16 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-violet-400 hover:text-violet-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Android */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3,3h18v18H3V3m16.525,14.457l-2.333-2.333a1.5,1.5,0,0,0-1.414,2.121l1.263,1.263-4.596,4.596a2.4,2.4,0,0,1-1.728-.723L4.55,13.41a2.25,2.25,0,1,1,3.182-3.182L14.91,17.41a.4.4,0,0,0,.723-.121l4.596-4.596,1.263,1.263a1.5,1.5,0,0,0,2.121-1.414l-2.333-2.333a1.464,1.464,0,0,0-2.121,0"/>
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900">Google Play Store</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
                  <input
                    type="text"
                    value={metadata.android.appName}
                    onChange={e => setMetadata({ ...metadata, android: { ...metadata.android, appName: e.target.value } })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <textarea
                    value={metadata.android.shortDescription}
                    onChange={e => setMetadata({ ...metadata, android: { ...metadata.android, shortDescription: e.target.value } })}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App Icon URL</label>
                  <input
                    type="text"
                    value={metadata.android.iconUrl}
                    onChange={e => setMetadata({ ...metadata, android: { ...metadata.android, iconUrl: e.target.value } })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Screenshots ({metadata.android.screenshots.length})</label>
                  <div className="flex gap-2 flex-wrap">
                    {metadata.android.screenshots.map((s, i) => (
                      <div key={i} className="w-16 h-28 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 font-mono">
                        {i + 1}
                      </div>
                    ))}
                    <button className="w-16 h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-violet-400 hover:text-violet-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Editor Modal */}
      {editingVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingVersion.id.startsWith('new') ? 'Create Version' : 'Edit Version'}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                {(['ios', 'android'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setEditingVersion({ ...editingVersion, platform: p })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      editingVersion.platform === p
                        ? p === 'ios' ? 'bg-black text-white border-black' : 'bg-green-600 text-white border-green-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    value={editingVersion.version}
                    onChange={e => setEditingVersion({ ...editingVersion, version: e.target.value })}
                    placeholder="3.2.0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Build</label>
                  <input
                    type="text"
                    value={editingVersion.buildNumber}
                    onChange={e => setEditingVersion({ ...editingVersion, buildNumber: e.target.value })}
                    placeholder="100"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min OS</label>
                  <input
                    type="text"
                    value={editingVersion.minOsVersion}
                    onChange={e => setEditingVersion({ ...editingVersion, minOsVersion: e.target.value })}
                    placeholder="15.0"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Release Date</label>
                  <input
                    type="date"
                    value={editingVersion.releaseDate}
                    onChange={e => setEditingVersion({ ...editingVersion, releaseDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingVersion.status}
                  onChange={e => setEditingVersion({ ...editingVersion, status: e.target.value as AppVersion['status'] })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                >
                  <option value="active">Active</option>
                  <option value="deprecated">Deprecated</option>
                  <option value="required_update">Required Update</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Release Notes</label>
                <textarea
                  value={editingVersion.releaseNotes}
                  onChange={e => setEditingVersion({ ...editingVersion, releaseNotes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
                  placeholder="Bug fixes and performance improvements..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveVersion}
                disabled={saving || !editingVersion.version || !editingVersion.buildNumber}
                className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Version'}
              </button>
              <button
                onClick={() => setEditingVersion(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
