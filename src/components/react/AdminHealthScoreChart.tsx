import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface HealthScoreBucket {
  label: string;
  bucket: string;
  value: number;
  color: string;
}

interface AdminHealthScoreChartProps {
  data: HealthScoreBucket[];
}

const COLOR_MAP: Record<string, string> = {
  '#FB923C': '#FB923C', // red-400
  '#FBBF24': '#FBBF24', // amber-400
  '#22C55E': '#22C55E', // emerald-400
  '#4F7CFF': '#4F7CFF', // violet-400
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: HealthScoreBucket }> }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-[#0D1117] border border-[#1E242C] rounded-lg shadow-lg px-3 py-2">
      <p className="text-sm font-medium text-[#E6EAF0]">{data.label}</p>
      <p className="text-xs text-[#8B9DB5] mt-0.5">{data.value} clinics</p>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-3">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-xs text-[#8B9DB5]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminHealthScoreChart({ data }: AdminHealthScoreChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="bg-[#111418] rounded-xl border border-[#1E242C] p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[#8B9DB5] mb-4">Clinic Health Distribution</h3>
        <div className="h-64 flex items-center justify-center text-[#8B9DB5] text-sm">No data</div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.label.replace(/ \(\d+-\d+\)/, ''),
    value: item.value,
    color: COLOR_MAP[item.color] || item.color,
    fullLabel: item.label,
  }));

  return (
    <div className="bg-[#111418] rounded-xl border border-[#1E242C] p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-[#8B9DB5] mb-4">Clinic Health Distribution</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            dataKey="value"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} wrapperStyle={{ paddingTop: '8px' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center -mt-[140px] pb-[90px] pointer-events-none">
        <p className="text-2xl font-semibold text-[#E6EAF0]">{total}</p>
        <p className="text-xs text-[#8B9DB5]">Total Clinics</p>
      </div>
    </div>
  );
}
