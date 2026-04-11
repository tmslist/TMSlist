interface Props {
  clinic: Record<string, unknown>;
}

const FIELDS_TO_CHECK: { key: string; weight: number }[] = [
  { key: 'name', weight: 5 },
  { key: 'address', weight: 5 },
  { key: 'phone', weight: 10 },
  { key: 'website', weight: 5 },
  { key: 'email', weight: 5 },
  { key: 'description', weight: 10 },
  { key: 'descriptionLong', weight: 5 },
  { key: 'machines', weight: 10 },
  { key: 'specialties', weight: 5 },
  { key: 'insurances', weight: 10 },
  { key: 'openingHours', weight: 5 },
  { key: 'accessibility', weight: 5 },
  { key: 'availability', weight: 5 },
  { key: 'pricing', weight: 10 },
  { key: 'media', weight: 5 },
];

function calculateCompleteness(clinic: Record<string, unknown>): number {
  const totalWeight = FIELDS_TO_CHECK.reduce((sum, f) => sum + f.weight, 0);
  let score = 0;

  for (const field of FIELDS_TO_CHECK) {
    const val = clinic[field.key];
    if (val === null || val === undefined) continue;
    if (typeof val === 'string' && val.trim() === '') continue;
    if (Array.isArray(val) && val.length === 0) continue;
    if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val as object).length === 0) continue;
    score += field.weight;
  }

  return Math.round((score / totalWeight) * 100);
}

export default function ProfileBadge({ clinic }: Props) {
  const pct = calculateCompleteness(clinic);

  const colorClass =
    pct < 50
      ? 'bg-red-50 text-red-700 border-red-200'
      : pct <= 80
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const dotColor =
    pct < 50 ? 'bg-red-400' : pct <= 80 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colorClass}`}
      title={`Profile ${pct}% complete`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      Profile {pct}%
    </span>
  );
}
