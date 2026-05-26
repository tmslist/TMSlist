interface RevenueData {
  currentMRR: number;
  projectedMRR: number;
  growthRate: number;
}

interface AdminRevenueWidgetProps {
  data: RevenueData;
}

export default function AdminRevenueWidget({ data }: AdminRevenueWidgetProps) {
  const { currentMRR, projectedMRR, growthRate } = data;
  const isPositive = growthRate >= 0;

  const formattedMRR = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  const progressPercent = Math.min((currentMRR / projectedMRR) * 100, 100);
  const projectedGap = Math.max(((projectedMRR - currentMRR) / projectedMRR) * 100, 0);

  return (
    <div className="bg-[#111418] rounded-xl border border-[#1E242C] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#8B9DB5]">MRR Estimate</h3>
        <div className={`flex items-center gap-1 px-2 py-1 rounded ${isPositive ? 'bg-[#0C1E16]' : 'bg-[#1E0C14]'}`}>
          {isPositive ? (
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{growthRate}%
          </span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-[#8B9DB5] uppercase tracking-wide mb-1">Current MRR</p>
        <p className="text-3xl font-semibold text-[#E6EAF0]">
          {formattedMRR(currentMRR)}
          <span className="text-lg text-[#8B9DB5] font-normal">/mo</span>
        </p>
      </div>

      <div className="mb-3">
        <div className="h-2 bg-[#1E242C] rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="bg-[var(--ink2)] h-full"
            style={{ width: `${projectedGap}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#8B9DB5]">Projected MRR</span>
        <span className="text-sm font-semibold text-[var(--warm)]">
          {formattedMRR(projectedMRR)}
          <span className="text-xs text-[#8B9DB5] font-normal">/mo</span>
        </span>
      </div>

      <p className="text-[11px] text-[#8B9DB5] mt-3 opacity-60">
        Based on active subscriptions + featured listings (15% growth projected)
      </p>
    </div>
  );
}
