import { useState, useEffect } from 'react';

export default function SetPasswordForm() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'submitting' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('token');
    if (!tok) {
      setErrorMsg('Reset link is missing. Please request a new one.');
      setStatus('error');
      return;
    }
    setToken(tok);

    fetch(`/api/auth/password-reset/verify?token=${encodeURIComponent(tok)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setErrorMsg(data.error === 'invalid-or-expired'
            ? 'This reset link has expired or already been used. Please request a new one.'
            : data.error);
          setStatus('error');
        } else {
          setEmail(data.email);
          setStatus('ready');
        }
      })
      .catch(() => {
        setErrorMsg('Failed to validate reset link. Please try again.');
        setStatus('error');
      });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = '/admin/dashboard';
      } else {
        setErrorMsg(data.error || 'Failed to set password. Please try again.');
        setStatus('ready');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('ready');
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--line)] border-t-[#0A1628] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[var(--muted)] text-sm">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">Invalid reset link</h2>
          <p className="text-[var(--ink2)] mb-6">{errorMsg}</p>
          <a href="/admin/forgot-password" className="inline-block py-3 px-6 rounded-xl text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--ink2)] transition-all">
            Request new reset link
          </a>
          <div className="mt-4">
            <a href="/admin/login" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">Back to login</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-[var(--ink)] mb-1">Set new password</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          for <span className="font-medium">{email.replace(/(.{2}).+(@.+)/, '$1***$2')}</span>
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-[var(--ink2)]">New password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                id="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-3 pr-10 text-sm focus:border-[var(--ink2)] focus:ring-[rgba(10,22,40,0.15)]"
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted)] hover:text-[var(--ink2)]"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">Must be at least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-[var(--ink2)]">Confirm password</label>
            <input
              type="password"
              id="confirm-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-3 text-sm focus:border-[var(--ink2)] focus:ring-[rgba(10,22,40,0.15)]"
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--ink2)] transition-all disabled:opacity-50"
          >
            {status === 'submitting' ? 'Saving...' : 'Save password & sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
