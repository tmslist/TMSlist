interface FunnelStage {
  label: string;
  count: number;
  conversionRate: number;
}

interface AdminFunnelChartProps {
  stages: FunnelStage[];
}

const FUNNEL_COLORS = [
  'bg-[var(--ink)]',
  'bg-[var(--ink2)]',
  'bg-[#0A1628]/30',
];

export default function AdminFunnelChart({ stages }: AdminFunnelChartProps) {
  if (!stages || stages.length === 0 || stages.every((s) => s.count === 0)) {
    return (
      <div className="bg-[#111418] rounded-xl border border-[#1E242C] p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#8B9DB5] mb-4">Conversion Funnel</h3>
        <div className="h-64 flex items-center justify-center text-[#8B9DB5] text-sm">No data</div>
      </div>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="bg-[#111418] rounded-xl border border-[#1E242C] p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-[#8B9DB5] mb-4">Conversion Funnel</h3>
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const widthPercent = (stage.count / maxCount) * 100;
          const colorClass = FUNNEL_COLORS[index] || 'bg-[#0A1628]/20';

          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[#8B9DB5] uppercase tracking-wide">
                  {stage.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#E6EAF0]">
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-[#8B9DB5]">
                    {stage.conversionRate}%
                  </span>
                </div>
              </div>
              <div className="relative h-8 bg-[#1E242C] rounded overflow-hidden">
                <div
                  className={`${colorClass} h-full rounded transition-all duration-500`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-[#8B9DB5] mt-4 text-center opacity-60 italic">
        Visits estimated as 8× leads (industry average proxy)
      </p>
    </div>
  );
}
