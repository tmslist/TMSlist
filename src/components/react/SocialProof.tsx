import { useState, useEffect } from 'react';

export default function SocialProof({ clinicId }: { clinicId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`/api/clinics/social-proof?clinicId=${clinicId}`)
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => setCount(d.count))
      .catch(() => {});
  }, [clinicId]);

  if (count === 0) return null;

  return (
    <p className="text-sm text-gray-500 flex items-center gap-1.5">
      <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      {count} patient{count !== 1 ? 's' : ''} enquired this month
    </p>
  );
}
