'use client';
import { useState } from 'react';

interface Badge {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

const AVAILABLE_BADGES: Badge[] = [
  { id: 'top-rated', name: 'Top Rated', description: '4.5+ star average rating', color: 'bg-amber-100 text-amber-700', icon: '★' },
  { id: 'fda-approved', name: 'FDA Approved Devices', description: 'Uses FDA-cleared TMS devices', color: 'bg-emerald-100 text-emerald-700', icon: '✓' },
  { id: 'experienced', name: 'Experienced', description: '100+ TMS sessions performed', color: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]', icon: '◉' },
  { id: 'insurance-accepted', name: 'Insurance Accepted', description: 'Accepts major insurance plans', color: 'bg-[rgba(10,22,40,0.08)] text-[var(--ink)]', icon: '◈' },
  { id: 'rapid-response', name: 'Rapid Response', description: 'Responds within 2 hours', color: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]', icon: '⚡' },
  { id: '24-7-coverage', name: '24/7 Coverage', description: 'Round-the-clock availability', color: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]', icon: '☾' },
  { id: 'research-active', name: 'Research Active', description: 'Participates in clinical trials', color: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]', icon: '◈' },
  { id: 'affordable', name: 'Affordable', description: 'Competitive pricing or payment plans', color: 'bg-teal-100 text-teal-700', icon: '$' },
  { id: 'inclusive-care', name: 'Inclusive Care', description: 'Serves diverse populations', color: 'bg-[rgba(201,101,74,0.1)] text-[var(--warm)]', icon: '♡' },
  { id: 'telehealth', name: 'Telehealth Available', description: 'Offers virtual consultations', color: 'bg-[rgba(10,22,40,0.1)] text-[var(--ink)]', icon: '◎' },
];

interface ClinicBadge {
  id: string;
  badgeType: string;
  badgeName: string;
  badgeDescription: string | null;
  expiresAt: string | null;
}

interface Props {
  clinicId: string;
  existingBadges: ClinicBadge[];
  onClose: () => void;
  onSaved: () => void;
}

export default function AdminBadgeAssignment({ clinicId, existingBadges, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(existingBadges.map(b => b.badgeType))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (badgeId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(badgeId)) next.delete(badgeId);
      else next.add(badgeId);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clinics/badges`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, badgeTypes: Array.from(selected) }),
      });
      if (!res.ok) throw new Error('Failed to save badges');
      setSaved(true);
      onSaved();
    } catch (err) {
      alert('Failed to save badges');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Assign Badges</h2>
            <p className="text-xs text-[var(--muted)]">Award badges to highlight clinic achievements</p>
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--ink2)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AVAILABLE_BADGES.map(badge => {
              const isActive = selected.has(badge.id);
              return (
                <div
                  key={badge.id}
                  onClick={() => toggle(badge.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isActive
                      ? 'border-[var(--ink2)] bg-[rgba(10,22,40,0.08)]'
                      : 'border-[var(--line)] hover:border-[var(--line)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${badge.color}`}>
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--ink)] text-sm">{badge.name}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{badge.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isActive ? 'border-[var(--ink)] bg-[var(--ink)]' : 'border-[var(--line)]'
                    }`}>
                      {isActive && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--line)] shrink-0">
          <p className="text-xs text-[var(--muted)]">
            {selected.size} badge{selected.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--ink2)] border border-[var(--line)] rounded-lg hover:bg-[var(--paper2)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-[var(--ink)] text-white rounded-lg hover:bg-[var(--ink)] disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </>
              ) : 'Save Badges'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AVAILABLE_BADGES };