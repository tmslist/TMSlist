import { useState } from 'react';

interface JobApplyFormProps {
  jobId: string;
  jobTitle: string;
  clinicName: string;
  applicationUrl?: string | null;
}

export default function JobApplyForm({ jobId, jobTitle, clinicName, applicationUrl }: JobApplyFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (applicationUrl) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Apply at {clinicName}</h3>
        <p className="text-slate-500 mb-6">This position uses an external application form.</p>
        <a
          href={applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
        >
          Apply on {clinicName}'s website
        </a>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch(`/api/jobs/apply/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: formData.get('applicantName'),
          applicantEmail: formData.get('applicantEmail'),
          applicantPhone: formData.get('applicantPhone') || undefined,
          resumeUrl: formData.get('resumeUrl') || undefined,
          coverLetter: formData.get('coverLetter') || undefined,
          linkedInUrl: formData.get('linkedInUrl') || undefined,
        }),
      });

      if (res.ok) {
        setStatus('success');
        form.reset();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Application Submitted!</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          Your application for <strong>{jobTitle}</strong> has been sent to {clinicName}. They will be in touch soon.
        </p>
        <a href="/careers/" className="text-violet-600 hover:text-violet-500 font-semibold text-sm">
          ← Browse more jobs
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="applicantName"
          required
          minLength={2}
          placeholder="Jane Smith"
          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          name="applicantEmail"
          required
          placeholder="jane@example.com"
          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Phone <span className="text-slate-400 text-xs">(optional)</span>
        </label>
        <input
          type="tel"
          name="applicantPhone"
          placeholder="(555) 000-0000"
          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          LinkedIn URL <span className="text-slate-400 text-xs">(optional)</span>
        </label>
        <input
          type="url"
          name="linkedInUrl"
          placeholder="https://linkedin.com/in/janesmith"
          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Resume URL <span className="text-slate-400 text-xs">(optional)</span>
        </label>
        <input
          type="url"
          name="resumeUrl"
          placeholder="https://drive.google.com/... or https://dropbox.com/..."
          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors"
        />
        <p className="text-xs text-slate-400 mt-1">Paste a link to your resume (Google Drive, Dropbox, etc.)</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Cover Letter / Message <span className="text-slate-400 text-xs">(optional)</span>
        </label>
        <textarea
          name="coverLetter"
          rows={5}
          placeholder="Tell us about yourself and why you'd be a great fit for this role..."
          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors resize-none"
        />
      </div>

      {status === 'error' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
      >
        {status === 'submitting' ? 'Submitting...' : `Apply to ${clinicName}`}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Your information will be sent directly to {clinicName}. We never share your data with third parties.
      </p>
    </form>
  );
}
