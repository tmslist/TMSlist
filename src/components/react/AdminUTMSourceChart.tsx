import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface UtmSourceData {
  label: string;
  value: number;
}

interface AdminUTMSourceChartProps {
  data: UtmSourceData[];
}

const SOURCE_COLORS: Record<string, string> = {
  google: '#4285F4',
  facebook: '#1877F2',
  direct: '#6B7280',
  referral: '#10B981',
  other: '#9CA3AF',
};

const SOURCE_LABELS: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  direct: 'Direct',
  referral: 'Referral',
  other: 'Other',
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: UtmSourceData }> }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#0D1117] border border-[#1E242C] rounded-lg shadow-lg px-3 py-2">
      <p className="text-sm font-medium text-[#E6EAF0]">{SOURCE_LABELS[data.label] || data.label}</p>
      <p className="text-xs text-[#8B9DB5] mt-0.5">{data.value} leads</p>
    </div>
  );
}

export default function AdminUTMSourceChart({ data }: AdminUTMSourceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#111418] rounded-xl border border-[#1E242C] p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#8B9DB5] mb-4">Lead Source Attribution</h3>
        <div className="h-64 flex items-center justify-center text-[#8B9DB5] text-sm">No data</div>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-[#111418] rounded-xl border border-[#1E242C] p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-[#8B9DB5] mb-4">Lead Source Attribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
        >
          <XAxis type="number" tick={{ fontSize: 12, fill: '#8B9DB5' }} />
          <YAxis
            dataKey="label"
            type="category"
            width={72}
            tick={{ fontSize: 12, fill: '#8B9DB5' }}
            tickFormatter={(label: string) => SOURCE_LABELS[label] || label}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1E242C' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={SOURCE_COLORS[entry.label] || '#4F7CFF'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
