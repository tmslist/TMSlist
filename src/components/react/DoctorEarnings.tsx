import { useState, useCallback } from 'react';

interface EarningsRecord {
  id: string;
  period: string;
  grossAmount: number;
  netAmount: number;
  currency: string;
  breakdown: Record<string, unknown> | null;
  paidAt: string | null;
  createdAt: string;
}

interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
}

interface Summary {
  totalRevenue: number;
  totalSessions: number;
  totalPatients: number;
  totalExpenses: number;
  netEarnings: number;
}

interface DoctorEarningsProps {
  doctorId?: string;
  initialEarnings?: EarningsRecord[];
  initialExpenses?: ExpenseRecord[];
  initialSummary?: Summary;
}

const EXPENSE_CATEGORIES = ['Equipment', 'Supplies', 'Software', 'Marketing', 'Travel', 'Other'];
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  processing: 'Processing',
  failed: 'Failed',
};

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getMonthRange(monthsBack: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  start.setDate(1);
  end.setDate(0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function DoctorEarnings({ doctorId, initialEarnings = [], initialExpenses = [], initialSummary }: DoctorEarningsProps) {
  const [earnings, setEarnings] = useState<EarningsRecord[]>(initialEarnings);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [summary, setSummary] = useState<Summary>(initialSummary ?? { totalRevenue: 0, totalSessions: 0, totalPatients: 0, totalExpenses: 0, netEarnings: 0 });
  const [loading, setLoading] = useState(!doctorId);
  const [error, setError] = useState('');
  const [filterMonths, setFilterMonths] = useState(6);
  const [activeTab, setActiveTab] = useState<'earnings' | 'expenses'>('earnings');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState('');

  const loadData = useCallback(async () => {
    if (!doctorId) { setLoading(false); return; }
    try {
      const res = await fetch('/api/doctor/earnings');
      if (res.ok) {
        const data = await res.json();
        setEarnings(data.earnings || []);
        setExpenses(data.expenses || []);
        setSummary(data.summary || summary);
      } else {
        setError('Failed to load earnings data');
      }
    } catch {
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // Load on mount if no initial data
  const hasInitial = initialEarnings.length > 0 || initialSummary !== undefined;
  if (doctorId && !loading && earnings.length === 0 && !hasInitial) {
    loadData();
  }

  const filteredEarnings = earnings.filter(e => {
    if (filterMonths === 0) return true;
    const [year, month] = e.period.split('-');
    if (!year || !month) return false;
    const periodDate = new Date(parseInt(year), parseInt(month) - 1);
    const { start } = getMonthRange(filterMonths);
    return periodDate >= new Date(start);
  });

  // Chart data: last 6 periods
  const chartData = filteredEarnings
    .slice(0, 6)
    .reverse()
    .map(e => ({
      label: formatPeriod(e.period),
      gross: e.grossAmount,
      net: e.netAmount,
    }));

  const maxChartValue = Math.max(...chartData.map(d => d.gross), 1);

  const handlePayoutRequest = async () => {
    setPayoutLoading(true);
    setPayoutMsg('');
    try {
      const res = await fetch('/api/doctor/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'payout_request' }),
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutMsg('Payout request submitted successfully.');
        setTimeout(() => setShowPayoutModal(false), 2000);
      } else {
        setPayoutMsg(data.error || 'Failed to submit payout request.');
      }
    } catch {
      setPayoutMsg('Network error. Please try again.');
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(summary.totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">Gross earnings</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Net Earnings</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">{formatCurrency(summary.netEarnings)}</p>
          <p className="text-xs text-gray-400 mt-1">After expenses</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Sessions</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.totalSessions.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Completed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Patients</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{summary.totalPatients.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">Total seen</p>
        </div>
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-gray-900">Revenue Breakdown</h2>
            <select
              value={filterMonths}
              onChange={e => setFilterMonths(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
              <option value={0}>All time</option>
            </select>
          </div>
          <div className="flex items-end gap-3 h-40">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col gap-1 h-32 justify-end">
                  <div
                    className="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max((d.gross / maxChartValue) * 100, 2)}%` }}
                    title={`Gross: ${formatCurrency(d.gross)}`}
                  />
                  <div
                    className="w-full bg-green-500 rounded-t-sm transition-all hover:bg-green-600"
                    style={{ height: `${Math.max((d.net / maxChartValue) * 100, 2)}%` }}
                    title={`Net: ${formatCurrency(d.net)}`}
                  />
                </div>
                <span className="text-xs text-gray-500 text-center">{d.label.split(' ')[0].slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              <span className="text-xs text-gray-500">Gross</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
              <span className="text-xs text-gray-500">Net</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'earnings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Earnings ({earnings.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Expenses ({expenses.length})
          </button>
        </div>
        {activeTab === 'earnings' && (
          <button
            onClick={() => setShowPayoutModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Request Payout
          </button>
        )}
        {activeTab === 'expenses' && (
          <button
            onClick={() => {/* TODO: add expense modal */}}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Add Expense
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
      )}

      {activeTab === 'earnings' ? (
        filteredEarnings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No earnings records yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Period</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Gross</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Net</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Paid Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredEarnings.map(e => (
                  <tr key={e.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{formatPeriod(e.period)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(e.grossAmount, e.currency)}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(e.netAmount, e.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${e.paidAt ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {e.paidAt ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {e.paidAt ? new Date(e.paidAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        expenses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No expense records yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">{e.category}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{e.description ?? '—'}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">-{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPayoutModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Request Payout</h3>
            <p className="text-sm text-gray-500 mb-6">Request a payout of your available balance.</p>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-2xl font-semibold text-blue-700">{formatCurrency(summary.netEarnings)}</p>
            </div>
            {payoutMsg && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{payoutMsg}</div>
            )}
            <button
              onClick={handlePayoutRequest}
              disabled={payoutLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {payoutLoading ? 'Submitting...' : 'Submit Payout Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}