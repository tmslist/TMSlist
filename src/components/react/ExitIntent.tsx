import { useState, useEffect } from 'react';

export default function ExitIntent() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('exit_intent_shown')) return;
    if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/portal')) return;

    const handler = (e: MouseEvent) => {
      if (e.clientY < 10) {
        setShow(true);
        localStorage.setItem('exit_intent_shown', String(Date.now()));
        document.removeEventListener('mouseleave', handler);
      }
    };
    document.addEventListener('mouseleave', handler);
    return () => document.removeEventListener('mouseleave', handler);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/newsletter/subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSubmitted(true);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShow(false)}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        {submitted ? (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h3>
            <p className="text-gray-500">Check your email for the TMS guide.</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Before you go...</h3>
            <p className="text-gray-500 mb-4">Get our free guide: "Everything You Need to Know About TMS Therapy"</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              <button type="submit" className="px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700">Send Guide</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
