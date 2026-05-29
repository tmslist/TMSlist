import { useState, useEffect } from 'react';

export default function LoginForm() {
  const [mode, setMode] = useState<'magic' | 'password'>('password');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpPending, setTotpPending] = useState(false);
  const [totpError, setTotpError] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error === 'invalid-or-expired') {
      setErrorMsg('This login link has expired or already been used. Please request a new one.');
    } else if (error === 'missing-token') {
      setErrorMsg('Invalid login link. Please request a new one.');
    } else if (error === 'server-error') {
      setErrorMsg('Something went wrong. Please try again.');
    } else if (error === 'google-auth-failed') {
      setErrorMsg('Google sign-in was cancelled or failed. Please try again.');
    } else if (error === 'google-not-configured') {
      setErrorMsg('Google sign-in is not configured. Please use email login.');
    } else if (error === 'not-authorized') {
      setErrorMsg('Your Google account is not authorized for admin access.');
    } else if (error === 'google-token-failed' || error === 'google-userinfo-failed') {
      setErrorMsg('Google sign-in failed. Please try again.');
    }
  }, []);

  async function handleMagicSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('sent');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to send login link');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    setRetryAfter(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      const data = await res.json();

      if (data.requires2FA) {
        setTotpPending(true);
        setStatus('idle');
        return;
      }

      if (res.status === 429 && data.retryAfter) {
        setRetryAfter(data.retryAfter);
        setErrorMsg(`Account locked. Try again in ${Math.ceil(data.retryAfter / 60)} minutes.`);
      } else {
        setErrorMsg(data.error || 'Invalid email or password');
      }
      setStatus('error');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  async function handleTotpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (totpCode.length !== 6) {
      setTotpError('Code must be 6 digits');
      return;
    }
    setTotpLoading(true);
    setTotpError('');

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        window.location.href = data.user?.role === 'admin' || data.user?.role === 'editor'
          ? '/admin/dashboard'
          : '/portal/dashboard';
        return;
      }

      if (res.status === 429 && data.retryAfter) {
        setTotpError(`Account locked. Try again in ${Math.ceil(data.retryAfter / 60)} minutes.`);
      } else {
        setTotpError(data.error || 'Invalid code. Please try again.');
      }
    } catch {
      setTotpError('Network error. Please try again.');
    } finally {
      setTotpLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = '/api/auth/google/';
  }

  if (status === 'sent') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-[rgba(201,101,74,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-2">Check your email</h2>
          <p className="text-[var(--ink2)] mb-1">We sent a login link to</p>
          <p className="font-medium text-[var(--ink)] mb-4">{email.replace(/(.{2}).+(@.+)/, '$1***$2')}</p>
          <p className="text-sm text-[var(--muted)] mb-6">The link expires in 15 minutes.</p>
          <button
            onClick={() => { setStatus('idle'); setEmail(''); }}
            className="text-sm text-[var(--accent)] hover:text-[var(--accent)] font-medium"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // 2FA verification screen
  if (totpPending) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-[rgba(201,101,74,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-1">Two-Factor Authentication</h2>
          <p className="text-sm text-[var(--muted)] mb-6">Enter the 6-digit code from your authenticator app</p>

          {totpError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {totpError}
            </div>
          )}

          <form onSubmit={handleTotpSubmit} className="space-y-4">
            <div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl tracking-[0.5em] rounded-lg border border-[var(--line)] px-4 py-3 focus:border-[var(--ink2)] focus:ring-2 focus:ring-[rgba(10,22,40,0.15)] font-mono"
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="submit"
              disabled={totpLoading || totpCode.length !== 6}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--ink2)] transition-all disabled:opacity-50"
            >
              {totpLoading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
          </form>

          <button
            onClick={() => { setTotpPending(false); setTotpCode(''); setTotpError(''); }}
            className="mt-4 text-sm text-[var(--muted)] hover:text-[var(--ink2)] transition-colors"
          >
            &larr; Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-[var(--ink)] text-center mb-1">Admin Login</h1>
        <p className="text-[var(--muted)] text-center text-sm mb-6">Sign in to the TMS List admin panel</p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex border-b border-[var(--line)] mb-6">
          <button
            type="button"
            onClick={() => { setMode('password'); setStatus('idle'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
              mode === 'password'
                ? 'border-[var(--ink)] text-[var(--accent)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink2)]'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('magic'); setStatus('idle'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
              mode === 'magic'
                ? 'border-[var(--ink)] text-[var(--accent)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink2)]'
            }`}
          >
            Magic Link
          </button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[var(--ink2)]">Email address</label>
              <input
                type="email"
                name="email"
                id="login-email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-3 text-sm focus:border-[var(--ink2)] focus:ring-[rgba(10,22,40,0.15)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium text-[var(--ink2)]">Password</label>
                <a
                  href="/admin/forgot-password"
                  className="text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="login-password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[var(--line)] px-4 py-3 pr-10 text-sm focus:border-[var(--ink2)] focus:ring-[rgba(10,22,40,0.15)]"
                  placeholder="Enter your password"
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
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--line)] text-[var(--ink)] focus:ring-[rgba(10,22,40,0.15)]"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-[var(--muted)]">
                Keep me signed in for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--ink2)] transition-all disabled:opacity-50"
            >
              {status === 'submitting' ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <>
            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold text-[var(--ink2)] bg-white border border-[var(--line)] hover:bg-[var(--paper2)] hover:border-[var(--muted)] transition-all shadow-sm mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--line)]"></div></div>
              <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-[var(--muted)] uppercase tracking-wider">or use email</span></div>
            </div>

            <form onSubmit={handleMagicSubmit} className="space-y-4">
              <div>
                <label htmlFor="magic-email" className="block text-sm font-medium text-[var(--ink2)]">Email address</label>
                <input
                  type="email"
                  name="email"
                  id="magic-email"
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
                {status === 'submitting' ? 'Sending link...' : 'Send Login Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
