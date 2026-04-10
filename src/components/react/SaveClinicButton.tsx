import { useState, useEffect } from 'react';

interface Props {
  clinicId: string;
  clinicName: string;
}

export default function SaveClinicButton({ clinicId, clinicName }: Props) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    fetch('/api/patient/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.user && setUser(d.user))
      .catch(() => { /* not logged in */ });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/patient/saved-clinics')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const isSaved = d?.data?.some((s: { clinic: { id: string } }) => s.clinic.id === clinicId);
        setSaved(!!isSaved);
      })
      .catch(() => { /* saved clinics unavailable */ });
  }, [user, clinicId]);

  const [error, setError] = useState('');

  const toggle = async () => {
    if (!user) {
      window.location.href = '/account/register';
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/patient/saved-clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, action: saved ? 'unsave' : 'save' }),
      });
      if (res.ok) {
        setSaved(!saved);
      } else {
        setError('Could not save. Try again.');
      }
    } catch {
      setError('Connection error.');
    }
    setLoading(false);
  };

  return (
    <div className="inline-flex flex-col items-start">
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={saved ? `Unsave ${clinicName}` : `Save ${clinicName}`}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          saved
            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
        }`}
        title={saved ? `Unsave ${clinicName}` : `Save ${clinicName}`}
      >
        <svg className={`w-4 h-4 ${saved ? 'fill-red-500' : 'fill-none stroke-current'}`} viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {saved ? 'Saved' : 'Save'}
      </button>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
