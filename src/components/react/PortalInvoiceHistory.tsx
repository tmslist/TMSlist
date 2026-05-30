import { useState, useEffect } from 'react';
import { PortalCard, PortalButton, LoadingScreen, ErrorScreen } from './PortalUI';

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'void';
  dueDate: string | null;
  paidAt: string | null;
  plan: string;
  description: string;
}

const STATUS_META = {
  paid:     { label: 'Paid',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  pending:  { label: 'Pending',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  overdue:  { label: 'Overdue',  color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  void:     { label: 'Void',     color: 'text-[var(--muted)]', bg: 'bg-[var(--paper2)] border-[var(--line)]' },
};

function formatCents(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PortalInvoiceHistory() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/portal/invoices')
      .then(async r => {
        if (!r.ok) throw new Error('Failed to load invoices');
        const d = await r.json();
        setInvoices(d.data ?? []);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen message="Loading invoices..." />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <PortalCard padding="md">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCents(totalPaid)}</p>
        </PortalCard>
        <PortalCard padding="md">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCents(totalOutstanding)}</p>
        </PortalCard>
        <PortalCard padding="md">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Overdue</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCents(totalOverdue)}</p>
        </PortalCard>
      </div>

      {/* Invoices table */}
      {invoices.length === 0 ? (
        <PortalCard padding="lg">
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--paper2)] rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-[var(--muted)] text-sm">No invoices yet</p>
            <p className="text-[var(--muted)] text-xs mt-1">Your billing history will appear here.</p>
          </div>
        </PortalCard>
      ) : (
        <PortalCard padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Invoice</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Due</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const meta = STATUS_META[inv.status] ?? STATUS_META.void;
                return (
                  <tr key={inv.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--paper2)] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-[var(--ink)]">{inv.description}</div>
                      <div className="text-xs text-[var(--muted)] mt-0.5">#{inv.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-5 py-4 text-[var(--ink2)]">{formatDate(inv.paidAt ?? inv.dueDate)}</td>
                    <td className="px-5 py-4 font-semibold text-[var(--ink)]">{formatCents(inv.amount, inv.currency)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[var(--muted)] text-xs">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                        Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </PortalCard>
      )}
    </div>
  );
}