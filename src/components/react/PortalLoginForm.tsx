import { useState, useEffect } from 'react';

type AuthMode = 'login' | 'signup';
type LoginMethod = 'magic' | 'password';

export default function PortalLoginForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<LoginMethod>('magic');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error === 'invalid-or-expired') {
      setErrorMsg('This login link has expired or already been used. Please request a new one.');
    } else if (error === 'missing-token') {
      setErrorMsg('Invalid login link. Please request a new one.');
    } else if (error === 'server-error') {
      setErrorMsg('Something went wrong. Please try again.');
    } else if (error === 'google-denied') {
      setErrorMsg('Google sign-in was cancelled. Please try again.');
    }
  }, []);

  function resetForm() {
    setStatus('idle');
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/portal-login', {
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

  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/portal-password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = data.redirectTo || '/portal/dashboard';
      } else {
        setErrorMsg(data.error || 'Login failed');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      setStatus('error');
      return;
    }

    try {
      const res = await fetch('/api/auth/portal-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = data.redirectTo || '/portal/claim';
      } else {
        setErrorMsg(data.error || 'Signup failed');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  // Magic link sent confirmation
  if (status === 'sent') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-600 mb-1">We sent a login link to</p>
          <p className="font-medium text-gray-900 mb-4">{email}</p>
          <p className="text-sm text-gray-500 mb-6">The link expires in 15 minutes.</p>
          <button
            onClick={() => { setStatus('idle'); setEmail(''); }}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Doctor Portal</h1>
          <p className="text-gray-500 text-sm">
            {mode === 'login' ? 'Sign in to manage your clinic listing' : 'Create your account'}
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Google OAuth button */}
        <a
          href="/api/auth/google"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-all mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400 uppercase tracking-wider">or</span>
          </div>
        </div>

        {mode === 'login' && (
          <>
            {/* Login method tabs */}
            <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
              <button
                type="button"
                onClick={() => { setMethod('magic'); resetForm(); }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  method === 'magic'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => { setMethod('password'); resetForm(); }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  method === 'password'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Password
              </button>
            </div>

            {method === 'magic' ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="portal-email-magic" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="portal-email-magic"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="doctor@clinic.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Sending link...' : 'Send Login Link'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label htmlFor="portal-email-pw" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="portal-email-pw"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="doctor@clinic.com"
                  />
                </div>
                <div>
                  <label htmlFor="portal-password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="portal-password"
                    required
                    autoComplete="current-password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Enter your password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {status === 'submitting' ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Switch to signup */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setMode('signup'); resetForm(); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Don't have an account?{' '}
                <span className="font-medium text-emerald-600 hover:text-emerald-700">Sign up</span>
              </button>
            </div>
          </>
        )}

        {mode === 'signup' && (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="portal-signup-name" className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  id="portal-signup-name"
                  required
                  autoComplete="name"
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Dr. Jane Smith"
                />
              </div>
              <div>
                <label htmlFor="portal-signup-email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="portal-signup-email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="doctor@clinic.com"
                />
              </div>
              <div>
                <label htmlFor="portal-signup-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="portal-signup-password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label htmlFor="portal-signup-confirm" className="block text-sm font-medium text-gray-700">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="portal-signup-confirm"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Confirm your password"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {status === 'submitting' ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            {/* Switch to login */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Already have an account?{' '}
                <span className="font-medium text-emerald-600 hover:text-emerald-700">Sign in</span>
              </button>
            </div>
          </>
        )}

        {/* Admin link */}
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <a href="/admin/login" className="text-sm text-gray-500 hover:text-gray-700">
            Are you an admin? <span className="font-medium text-emerald-600 hover:text-emerald-700">Sign in here</span>
          </a>
        </div>
      </div>
    </div>
  );
}
