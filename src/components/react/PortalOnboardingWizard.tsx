import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query';
import { PortalCard, PortalButton, PortalInput, PortalTextarea, ProgressBar, LoadingScreen } from './PortalUI';
import { Stars } from './PortalUI';

// Step definitions
const STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Get started with your clinic profile' },
  { id: 'basic-info', title: 'Basic Info', description: 'Name, location, and contact details' },
  { id: 'about', title: 'About', description: 'Tell patients about your clinic' },
  { id: 'services', title: 'Services', description: 'What treatments do you offer?' },
  { id: 'hours', title: 'Hours', description: 'When are you available?' },
  { id: 'locations', title: 'Locations', description: 'Add additional clinic branches' },
  { id: 'billing', title: 'Billing', description: 'Set up your subscription' },
  { id: 'complete', title: 'Complete', description: 'You\'re all set!' },
] as const;

interface OnboardingWizardProps {
  userId: string;
  userEmail: string;
  onComplete?: () => void;
}

interface ClinicData {
  name?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  description?: string;
  descriptionLong?: string;
  machines?: string[];
  specialties?: string[];
  openingHours?: string[];
  accepting_new_patients?: boolean;
  same_week_available?: boolean;
  evening_hours?: boolean;
  weekend_hours?: boolean;
  price_range?: string;
  session_price_min?: number;
  session_price_max?: number;
  free_consultation?: boolean;
  accepts_insurance?: boolean;
}

