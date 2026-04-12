import { useState, useEffect } from 'react';
import { JOB_ROLE_CATEGORIES, EMPLOYMENT_TYPES } from './JobCard';

interface JobEditorProps {
  job?: {
    id?: string;
    title?: string;
    roleCategory?: string;
    employmentType?: string;
    location?: string;
    remote?: boolean;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryDisplay?: string | null;
    description?: string | null;
    requirements?: string | null;
    responsibilities?: string | null;
    benefits?: string | null;
    applicationEmail?: string | null;
    applicationUrl?: string | null;
    expiresAt?: string | null;
    status?: string;
  };
  clinicEmail?: string;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

const STEPS = ['Role', 'Details', 'Description', 'Application'];

export default function PortalJobEditor({ job, clinicEmail, onSave, onCancel }: JobEditorProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [title, setTitle] = useState(job?.title ?? '');
  const [roleCategory, setRoleCategory] = useState(job?.roleCategory ?? '');
  const [employmentType, setEmploymentType] = useState(job?.employmentType ?? 'full_time');
  const [location, setLocation] = useState(job?.location ?? '');
  const [remote, setRemote] = useState(job?.remote ?? false);
  const [salaryMin, setSalaryMin] = useState(job?.salaryMin ? String(job.salaryMin) : '');
  const [salaryMax, setSalaryMax] = useState(job?.salaryMax ? String(job.salaryMax) : '');
  const [salaryDisplay, setSalaryDisplay] = useState(job?.salaryDisplay ?? '');
  const [description, setDescription] = useState(job?.description ?? '');
  const [requirements, setRequirements] = useState(job?.requirements ?? '');
  const [responsibilities, setResponsibilities] = useState(job?.responsibilities ?? '');
  const [benefits, setBenefits] = useState(job?.benefits ?? '');
  const [applicationEmail, setApplicationEmail] = useState(job?.applicationEmail ?? clinicEmail ?? '');
  const [applicationUrl, setApplicationUrl] = useState(job?.applicationUrl ?? '');
  const [expiresAt, setExpiresAt] = useState(
    job?.expiresAt ? new Date(job.expiresAt).toISOString().slice(0, 10) : ''
  );

  function validate() {
    const errs: Record<string, string> = {};
    if (step === 0) {
      if (!roleCategory) errs.roleCategory = 'Please select a role category';
      if (!title.trim() || title.trim().length < 3) errs.title = 'Title must be at least 3 characters';
    }
    if (step === 1) {
      if (!location.trim()) errs.location = 'Location is required';
    }
    if (step === 2) {
      if (!description.trim() || description.trim().length < 50) errs.description = 'Description must be at least 50 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validate()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        roleCategory,
        employmentType,
        location: location.trim(),
        remote,
        salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        salaryDisplay: salaryDisplay || undefined,
        description: description.trim(),
        requirements: requirements.trim() || undefined,
        responsibilities: responsibilities.trim() || undefined,
        benefits: benefits.trim() || undefined,
        applicationEmail: applicationEmail.trim() || undefined,
        applicationUrl: applicationUrl.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-colors";
  const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit}>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'bg-emerald-500 text-white' :
              i === step ? 'bg-violet-600 text-white' :
              'bg-slate-200 text-slate-500'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-violet-700' : 'text-slate-400'}`}>{s}</span>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 rounded ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Role */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className={labelCls}>Role Category <span className="text-red-500">*</span></label>
            <select
              value={roleCategory}
              onChange={(e) => setRoleCategory(e.target.value)}
              className={inputCls}
            >
              <option value="">Select a category...</option>
              {JOB_ROLE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.roleCategory && <p className="text-xs text-red-500 mt-1">{errors.roleCategory}</p>}
            {roleCategory && (
              <p className="text-xs text-slate-500 mt-1">
                {JOB_ROLE_CATEGORIES.find(c => c.value === roleCategory)?.label}
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>Job Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TMS Technician — Part-Time"
              className={inputCls}
              maxLength={200}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Employment Type <span className="text-red-500">*</span></label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className={inputCls}>
                {Object.entries(EMPLOYMENT_TYPES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remote?</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remote}
                  onChange={(e) => setRemote(e.target.checked)}
                  className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                />
                <span className="text-sm text-slate-600">Remote work available</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Location <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Austin, TX or Remote"
              className={inputCls}
            />
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className={labelCls}>Salary Range</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="Min (e.g. 65000)"
                min={0}
                className={inputCls}
              />
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="Max (e.g. 85000)"
                min={0}
                className={inputCls}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Enter annual salary in dollars, or leave blank for "Competitive"</p>
          </div>

          <div>
            <label className={labelCls}>Custom Salary Display</label>
            <input
              type="text"
              value={salaryDisplay}
              onChange={(e) => setSalaryDisplay(e.target.value)}
              placeholder="e.g. $65k – $85k + bonus"
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">Override automatic formatting (optional)</p>
          </div>

          <div>
            <label className={labelCls}>Expires On</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">Job auto-closes after this date (optional)</p>
          </div>
        </div>
      )}

      {/* Step 2: Description */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className={labelCls}>Job Description <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Describe the role, team, and what makes this opportunity exciting..."
              className={`${inputCls} resize-none`}
              maxLength={10000}
            />
            <div className="flex justify-between mt-1">
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              <p className="text-xs text-slate-400 ml-auto">{description.length}/10000</p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Requirements <span className="text-slate-400 text-xs">(optional)</span></label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
              placeholder="List certifications, experience, skills required..."
              className={`${inputCls} resize-none`}
              maxLength={5000}
            />
          </div>

          <div>
            <label className={labelCls}>Responsibilities <span className="text-slate-400 text-xs">(optional)</span></label>
            <textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              rows={4}
              placeholder="What will this person do day-to-day?"
              className={`${inputCls} resize-none`}
              maxLength={5000}
            />
          </div>

          <div>
            <label className={labelCls}>Benefits <span className="text-slate-400 text-xs">(optional)</span></label>
            <textarea
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              rows={3}
              placeholder="Health insurance, 401k, CME allowance, etc."
              className={`${inputCls} resize-none`}
              maxLength={5000}
            />
          </div>
        </div>
      )}

      {/* Step 3: Application */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <label className={labelCls}>Application Email</label>
            <input
              type="email"
              value={applicationEmail}
              onChange={(e) => setApplicationEmail(e.target.value)}
              placeholder={clinicEmail ?? 'hiring@clinic.com'}
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">Applications will be forwarded here. Defaults to your clinic email.</p>
          </div>

          <div>
            <label className={labelCls}>External Application URL <span className="text-slate-400 text-xs">(optional)</span></label>
            <input
              type="url"
              value={applicationUrl}
              onChange={(e) => setApplicationUrl(e.target.value)}
              placeholder="https://yourats.com/jobs/123"
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1">If using an external system (Greenhouse, Lever, etc.), paste the URL here.</p>
          </div>

          {/* Preview card */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Preview</p>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="font-bold text-slate-900 mb-1">{title || 'Your Job Title'}</h4>
              <p className="text-sm text-slate-500 mb-2">
                {[location || 'Location', employmentType ? EMPLOYMENT_TYPES[employmentType] : 'Full-time'].join(' · ')}
                {remote ? ' · Remote OK' : ''}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {description ? description.slice(0, 120) + '...' : 'Your job description will appear here...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={step === 0 ? onCancel : prev}
          className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          {step === 0 ? 'Cancel' : '← Back'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={next}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving ? 'Publishing...' : (job?.id ? 'Save Changes' : 'Publish Job')}
          </button>
        )}
      </div>
    </form>
  );
}
