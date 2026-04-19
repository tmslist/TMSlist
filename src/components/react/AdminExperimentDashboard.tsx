import { useState, useCallback } from 'react';

interface ExperimentVariant {
  id: string;
  experimentId: string;
  variantKey: string;
  description: string | null;
  weight: number;
  isControl: boolean;
  metrics: Record<string, unknown>;
}

interface Experiment {
  id: string;
  key: string;
  description: string | null;
  status: 'draft' | 'running' | 'completed' | 'paused';
  startDate: string | null;
  endDate: string | null;
  variants: ExperimentVariant[];
  createdAt: string;
}

interface ConversionData {
  variantKey: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  uplift?: number;
  confidence?: number;
}

export default function AdminExperimentDashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [tab, setTab] = useState<'running' | 'draft' | 'completed'>('running');

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/experiments');
      if (res.ok) {
        const data = await res.json();
        setExperiments(data.experiments || data || []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    fetchExperiments().then(() => setInitialized(true));
  }

  // Mock experiments for demo
  const mockExperiments: Experiment[] = [
    {
      id: 'exp1',
      key: 'homepage_cta_v3',
      description: 'Test new hero CTA button styles against control',
      status: 'running',
      startDate: '2026-03-15',
      endDate: '2026-04-15',
      variants: [
        { id: 'v1', experimentId: 'exp1', variantKey: 'control', description: 'Original blue button', weight: 50, isControl: true, metrics: { visitors: 4231, conversions: 187 } },
        { id: 'v2', experimentId: 'exp1', variantKey: 'variant_a', description: 'Green gradient button', weight: 50, isControl: false, metrics: { visitors: 4189, conversions: 234 } },
      ],
      createdAt: '2026-03-15',
    },
    {
      id: 'exp2',
      key: 'pricing_page_layout',
      description: 'Test two-column vs three-column pricing display',
      status: 'running',
      startDate: '2026-03-20',
      endDate: '2026-04-20',
      variants: [
        { id: 'v3', experimentId: 'exp2', variantKey: 'control', description: 'Three column', weight: 34, isControl: true, metrics: { visitors: 2104, conversions: 89 } },
        { id: 'v4', experimentId: 'exp2', variantKey: 'variant_a', description: 'Two column', weight: 33, isControl: false, metrics: { visitors: 2087, conversions: 112 } },
        { id: 'v5', experimentId: 'exp2', variantKey: 'variant_b', description: 'Single card', weight: 33, isControl: false, metrics: { visitors: 2095, conversions: 97 } },
      ],
      createdAt: '2026-03-20',
    },
    {
      id: 'exp3',
      key: 'blog_recommended_posts',
      description: 'ML-based vs chronological post recommendations',
      status: 'draft',
      startDate: null,
      endDate: null,
      variants: [
        { id: 'v6', experimentId: 'exp3', variantKey: 'control', description: 'Chronological', weight: 50, isControl: true, metrics: {} },
        { id: 'v7', experimentId: 'exp3', variantKey: 'variant_a', description: 'ML recommendations', weight: 50, isControl: false, metrics: {} },
      ],
      createdAt: '2026-04-01',
    },
    {
      id: 'exp4',
      key: 'signup_flow_v2',
      description: 'Simplified two-step vs single-page signup',
      status: 'completed',
      startDate: '2026-02-01',
      endDate: '2026-03-01',
      variants: [
        { id: 'v8', experimentId: 'exp4', variantKey: 'control', description: 'Single page', weight: 50, isControl: true, metrics: { visitors: 8234, conversions: 892 } },
        { id: 'v9', experimentId: 'exp4', variantKey: 'variant_a', description: 'Two step', weight: 50, isControl: false, metrics: { visitors: 8198, conversions: 1103 } },
      ],
      createdAt: '2026-02-01',
    },
  ];

  const allExps = experiments.length > 0 ? experiments : mockExperiments;

  const filteredExps = allExps.filter(e => {
    if (tab === 'running') return e.status === 'running';
    if (tab === 'draft') return e.status === 'draft';
    if (tab === 'completed') return e.status === 'completed';
    return true;
  });

  function calcSignificance(variants: ExperimentVariant[]): { significant: boolean; confidence: number; winner?: string } {
    if (variants.length < 2) return { significant: false, confidence: 0 };
    const control = variants.find(v => v.isControl);
    const treatment = variants.find(v => !v.isControl);
    if (!control || !treatment) return { significant: false, confidence: 0 };

    const ctrlM = (control.metrics as { visitors?: number; conversions?: number }) || {};
    const trtM = (treatment.metrics as { visitors?: number; conversions?: number }) || {};

    if (!ctrlM.visitors || !trtM.visitors) return { significant: false, confidence: 0 };

    const ctrlRate = (ctrlM.conversions || 0) / ctrlM.visitors;
    const trtRate = (trtM.conversions || 0) / trtM.visitors;
    const uplift = ((trtRate - ctrlRate) / ctrlRate) * 100;

    // Simple significance approximation
    const diff = Math.abs(trtRate - ctrlRate);
    const pooled = (ctrlM.conversions! + trtM.conversions!) / (ctrlM.visitors! + trtM.visitors!);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / ctrlM.visitors! + 1 / trtM.visitors!));
    const zScore = se > 0 ? diff / se : 0;
    const confidence = Math.min(99.9, (1 - 2 * (1 - 1 / (1 + Math.abs(zScore) / 1.96))) * 100);

    return {
      significant: Math.abs(zScore) > 1.96,
      confidence: Math.max(0, confidence),
      winner: uplift > 0 ? treatment.variantKey : control.variantKey,
    };
  }

  function getConversionData(variants: ExperimentVariant[]): ConversionData[] {
    const control = variants.find(v => v.isControl);
    return variants.map(v => {
      const m = v.metrics as { visitors?: number; conversions?: number } || {};
      const rate = m.visitors ? ((m.conversions || 0) / m.visitors) * 100 : 0;
      let uplift: number | undefined;
      if (control && !v.isControl && m.visitors) {
        const ctrlRate = ((control.metrics as { conversions?: number })?.conversions || 0) / m.visitors!;
        uplift = ((rate / 100 - ctrlRate) / ctrlRate) * 100;
      }
      return {
        variantKey: v.variantKey,
        visitors: m.visitors || 0,
        conversions: m.conversions || 0,
        conversionRate: rate,
        uplift: uplift,
      };
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Experiment Dashboard</h1>
          <p className="text-gray-500 mt-1">A/B test performance, statistical significance, and conversion metrics</p>
        </div>
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['running', 'draft', 'completed'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {filteredExps.map(exp => {
            const sig = calcSignificance(exp.variants);
            const convData = getConversionData(exp.variants);
            return (
              <div key={exp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-violet-600">{exp.key}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          exp.status === 'running' ? 'bg-emerald-100 text-emerald-700' :
                          exp.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {exp.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{exp.description}</p>
                    </div>
                    <div className="text-right">
                      {exp.startDate && (
                        <div className="text-xs text-gray-400">{new Date(exp.startDate).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'ongoing'}</div>
                      )}
                      {sig.confidence > 0 && (
                        <div className={`text-xs font-medium mt-1 ${sig.significant ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {sig.significant ? '✓ Significant' : '⏳ Inconclusive'} ({sig.confidence.toFixed(1)}% conf)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variants table */}
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Traffic</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visitors</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uplift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {convData.map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {v.variantKey === sig.winner && sig.significant && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">WIN</span>
                            )}
                            <span className="text-sm font-mono font-semibold text-gray-900">{v.variantKey}</span>
                            {exp.variants.find(e => e.variantKey === v.variantKey)?.isControl && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded">control</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{exp.variants.find(e => e.variantKey === v.variantKey)?.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 bg-violet-500 rounded-full" style={{ width: `${v.visitors > 0 ? (v.visitors / convData.reduce((s, c) => s + c.visitors, 0)) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{exp.variants.find(e => e.variantKey === v.variantKey)?.weight}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{v.visitors.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{v.conversions.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900">{v.conversionRate.toFixed(2)}%</span>
                        </td>
                        <td className="px-6 py-4">
                          {v.uplift !== undefined ? (
                            <span className={`text-sm font-medium ${v.uplift >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {v.uplift >= 0 ? '+' : ''}{v.uplift.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
          {filteredExps.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
              No {tab} experiments found
            </div>
          )}
        </div>
      )}
    </div>
  );
}