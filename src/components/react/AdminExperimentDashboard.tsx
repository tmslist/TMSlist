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
        const list = Array.isArray(data) ? data : (data.data || data.experiments || []);
        setExperiments(Array.isArray(list) ? list : []);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    fetchExperiments().then(() => setInitialized(true));
  }

  const filteredExps = experiments.filter(e => {
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
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Experiment Dashboard</h1>
          <p className="text-[var(--muted)] mt-1">A/B test performance, statistical significance, and conversion metrics</p>
        </div>
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 mb-6 bg-[var(--paper2)] p-1 rounded-xl w-fit">
        {(['running', 'draft', 'completed'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-[var(--ink)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--ink2)]'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[rgba(10,22,40,0.15)] border-t-[#0A1628] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {filteredExps.map(exp => {
            const sig = calcSignificance(exp.variants);
            const convData = getConversionData(exp.variants);
            return (
              <div key={exp.id} className="bg-white rounded-xl border border-[var(--line)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--line)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-[var(--ink)]">{exp.key}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          exp.status === 'running' ? 'bg-emerald-100 text-emerald-700' :
                          exp.status === 'draft' ? 'bg-[var(--paper2)] text-[var(--ink2)]' :
                          'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]'
                        }`}>
                          {exp.status}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted)] mt-1">{exp.description}</p>
                    </div>
                    <div className="text-right">
                      {exp.startDate && (
                        <div className="text-xs text-[var(--muted)]">{new Date(exp.startDate).toLocaleDateString()} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'ongoing'}</div>
                      )}
                      {sig.confidence > 0 && (
                        <div className={`text-xs font-medium mt-1 ${sig.significant ? 'text-emerald-600' : 'text-[var(--muted)]'}`}>
                          {sig.significant ? '✓ Significant' : '⏳ Inconclusive'} ({sig.confidence.toFixed(1)}% conf)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Variants table */}
                <table className="min-w-full">
                  <thead className="bg-[var(--paper2)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Variant</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Traffic</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Visitors</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Conversions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Uplift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {convData.map((v, i) => (
                      <tr key={i} className="hover:bg-[var(--paper2)]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {v.variantKey === sig.winner && sig.significant && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">WIN</span>
                            )}
                            <span className="text-sm font-mono font-semibold text-[var(--ink)]">{v.variantKey}</span>
                            {exp.variants.find(e => e.variantKey === v.variantKey)?.isControl && (
                              <span className="px-1.5 py-0.5 bg-[var(--paper2)] text-[var(--muted)] text-[10px] rounded">control</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--ink2)]">{exp.variants.find(e => e.variantKey === v.variantKey)?.description}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-[var(--paper2)] rounded-full h-1.5">
                              <div className="h-1.5 bg-[var(--ink2)] rounded-full" style={{ width: `${v.visitors > 0 ? (v.visitors / convData.reduce((s, c) => s + c.visitors, 0)) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-[var(--muted)]">{exp.variants.find(e => e.variantKey === v.variantKey)?.weight}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[var(--ink)]">{v.visitors.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-[var(--ink)]">{v.conversions.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-[var(--ink)]">{v.conversionRate.toFixed(2)}%</span>
                        </td>
                        <td className="px-6 py-4">
                          {v.uplift !== undefined ? (
                            <span className={`text-sm font-medium ${v.uplift >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {v.uplift >= 0 ? '+' : ''}{v.uplift.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">--</span>
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
            <div className="text-center py-12 text-[var(--muted)] bg-white rounded-xl border border-[var(--line)]">
              No {tab} experiments found
            </div>
          )}
        </div>
      )}
    </div>
  );
}