export default function OnboardingWizard({ userId, userEmail, onComplete }: OnboardingWizardProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ClinicData>({
    name: '',
    city: '',
    state: '',
    phone: '',
    email: userEmail,
    description: '',
    descriptionLong: '',
    machines: [],
    specialties: [],
    openingHours: [],
    accepting_new_patients: true,
    same_week_available: false,
    evening_hours: false,
    weekend_hours: false,
    price_range: 'moderate',
    session_price_min: 0,
    session_price_max: 0,
    free_consultation: false,
    accepts_insurance: false,
  });

  const [newMachine, setNewMachine] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');

  // Autosave with debounce
  const saveData = useCallback(async (data: ClinicData) => {
    setSaving(true);
    setSaveStatus('saving');

    try {
      const res = await fetch('/api/portal/clinic', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Copy non-availability/pricing fields directly
          name: data.name,
          description: data.description,
          phone: data.phone,
          email: data.email,
          city: data.city,
          state: data.state,
          descriptionLong: data.descriptionLong,
          machines: data.machines,
          specialties: data.specialties,
          openingHours: data.openingHours,

          // Map flat fields to nested availability object
          availability: {
            accepting_new_patients: data.accepting_new_patients ?? true,
            same_week_available: data.same_week_available ?? false,
            evening_hours: data.evening_hours ?? false,
            weekend_hours: data.weekend_hours ?? false,
            home_visits: data.home_visits ?? false,
          },

          // Map flat fields to nested pricing object
          pricing: {
            price_range: data.price_range || 'moderate',
            session_price_min: data.session_price_min || null,
            session_price_max: data.session_price_max || null,
            free_consultation: data.free_consultation ?? false,
            accepts_insurance: data.accepts_insurance ?? false,
          },

          onboarding: true,
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }, []);

  // Debounced save effect
  useEffect(() => {
    if (currentStep > 0 && currentStep < STEPS.length - 1) {
      const timer = setTimeout(() => saveData(formData), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, currentStep, saveData]);

  const updateField = <K extends keyof ClinicData>(field: K, value: ClinicData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: 'machines' | 'specialties', value: string) => {
    if (!value.trim()) return;
    const current = formData[field] || [];
    if (!current.includes(value.trim())) {
      updateField(field, [...current, value.trim()]);
    }
    if (field === 'machines') setNewMachine('');
    else setNewSpecialty('');
  };

  const removeFromArray = (field: 'machines' | 'specialties', value: string) => {
    const current = formData[field] || [];
    updateField(field, current.filter(v => v !== value));
  };

  const nextStep = () => {
    const currentStepId = STEPS[currentStep].id;
    setCompletedSteps(prev => new Set([...prev, currentStepId]));
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const jumpToStep = (index: number) => {
    // Can only jump to completed steps or current step
    if (index <= currentStep || completedSteps.has(STEPS[index].id)) {
      setCurrentStep(index);
    }
  };

  const completeOnboarding = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/portal/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });

      if (!res.ok) {
        setError('Failed to complete onboarding. Please try again.');
        setSaving(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.portal.dashboard() });
      onComplete?.();
    } catch {
      setError('Network error. Please check your connection.');
      setSaving(false);
    } finally {
      setSaving(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const currentStepData = STEPS[currentStep];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-[var(--ink)]">Set Up Your Clinic Profile</h1>
          {saveStatus !== 'idle' && (
            <span className={`text-sm flex items-center gap-2 ${saveStatus === 'saved' ? 'text-emerald-600' : saveStatus === 'error' ? 'text-red-600' : 'text-[var(--muted)]'}`}>
              {saveStatus === 'saving' && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Error saving'}
            </span>
          )}
        </div>

        <ProgressBar value={progress} showValue className="mb-6" />

        {/* Step indicators */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => jumpToStep(index)}
              disabled={index > currentStep && !completedSteps.has(step.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                index === currentStep
                  ? 'bg-emerald-600 text-white'
                  : completedSteps.has(step.id)
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-[var(--paper2)] text-[var(--muted)]'
              }`}
            >
              {completedSteps.has(step.id) && index !== currentStep ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-4 h-4 flex items-center justify-center text-xs">{index + 1}</span>
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <PortalCard padding="lg" className="mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--ink)] mb-1">{currentStepData.title}</h2>
          <p className="text-[var(--muted)]">{currentStepData.description}</p>
        </div>

        {/* Step content based on current step */}
        {currentStepData.id === 'welcome' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-[var(--ink)] mb-4">Welcome to TMS List!</h3>
            <p className="text-[var(--ink2)] max-w-md mx-auto mb-8">
              Let's set up your clinic profile so patients can find and contact you. This takes about 5 minutes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-3 p-4 bg-[var(--paper2)] rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--ink)] text-sm">Claim Your Clinic</p>
                  <p className="text-xs text-[var(--muted)]">Link your listing to your account</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[var(--paper2)] rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--ink)] text-sm">Add Details</p>
                  <p className="text-xs text-[var(--muted)]">Services, hours, pricing</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[var(--paper2)] rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--ink)] text-sm">Get Found</p>
                  <p className="text-xs text-[var(--muted)]">Start receiving enquiries</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStepData.id === 'basic-info' && (
          <div className="space-y-6">
            <PortalInput
              label="Clinic Name"
              value={formData.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Brain & Spine Institute"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PortalInput
                label="City"
                value={formData.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="e.g., Los Angeles"
                required
              />
              <PortalInput
                label="State"
                value={formData.state || ''}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="e.g., CA"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PortalInput
                label="Phone"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="e.g., (555) 123-4567"
                type="tel"
              />
              <PortalInput
                label="Email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="e.g., contact@clinic.com"
                type="email"
              />
            </div>
          </div>
        )}

        {currentStepData.id === 'about' && (
          <div className="space-y-6">
            <PortalTextarea
              label="Short Description"
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="A brief overview of your clinic (1-2 sentences)"
              rows={3}
            />
            <PortalTextarea
              label="Detailed Description"
              value={formData.descriptionLong || ''}
              onChange={(e) => updateField('descriptionLong', e.target.value)}
              placeholder="Tell patients about your clinic, treatment approach, and what makes you unique..."
              rows={6}
            />
          </div>
        )}

        {currentStepData.id === 'services' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                TMS Devices & Equipment
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newMachine}
                  onChange={(e) => setNewMachine(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('machines', newMachine))}
                  placeholder="e.g., Magstim Rapid²"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <PortalButton variant="secondary" size="sm" onClick={() => addToArray('machines', newMachine)}>
                  Add
                </PortalButton>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.machines || []).map((machine) => (
                  <span key={machine} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--paper2)] text-[var(--ink)] border border-[var(--line)]">
                    {machine}
                    <button onClick={() => removeFromArray('machines', machine)} className="text-[var(--muted)] hover:text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-2">
                Specialties / Conditions Treated
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('specialties', newSpecialty))}
                  placeholder="e.g., Major Depressive Disorder"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-white text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <PortalButton variant="secondary" size="sm" onClick={() => addToArray('specialties', newSpecialty)}>
                  Add
                </PortalButton>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.specialties || []).map((specialty) => (
                  <span key={specialty} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--paper2)] text-[var(--ink)] border border-[var(--line)]">
                    {specialty}
                    <button onClick={() => removeFromArray('specialties', specialty)} className="text-[var(--muted)] hover:text-red-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--line)] cursor-pointer hover:bg-[var(--paper2)] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.accepting_new_patients || false}
                  onChange={(e) => updateField('accepting_new_patients', e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--line)] text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-[var(--ink)]">Accepting New Patients</p>
                  <p className="text-xs text-[var(--muted)]">Visible to patients searching</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--line)] cursor-pointer hover:bg-[var(--paper2)] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.accepts_insurance || false}
                  onChange={(e) => updateField('accepts_insurance', e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--line)] text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-[var(--ink)]">Accepts Insurance</p>
                  <p className="text-xs text-[var(--muted)]">Accepts insurance plans</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {currentStepData.id === 'hours' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--line)] cursor-pointer hover:bg-[var(--paper2)] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.same_week_available || false}
                  onChange={(e) => updateField('same_week_available', e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--line)] text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-[var(--ink)]">Same-Week Appointments</p>
                  <p className="text-xs text-[var(--muted)]">Available within 7 days</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--line)] cursor-pointer hover:bg-[var(--paper2)] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.evening_hours || false}
                  onChange={(e) => updateField('evening_hours', e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--line)] text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-[var(--ink)]">Evening Hours</p>
                  <p className="text-xs text-[var(--muted)]">After 5pm appointments</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--line)] cursor-pointer hover:bg-[var(--paper2)] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.weekend_hours || false}
                  onChange={(e) => updateField('weekend_hours', e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--line)] text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-[var(--ink)]">Weekend Hours</p>
                  <p className="text-xs text-[var(--muted)]">Saturday & Sunday</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-[var(--line)] cursor-pointer hover:bg-[var(--paper2)] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.free_consultation || false}
                  onChange={(e) => updateField('free_consultation', e.target.checked)}
                  className="w-5 h-5 rounded border-[var(--line)] text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-medium text-[var(--ink)]">Free Consultation</p>
                  <p className="text-xs text-[var(--muted)]">Initial evaluation at no cost</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {currentStepData.id === 'locations' && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">Multiple Locations?</h3>
              <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
                If you have additional clinic branches, you can add them after setup. Your primary location was captured in the Basic Info step.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Add locations from your clinic dashboard</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    After completing setup, go to <strong>Clinic Settings &rarr; Locations</strong> to manage multiple branches.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-[var(--line)] text-center">
                <p className="text-sm font-medium text-[var(--ink)]">Free / Starter</p>
                <p className="text-xs text-[var(--muted)] mt-1">1 location (primary only)</p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--line)] text-center">
                <p className="text-sm font-medium text-[var(--ink)]">Professional</p>
                <p className="text-xs text-[var(--muted)] mt-1">Up to 3 locations</p>
              </div>
              <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-center">
                <p className="text-sm font-medium text-emerald-700">Clinic Group</p>
                <p className="text-xs text-emerald-600 mt-1">Unlimited locations</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <a
                href="/portal/clinic/?tab=locations"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Manage Locations After Setup
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 5.25L13.5 9l-3.75 3.75" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {currentStepData.id === 'billing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--ink)] mb-2">Choose Your Plan</h3>
            <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
              Start with our Free tier or upgrade for more features. You can change plans anytime.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
              <div className="p-6 rounded-xl border border-[var(--line)] bg-white">
                <h4 className="font-semibold text-[var(--ink)] mb-1">Free</h4>
                <p className="text-2xl font-bold text-[var(--ink)] mb-4">$0<span className="text-sm font-normal text-[var(--muted)]">/mo</span></p>
                <ul className="space-y-2 text-sm text-[var(--ink2)]">
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Basic listing</li>
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 1 photo</li>
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Contact form leads</li>
                </ul>
                <PortalButton variant="secondary" size="sm" className="w-full mt-4">Current Plan</PortalButton>
              </div>
              <div className="p-6 rounded-xl border-2 border-emerald-500 bg-emerald-50 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">Recommended</div>
                <h4 className="font-semibold text-[var(--ink)] mb-1">Starter</h4>
                <p className="text-2xl font-bold text-[var(--ink)] mb-4">$29<span className="text-sm font-normal text-[var(--muted)]">/mo</span></p>
                <ul className="space-y-2 text-sm text-[var(--ink2)]">
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Full listing</li>
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 5 photos</li>
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Instant leads</li>
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Basic analytics</li>
                </ul>
                <PortalButton variant="primary" size="sm" className="w-full mt-4">Upgrade</PortalButton>
              </div>
              <div className="p-6 rounded-xl border border-[var(--line)] bg-white">
                <h4 className="font-semibold text-[var(--ink)] mb-1">Professional</h4>
                <p className="text-2xl font-bold text-[var(--ink)] mb-4">$59<span className="text-sm font-normal text-[var(--muted)]">/mo</span></p>
                <ul className="space-y-2 text-sm text-[var(--ink2)]">
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Featured placement</li>
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 20 photos</li>
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Lead dashboard</li>
                  <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Advanced analytics</li>
                </ul>
                <PortalButton variant="secondary" size="sm" className="w-full mt-4">Upgrade</PortalButton>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] mt-6">You can upgrade or downgrade your plan at any time from the billing page.</p>
          </div>
        )}

        {currentStepData.id === 'complete' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-[var(--ink)] mb-2">You're All Set!</h3>
            <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
              Your clinic profile is complete. Patients can now find you on TMS List. You'll receive notifications when patients enquire about your services.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/portal/dashboard/"
                className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
              >
                Go to Dashboard
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <a
                href="/portal/clinic/"
                className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-[var(--ink)] bg-white border border-[var(--line)] hover:bg-[var(--paper2)] transition-all"
              >
                Edit Profile
              </a>
            </div>
          </div>
        )}
      </PortalCard>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <PortalButton
          variant="ghost"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </PortalButton>

        {currentStepData.id !== 'complete' ? (
          <PortalButton
            variant="primary"
            onClick={nextStep}
            loading={saving}
          >
            {currentStep === STEPS.length - 2 ? 'Complete Setup' : 'Continue'}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 5.25L13.5 9l-3.75 3.75" />
            </svg>
          </PortalButton>
        ) : (
          <PortalButton
            variant="primary"
            onClick={completeOnboarding}
            loading={saving}
          >
            Finish
          </PortalButton>
        )}
      </div>
    </div>
  );
}