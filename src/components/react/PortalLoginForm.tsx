import { useState, useEffect, useRef } from 'react';

type AuthMode = 'login' | 'signup';
type LoginMethod = 'magic' | 'password';

const PASSWORD_COMMON = new Set([
  'password', 'password123', '12345678', 'qwerty', 'abc123', 'letmein',
]);

function getPasswordStrength(password: string): { score: number; label: string; color: string; feedback: string[] } {
  if (!password) return { score: 0, label: '', color: '', feedback: [] };
  if (PASSWORD_COMMON.has(password.toLowerCase())) {
    return { score: 1, label: 'Too common', color: 'bg-red-500', feedback: ['Choose a less predictable password'] };
  }
  const feedback: string[] = [];
  if (password.length < 8) feedback.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) feedback.push('Uppercase letter');
  if (!/[a-z]/.test(password)) feedback.push('Lowercase letter');
  if (!/[0-9]/.test(password)) feedback.push('Number');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Special character');
  const score = Math.min(feedback.length === 0 ? 4 : 5 - feedback.length, 4);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  return { score, label: labels[score], color: colors[score], feedback };
}

export default function PortalLoginForm() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<LoginMethod>('magic');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'verified' | 'created' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [npi, setNpi] = useState('');
  const [npiStatus, setNpiStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'error'>('idle');
  const [npiError, setNpiError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pwStrength, setPwStrength] = useState(getPasswordStrength(''));
  const [resendCountdown, setResendCountdown] = useState(0);
  const npiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // URL error params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error === 'invalid-or-expired') setErrorMsg('This login link has expired or already been used. Please request a new one.');
    else if (error === 'missing-token') setErrorMsg('Invalid login link. Please request a new one.');
    else if (error === 'server-error') setErrorMsg('Something went wrong. Please try again.');
    else if (error === 'google-denied') setErrorMsg('Google sign-in was cancelled.');
    else if (params.get('verified') === 'true') {
      setErrorMsg('');
      setStatus('verified');
    }
  }, []);

  // Password strength
  useEffect(() => {
    setPwStrength(getPasswordStrength(password));
  }, [password]);

  // NPI validation
  useEffect(() => {
    if (npiTimerRef.current) clearTimeout(npiTimerRef.current);
    if (!npi || !/^\d{10}$/.test(npi)) { setNpiStatus('idle'); return; }
    setNpiStatus('checking');
    npiTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/npi-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ npi }),
        });
        const data = await res.json();
        if (data.valid) {
          setNpiStatus('valid');
          if (data.provider) {
            setNpiError(`${data.provider.firstName} ${data.provider.lastName} — verified in NPPES registry`);
          }
        } else {
          setNpiStatus('invalid');
          setNpiError(data.error || 'Invalid NPI');
        }
      } catch {
        setNpiStatus('idle');
      }
    }, 600);
  }, [npi]);

  // Resend countdown
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  function resetForm() {
    setStatus('idle');
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setNpi('');
    setNpiStatus('idle');
    setNpiError('');
    setTermsAccepted(false);
    setPwStrength(getPasswordStrength(''));
  }

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    resetForm();
  }

  // Magic link
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/portal-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('sent');
        setResendCountdown(60);
      } else {
        setErrorMsg(data.error || 'Failed to send login link');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  // Password login
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/portal-password-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.redirected) {
        // 302 redirect from login API — cookie was set, follow the redirect
        window.location.href = res.url;
        return;
      }

      const data = await res.json();
      setErrorMsg(data.error || 'Login failed');
      setStatus('error');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  // Signup
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      setStatus('error');
      return;
    }
    if (pwStrength.score < 3) {
      setErrorMsg('Password is too weak. Use at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters.');
      setStatus('error');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('You must accept the terms and privacy policy to create an account.');
      setStatus('error');
      return;
    }

    try {
      const res = await fetch('/api/auth/portal-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, npiNumber: npi || undefined, termsAccepted: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('created');
      } else {
        setErrorMsg(data.error || 'Signup failed');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  // Magic link sent — show success state
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
          <p className="text-sm text-gray-500 mb-6">The link expires in 15 minutes. Click it to sign in instantly.</p>
          {resendCountdown > 0 ? (
            <p className="text-sm text-gray-400 mb-4">Resend available in {resendCountdown}s</p>
          ) : (
            <button
              onClick={() => { setStatus('idle'); setEmail(''); }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mb-4"
            >
              Use a different email
            </button>
          )}
        </div>
      </div>
    );
  }

  // Email verified state
  if (status === 'verified') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-500 mb-6">Your email has been confirmed. You can now sign in to your Doctor Portal.</p>
          <button
            onClick={() => { setStatus('idle'); switchMode('login'); }}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Account created — awaiting verification
  if (status === 'created') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your inbox!</h2>
          <p className="text-gray-500 mb-1">We sent a verification email to</p>
          <p className="font-medium text-gray-900 mb-4">{email}</p>
          <p className="text-sm text-gray-500 mb-6">Click the link in the email to activate your account. It expires in 24 hours.</p>
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

        {/* Error */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{errorMsg}</div>
        )}

        {/* Google OAuth */}
        <a
          href="/api/auth/google/?state=portal"
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

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <>
            {/* Method tabs */}
            <div className="flex rounded-lg bg-gray-100 p-1 mb-4">
              <button
                type="button"
                onClick={() => { setMethod('magic'); resetForm(); }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  method === 'magic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => { setMethod('password'); resetForm(); }}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  method === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Password
              </button>
            </div>

            {method === 'magic' ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="portal-email-magic" className="block text-sm font-medium text-gray-700">Email address</label>
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
                  <label htmlFor="portal-email-pw" className="block text-sm font-medium text-gray-700">Email address</label>
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
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="portal-password" className="block text-sm font-medium text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!email) { setErrorMsg('Enter your email first and we\'ll send a reset link.'); return; }
                        fetch('/api/auth/forgot-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email }),
                        }).then(() => {
                          setErrorMsg('');
                          alert('If an account with that email exists, a reset link has been sent.');
                        }).catch(() => alert('Failed to send reset email. Please try again.'));
                      }}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
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

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Don't have an account?{' '}
                <span className="font-medium text-emerald-600 hover:text-emerald-700">Sign up</span>
              </button>
            </div>
          </>
        )}

        {/* ── SIGNUP ── */}
        {mode === 'signup' && (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="portal-signup-name" className="block text-sm font-medium text-gray-700">Full name</label>
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
                <label htmlFor="portal-signup-email" className="block text-sm font-medium text-gray-700">Email address</label>
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
                <label htmlFor="portal-signup-npi" className="block text-sm font-medium text-gray-700">
                  NPI Number{' '}
                  <span className="text-gray-400 font-normal">(optional — verifies your medical credentials)</span>
                </label>
                <input
                  type="text"
                  name="npiNumber"
                  id="portal-signup-npi"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="\d{10}"
                  value={npi}
                  onChange={(e) => setNpi(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`mt-1 block w-full rounded-lg border px-4 py-3 text-sm focus:ring-emerald-500 ${
                    npiStatus === 'valid' ? 'border-green-500 focus:border-green-500' :
                    npiStatus === 'invalid' ? 'border-red-400 focus:border-red-400' :
                    'border-gray-300 focus:border-emerald-500'
                  }`}
                  placeholder="10-digit NPI (e.g. 1234567890)"
                />
                {npiStatus === 'checking' && <p className="mt-1 text-xs text-gray-400">Checking NPI registry...</p>}
                {npiStatus === 'valid' && npiError && <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  {npiError}
                </p>}
                {npiStatus === 'invalid' && npiError && <p className="mt-1 text-xs text-red-500">{npiError}</p>}
              </div>
              <div>
                <label htmlFor="portal-signup-password" className="block text-sm font-medium text-gray-700">Password</label>
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
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrength.score ? pwStrength.color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${pwStrength.score >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                      {pwStrength.label}
                      {pwStrength.feedback.length > 0 && pwStrength.score < 3 && (
                        <span className="text-gray-400"> — {pwStrength.feedback[0]}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="portal-signup-confirm" className="block text-sm font-medium text-gray-700">Confirm password</label>
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
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="terms-checkbox" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <a href="/legal/terms-of-service" target="_blank" rel="noopener" className="text-emerald-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/legal/privacy-policy" target="_blank" rel="noopener" className="text-emerald-600 hover:underline">Privacy Policy</a>.
                  I understand my data will be used to manage my clinic listing on TMS List.
                </label>
              </div>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {status === 'submitting' ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Already have an account?{' '}
                <span className="font-medium text-emerald-600 hover:text-emerald-700">Sign in</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
