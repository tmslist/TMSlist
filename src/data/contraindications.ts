// TMS contraindications checklist
export interface Contraindication {
  id: string;
  question: string;
  detail: string;
  severity: 'caution' | 'relative' | 'absolute';
}

export const contraindications: Contraindication[] = [
  {
    id: 'metal',
    question: 'Do you have metal in or near your head?',
    detail: 'Metallic implants, aneurysm clips, cochlear implants, deep brain stimulators, or metal fragments near the head are absolute contraindications.',
    severity: 'absolute',
  },
  {
    id: 'seizure',
    question: 'Do you have a history of seizure disorder or epilepsy?',
    detail: 'Prior seizures or epilepsy are a relative contraindication. Your physician will weigh the risk vs. benefit.',
    severity: 'relative',
  },
  {
    id: 'pacemaker',
    question: 'Do you have an implanted cardiac device (pacemaker, ICD)?',
    detail: 'Implanted electronic cardiac devices are a relative contraindication. TMS may interfere with device function.',
    severity: 'relative',
  },
  {
    id: 'pregnancy',
    question: 'Are you currently pregnant?',
    detail: 'Pregnancy is a relative contraindication. Safety data in pregnancy is limited; discuss with your physician.',
    severity: 'caution',
  },
  {
    id: 'medications',
    question: 'Are you taking medications that lower seizure threshold?',
    detail: 'Some antidepressants (bupropion), antibiotics, and other drugs may increase seizure risk during TMS.',
    severity: 'caution',
  },
];

export function getContraindicationResult(answers: Record<string, boolean>): {
  status: 'safe' | 'caution' | 'consult' | 'not-recommended';
  concerns: string[];
} {
  const concerns: string[] = [];

  for (const ci of contraindications) {
    if (ci.severity === 'absolute' && answers[ci.id]) {
      return {
        status: 'not-recommended',
        concerns: [`Absolute contraindication: ${ci.question}`],
      };
    }
    if (ci.severity === 'relative' && answers[ci.id]) {
      concerns.push(`Relative contraindication: ${ci.question}`);
    }
    if (ci.severity === 'caution' && answers[ci.id]) {
      concerns.push(`Precaution: ${ci.question}`);
    }
  }

  if (concerns.length > 0) {
    return { status: concerns.some(c => c.includes('Relative')) ? 'consult' : 'caution', concerns };
  }

  return { status: 'safe', concerns: [] };
}
