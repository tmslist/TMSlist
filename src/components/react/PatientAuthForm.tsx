import { useState, useEffect } from 'react';

type AuthMode = 'login' | 'register';
type ActiveMethod = 'google' | 'password' | 'magic';

const PASSWORD_COMMON = new Set([
  'password', 'password123', '12345678', 'qwerty', 'abc123', 'letmein', 'welcome',
]);

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '', feedback: [] as string[] };
  if (PASSWORD_COMMON.has(password.toLowerCase())) {
    return { score: 1, label: 'Too common', color: 'bg-red-500', feedback: ['Choose a less predictable password'] as string[] };
  }
  const feedback: string[] = [];
  if (password.length < 8) feedback.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) feedback.push('Uppercase letter');
  if (!/[0-9]/.test(password)) feedback.push('Number');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Special character');
  const score = Math.min(feedback.length === 0 ? 4 : 5 - feedback.length, 4);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  return { score, label: labels[score], color: colors[score], feedback };
}

interface PatientAuthFormProps {
  mode?: 'login' | 'register';
  redirect?: string;
}

export default function PatientAuthForm({ mode: initialMode = 'login', redirect = '/account' }: PatientAuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [activeMethod, setActiveMethod] = useState<ActiveMethod>('google');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth URL
  const googleOAuthUrl = `/api/auth/google/patient-callback?state=${encodeURIComponent(redirect)}`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error === 'invalid-or-expired') setErrorMsg('Login link expired. Please request a new one.');
    else if (error === 'google-auth-failed') setErrorMsg('Google sign-in failed. Please try again.');
    else if (error === 'server-error') setErrorMsg('Something went wrong. Please try again.');
  }, []);

  // Password login / register
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const endpoint = mode === 'register' ? '/api/patient/register' : '/api/auth/patient-login';
    const body: Record<string, string> = { email, password };
    if (mode === 'register') body.name = name;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        const redirectTo = new URLSearchParams(window.location.search).get('redirect') || redirect;
        window.location.href = redirectTo;
      } else {
        setErrorMsg(data.error || (mode === 'register' ? 'Registration failed' : 'Invalid credentials'));
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  // Magic link
  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'patient-magic' }),
      });

      if (res.ok) {
        setStatus('sent');
        setSuccessMsg(`Login link sent to ${email.replace(/(.{2}).+(@.+)/, '$1***$2')}. Check your inbox!`);
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

  const strength = getPasswordStrength(password);

  if (status === 'sent') {
    return (
      <div className="w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-600 mb-1">We sent a login link to</p>
        <p className="font-semibold text-gray-900 mb-4">{email}</p>
        <p className="text-sm text-gray-500 mb-6">The link expires in 15 minutes. Check your spam folder if you don't see it.</p>
        <button
          onClick={() => { setStatus('idle'); setEmail(''); }}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {mode === 'register'
            ? 'Join TMS List to save clinics, share stories, and connect with others.'
            : 'Sign in to access your saved clinics, reviews, and community.'}
        </p>
      </div>

      {/* Error / Success */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          {successMsg}
        </div>
      )}

      {/* Method Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
        {(['google', 'password', 'magic'] as ActiveMethod[]).map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => { setActiveMethod(method); setStatus('idle'); setErrorMsg(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeMethod === method
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {method === 'google' && (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </span>
            )}
            {method === 'password' && (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Password
              </span>
            )}
            {method === 'magic' && (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Magic Link
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── GOOGLE ── */}
      {activeMethod === 'google' && (
        <div className="space-y-4">
          <a
            href={googleOAuthUrl}
            className="flex items-center justify-center gap-3 w-full py-3.5 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>
          <p className="text-xs text-center text-gray-400">No password needed. Your Google email must be verified.</p>
        </div>
      )}

      {/* ── PASSWORD ── */}
      {activeMethod === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                id="auth-name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder="Your full name"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              id="auth-email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              {mode === 'register' ? 'Password' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="auth-password"
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder={mode === 'register' ? 'Min 8 characters' : 'Enter password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.477.068 1.172-.006 1.817a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  )}
                </svg>
              </button>
            </div>

            {/* Password strength (register only) */}
            {mode === 'register' && password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${strength.score >= level ? strength.color : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                {strength.feedback.length > 0 && (
                  <p className="text-xs text-gray-500">{strength.feedback[0]}</p>
                )}
              </div>
            )}
          </div>

          {mode === 'register' && (
            <p className="text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <a href="/legal/terms-of-service" className="text-indigo-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/legal/privacy-policy" className="text-indigo-600 hover:underline">Privacy Policy</a>.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
          >
            {status === 'submitting' ? (mode === 'register' ? 'Creating account...' : 'Signing in...') : (mode === 'register' ? 'Create Account' : 'Sign In')}
          </button>
        </form>
      )}

      {/* ── MAGIC LINK ── */}
      {activeMethod === 'magic' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="magic-email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              id="magic-email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="button"
            onClick={handleMagicSubmit}
            disabled={status === 'submitting'}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50"
          >
            {status === 'submitting' ? 'Sending link...' : 'Send Login Link'}
          </button>
          <p className="text-xs text-center text-gray-400">We'll email you a link — just click it to sign in. Expires in 15 minutes.</p>
        </div>
      )}

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"/></div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-gray-400 font-medium">or</span>
        </div>
      </div>

      {/* Switch mode */}
      <p className="text-center text-sm text-gray-500">
        {mode === 'register' ? (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => { setMode('login'); setStatus('idle'); setErrorMsg(''); }} className="text-indigo-600 font-semibold hover:text-indigo-700">
              Sign in
            </button>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <button type="button" onClick={() => { setMode('register'); setStatus('idle'); setErrorMsg(''); }} className="text-indigo-600 font-semibold hover:text-indigo-700">
              Create one free
            </button>
          </>
        )}
      </p>

      {/* Benefits (register) */}
      {mode === 'register' && (
        <div className="mt-5 p-4 bg-indigo-50 rounded-xl">
          <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wider">What you get free:</p>
          <ul className="space-y-1.5">
            {['Save clinics to your wishlist', 'Write verified reviews', 'Ask questions in the community', 'Share your TMS story to help others'].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2 text-xs text-indigo-700">
                <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}