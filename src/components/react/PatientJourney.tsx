import { CheckIcon } from './Icons';

const steps = [
  { title: 'Enquiry Submitted', desc: 'Your request has been sent to the clinic.', icon: '✓' },
  { title: 'Clinic Reviews Request', desc: 'The clinic will review your information and reach out.', icon: '2' },
  { title: 'Initial Consultation', desc: 'Meet with a TMS specialist to discuss your treatment plan.', icon: '3' },
  { title: 'TMS Mapping Session', desc: 'Brain mapping to customize your treatment protocol.', icon: '4' },
  { title: 'Treatment Begins', desc: 'Typically 36 sessions over 6-9 weeks, 19 minutes each.', icon: '5' },
  { title: 'Follow-up & Maintenance', desc: 'Regular check-ins and optional maintenance sessions.', icon: '6' },
];

export default function PatientJourney({ currentStep = 1 }: { currentStep?: number }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--line)] p-6">
      <h3 className="text-lg font-semibold text-[var(--ink)] mb-6">Your TMS Journey</h3>
      <div className="space-y-0">
        {steps.map((step, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isComplete ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[var(--ink)] text-white' : 'bg-[var(--paper2)] text-[var(--muted)]'}`}>
                  {isComplete ? '✓' : step.icon}
                </div>
                {i < steps.length - 1 && <div className={`w-0.5 h-12 ${isComplete ? 'bg-emerald-300' : 'bg-[var(--paper2)]'}`} />}
              </div>
              <div className="pb-8">
                <p className={`font-medium ${isComplete || isCurrent ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}>{step.title}</p>
                <p className="text-sm text-[var(--muted)] mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
