import { useState } from 'react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Always show success to prevent email enumeration
      if (res.ok) {
        setStatus('sent');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to send reset link');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">Check your email</h2>
          <p className="text-[var(--ink2)] mb-1">We sent a password reset link to</p>
          <p className="font-medium text-[var(--ink)] mb-4">{email.replace(/(.{2}).+(@.+)/, '$1***$2')}</p>
          <p className="text-sm text-[var(--muted)] mb-6">The link expires in 15 minutes.</p>
          <button
            onClick={() => { setStatus('idle'); setEmail(''); }}
            className="text-sm text-[var(--accent)] hover:text-[var(--accent)] font-medium"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <a href="/admin/login" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to login
          </a>
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Reset your password</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Enter your email and we'll send you a link to set a new password.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-[var(--ink2)]">Email address</label>
            <input
              type="email"
              name="email"
              id="reset-email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-3 text-sm focus:border-[var(--ink2)] focus:ring-[rgba(10,22,40,0.15)]"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--ink2)] transition-all disabled:opacity-50"
          >
            {status === 'submitting' ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
}
