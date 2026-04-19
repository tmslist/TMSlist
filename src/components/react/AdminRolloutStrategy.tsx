import { useState, useCallback } from 'react';

interface RolloutConfig {
  id: string;
  flagKey: string;
  flagLabel: string;
  strategy: 'canary' | 'gradual' | 'immediate';
  currentPhase: number;
  totalPhases: number;
  currentPercentage: number;
  targetPercentage: number;
  status: 'active' | 'paused' | 'rolled_back' | 'completed';
  startedAt: string;
  scheduledEndAt: string;
  metrics: {
    conversionRate: number;
    errorRate: number;
    latencyMs: number;
    usersImpacted: number;
  };
  alertThreshold: number;
  autoRollback: boolean;
}

export default function AdminRolloutStrategy() {
  const [rollouts, setRollouts] = useState<RolloutConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RolloutConfig | null>(null);
  const [actioning, setActioning] = useState(false);

  const fetchRollouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rollouts');
      if (res.ok) {
        const data = await res.json();
        setRollouts(data.rollouts || data || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    fetchRollouts().then(() => setInitialized(true));
  }

  const mockRollouts: RolloutConfig[] = [
    {
      id: 'r1',
      flagKey: 'ml_recommendations',
      flagLabel: 'ML Recommendations',
      strategy: 'canary',
      currentPhase: 2,
      totalPhases: 5,
      currentPercentage: 20,
      targetPercentage: 100,
      status: 'active',
      startedAt: '2026-04-10',
      scheduledEndAt: '2026-04-25',
      metrics: { conversionRate: 8.4, errorRate: 0.12, latencyMs: 142, usersImpacted: 1847 },
      alertThreshold: 1.0,
      autoRollback: true,
    },
    {
      id: 'r2',
      flagKey: 'new_dashboard_v2',
      flagLabel: 'Dashboard V2',
      strategy: 'gradual',
      currentPhase: 4,
      totalPhases: 5,
      currentPercentage: 80,
      targetPercentage: 100,
      status: 'active',
      startedAt: '2026-03-28',
      scheduledEndAt: '2026-04-20',
      metrics: { conversionRate: 12.1, errorRate: 0.08, latencyMs: 98, usersImpacted: 8234 },
      alertThreshold: 1.5,
      autoRollback: true,
    },
    {
      id: 'r3',
      flagKey: 'forum_badges_system',
      flagLabel: 'Forum Badges',
      strategy: 'gradual',
      currentPhase: 5,
      totalPhases: 5,
      currentPercentage: 100,
      targetPercentage: 100,
      status: 'completed',
      startedAt: '2026-02-20',
      scheduledEndAt: '2026-03-15',
      metrics: { conversionRate: 15.3, errorRate: 0.05, latencyMs: 88, usersImpacted: 12456 },
      alertThreshold: 1.0,
      autoRollback: true,
    },
    {
      id: 'r4',
      flagKey: 'advanced_analytics',
      flagLabel: 'Advanced Analytics',
      strategy: 'canary',
      currentPhase: 1,
      totalPhases: 4,
      currentPercentage: 5,
      targetPercentage: 100,
      status: 'paused',
      startedAt: '2026-04-15',
      scheduledEndAt: '2026-05-01',
      metrics: { conversionRate: 0, errorRate: 0, latencyMs: 0, usersImpacted: 234 },
      alertThreshold: 0.5,
      autoRollback: true,
    },
  ];

  const allRollouts = rollouts.length > 0 ? rollouts : mockRollouts;

  async function performAction(id: string, action: 'advance' | 'pause' | 'rollback') {
    setActioning(true);
    try {
      await fetch(`/api/admin/rollouts/${id}/${action}`, { method: 'POST' });
      setRollouts(prev => prev.map(r => {
        if (r.id !== id) return r;
        if (action === 'advance') {
          const next = r.currentPhase + 1;
          const pct = Math.min(100, r.currentPercentage + Math.ceil((r.targetPercentage - r.currentPercentage) / (r.totalPhases - r.currentPhase)));
          return {
            ...r,
            currentPhase: Math.min(next, r.totalPhases),
            currentPercentage: pct,
            status: next >= r.totalPhases ? 'completed' as const : r.status,
          };
        }
        if (action === 'pause') return { ...r, status: 'paused' as const };
        if (action === 'rollback') return { ...r, currentPercentage: 0, status: 'rolled_back' as const };
        return r;
      }));
    } catch { /* silent */ }
    setActioning(false);
  }

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    paused: { bg: 'bg-amber-100', text: 'text-amber-700' },
    rolled_back: { bg: 'bg-red-100', text: 'text-red-700' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  };

  const STRATEGY_LABELS: Record<string, string> = {
    canary: 'Canary Release',
    gradual: 'Gradual Rollout',
    immediate: 'Immediate',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rollout Strategy</h1>
          <p className="text-gray-500 mt-1">Manage canary releases, gradual rollouts, and rollback controls</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {allRollouts.map(rollout => {
            const statusStyle = STATUS_COLORS[rollout.status] || STATUS_COLORS.paused;
            const progress = (rollout.currentPercentage / rollout.targetPercentage) * 100;
            const phaseWidth = 100 / rollout.totalPhases;

            return (
              <div key={rollout.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">{rollout.flagLabel}</h3>
                      <span className="text-xs font-mono text-gray-500">{rollout.flagKey}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {rollout.status.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-medium">
                        {STRATEGY_LABELS[rollout.strategy]}
                      </span>
                    </div>

                    {/* Phase progress bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>Phase {rollout.currentPhase}/{rollout.totalPhases}</span>
                        <span>{rollout.currentPercentage}% deployed</span>
                      </div>
                      {/* Segmented phase bar */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: rollout.totalPhases }, (_, i) => {
                          const phaseFilled = i < rollout.currentPhase;
                          const phasePartial = i === rollout.currentPhase - 1 && rollout.currentPercentage > 0;
                          return (
                            <div key={i} className={`h-2 flex-1 rounded ${phaseFilled || phasePartial ? 'bg-violet-500' : 'bg-gray-100'}`} />
                          );
                        })}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`text-lg font-bold ${rollout.metrics.conversionRate > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {rollout.metrics.conversionRate > 0 ? `${rollout.metrics.conversionRate}%` : '--'}
                        </div>
                        <div className="text-[11px] text-gray-500">Conversion</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`text-lg font-bold ${rollout.metrics.errorRate < rollout.alertThreshold ? 'text-emerald-600' : 'text-red-500'}`}>
                          {rollout.metrics.errorRate > 0 ? `${rollout.metrics.errorRate}%` : '--'}
                        </div>
                        <div className="text-[11px] text-gray-500">Error Rate</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">
                          {rollout.metrics.latencyMs > 0 ? `${rollout.metrics.latencyMs}ms` : '--'}
                        </div>
                        <div className="text-[11px] text-gray-500">Latency</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold text-gray-900">
                          {rollout.metrics.usersImpacted.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-gray-500">Users Impacted</div>
                      </div>
                    </div>

                    {/* Schedule info */}
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                      <span>Started: {new Date(rollout.startedAt).toLocaleDateString()}</span>
                      <span>Scheduled: {new Date(rollout.scheduledEndAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${rollout.autoRollback ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                        Auto-rollback {rollout.autoRollback ? 'ON' : 'OFF'}
                      </span>
                      <span>Alert threshold: {rollout.alertThreshold}% error rate</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-6">
                    {rollout.status === 'active' && rollout.currentPhase < rollout.totalPhases && (
                      <button
                        onClick={() => performAction(rollout.id, 'advance')}
                        disabled={actioning}
                        className="px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                      >
                        Advance Phase
                      </button>
                    )}
                    {rollout.status === 'active' && (
                      <button
                        onClick={() => performAction(rollout.id, 'pause')}
                        disabled={actioning}
                        className="px-4 py-2 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-200 disabled:opacity-50 transition-colors"
                      >
                        Pause
                      </button>
                    )}
                    {(rollout.status === 'active' || rollout.status === 'paused') && (
                      <button
                        onClick={() => {
                          if (confirm('Roll back this feature to 0%? This will disable it for all users.')) {
                            performAction(rollout.id, 'rollback');
                          }
                        }}
                        disabled={actioning}
                        className="px-4 py-2 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        Rollback
                      </button>
                    )}
                    {rollout.status === 'paused' && (
                      <button
                        onClick={() => setRollouts(prev => prev.map(r => r.id === rollout.id ? { ...r, status: 'active' as const } : r))}
                        className="px-4 py-2 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg hover:bg-emerald-200 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {allRollouts.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
              No active rollouts found
            </div>
          )}
        </div>
      )}
    </div>
  );
}