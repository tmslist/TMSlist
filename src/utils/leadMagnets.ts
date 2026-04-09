/**
 * Lead Magnet definitions for TMS providers/clinic owners.
 * Each magnet has a landing page, gated download, and funnel entry.
 */

export interface LeadMagnet {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'billing' | 'marketing' | 'operations' | 'clinical' | 'compliance' | 'growth';
  format: 'PDF Guide' | 'Checklist' | 'Template Kit' | 'Calculator' | 'Playbook' | 'Cheat Sheet';
  pageCount?: string;
  benefits: string[];
  tableOfContents: string[];
  targetAudience: string;
  accent: string; // tailwind color for theming
}

export const LEAD_MAGNETS: LeadMagnet[] = [
  {
    id: 'tms-billing-cpt',
    slug: 'tms-billing-cpt-codes-2026',
    title: '2026 TMS Billing & CPT Codes Cheat Sheet',
    subtitle: 'Stop leaving money on the table',
    description: 'The complete reference for TMS billing codes, modifiers, and payer-specific rules. Includes the latest 2026 CPT code updates, common denial reasons, and appeal letter templates.',
    category: 'billing',
    format: 'Cheat Sheet',
    pageCount: '12 pages',
    benefits: [
      'All current TMS CPT codes (90867, 90868, 90869) with correct modifiers',
      'Payer-specific billing rules for Medicare, BCBS, Aetna, Cigna, UHC',
      'Top 10 denial reasons and how to prevent them',
      '3 appeal letter templates with proven success rates',
      'Billing workflow checklist for new TMS programs',
    ],
    tableOfContents: [
      'TMS CPT Code Reference Table',
      'Modifier Usage Guide (59, 76, 77, XE, XS)',
      'Medicare LCD/NCD Requirements',
      'Commercial Payer Authorization Matrix',
      'Common Denials & Prevention Strategies',
      'Appeal Letter Templates',
      'Billing Workflow Checklist',
    ],
    targetAudience: 'TMS clinic administrators, billing specialists, and practice managers',
    accent: '#059669',
  },
  {
    id: 'patient-acquisition',
    slug: 'tms-patient-acquisition-playbook',
    title: 'TMS Patient Acquisition Playbook',
    subtitle: 'Fill your treatment chairs in 90 days',
    description: 'A step-by-step marketing playbook designed specifically for TMS clinics. Learn the exact strategies top-performing clinics use to generate 20+ new patient consultations per month.',
    category: 'marketing',
    format: 'Playbook',
    pageCount: '28 pages',
    benefits: [
      'The 5-channel patient acquisition framework used by top TMS clinics',
      'Google Ads templates with TMS-specific keywords and ad copy',
      'Referral program blueprint for psychiatrists and primary care',
      'Social media content calendar (30 days of posts)',
      'Patient testimonial collection and deployment strategy',
      'ROI tracking spreadsheet to measure cost per patient',
    ],
    tableOfContents: [
      'Chapter 1: Understanding the TMS Patient Journey',
      'Chapter 2: Search Engine Optimization for TMS',
      'Chapter 3: Google Ads Campaign Setup',
      'Chapter 4: Physician Referral Network Building',
      'Chapter 5: Social Media & Content Marketing',
      'Chapter 6: Review Generation & Reputation Management',
      'Chapter 7: Measuring ROI & Optimizing Spend',
    ],
    targetAudience: 'TMS clinic owners and marketing managers',
    accent: '#2563eb',
  },
  {
    id: 'preauth-templates',
    slug: 'tms-prior-authorization-template-kit',
    title: 'TMS Prior Authorization Template Kit',
    subtitle: 'Get approved faster, denied less',
    description: 'Pre-built authorization request templates for every major insurance carrier. Includes clinical necessity letters, peer-to-peer call scripts, and denial appeal workflows.',
    category: 'billing',
    format: 'Template Kit',
    pageCount: '18 pages',
    benefits: [
      'Prior auth request templates for 8 major payers',
      'Clinical necessity letter of medical necessity (LMN) template',
      'Peer-to-peer review call script and preparation checklist',
      'Step-by-step denial appeal workflow',
      'PHQ-9/GAD-7 documentation best practices',
      'Medication failure documentation template',
    ],
    tableOfContents: [
      'Prior Authorization Request Templates',
      'Letter of Medical Necessity (LMN)',
      'Medication Trial Documentation Form',
      'Peer-to-Peer Review Preparation',
      'Denial Appeal Workflow',
      'Insurance-Specific Requirements Matrix',
    ],
    targetAudience: 'TMS coordinators, billing staff, and clinic administrators',
    accent: '#7c3aed',
  },
  {
    id: 'clinic-startup',
    slug: 'starting-a-tms-clinic-business-plan',
    title: 'TMS Clinic Business Plan Template',
    subtitle: 'From zero to treating patients',
    description: 'Everything you need to plan, launch, and grow a TMS therapy practice. Includes financial projections, equipment comparison, staffing models, and regulatory checklists by state.',
    category: 'growth',
    format: 'Template Kit',
    pageCount: '34 pages',
    benefits: [
      '3-year financial projection model with realistic assumptions',
      'TMS device comparison matrix (NeuroStar vs BrainsWay vs MagVenture)',
      'Staffing model: who you need and when to hire',
      'Facility requirements and room setup guide',
      'State-by-state regulatory requirements',
      'Insurance credentialing timeline and checklist',
      'Break-even analysis calculator',
    ],
    tableOfContents: [
      'Part 1: Market Analysis & Opportunity',
      'Part 2: Device Selection & Procurement',
      'Part 3: Facility Setup & Compliance',
      'Part 4: Staffing & Training',
      'Part 5: Insurance Credentialing',
      'Part 6: Financial Projections',
      'Part 7: Marketing Launch Plan',
      'Part 8: Operational Playbook',
    ],
    targetAudience: 'Psychiatrists and healthcare entrepreneurs starting a TMS practice',
    accent: '#0f172a',
  },
  {
    id: 'outcome-tracking',
    slug: 'tms-patient-outcome-tracking-system',
    title: 'TMS Patient Outcome Tracking System',
    subtitle: 'Measure what matters clinically',
    description: 'A structured system for tracking patient outcomes across the full TMS treatment course. Includes PHQ-9 tracking sheets, treatment response criteria, and outcome reporting templates for insurance.',
    category: 'clinical',
    format: 'Template Kit',
    pageCount: '16 pages',
    benefits: [
      'Session-by-session PHQ-9 tracking spreadsheet',
      'Treatment response classification criteria (response, remission, non-response)',
      'Patient progress note templates for each session',
      'Mid-course evaluation checklist (session 10-15)',
      'End-of-treatment outcome summary template',
      'Outcome data reporting for insurance reauthorization',
    ],
    tableOfContents: [
      'Baseline Assessment Protocol',
      'Session Tracking Spreadsheet',
      'PHQ-9 Progress Chart',
      'Mid-Course Evaluation',
      'Treatment Completion Summary',
      'Insurance Outcome Reporting',
      'Maintenance Protocol Decision Tree',
    ],
    targetAudience: 'TMS technicians, treating psychiatrists, and clinical coordinators',
    accent: '#dc2626',
  },
  {
    id: 'staff-training',
    slug: 'tms-technician-training-checklist',
    title: 'TMS Technician Training & Competency Checklist',
    subtitle: 'Train your team with confidence',
    description: 'A comprehensive training program for TMS technicians covering device operation, patient safety protocols, motor threshold determination, and emergency procedures.',
    category: 'operations',
    format: 'Checklist',
    pageCount: '14 pages',
    benefits: [
      'Step-by-step training curriculum (40-hour program)',
      'Motor threshold determination protocol',
      'Patient safety screening checklist (contraindications)',
      'Emergency seizure response protocol',
      'Competency assessment rubric',
      'Annual recertification checklist',
    ],
    tableOfContents: [
      'Module 1: TMS Fundamentals & Neuroscience Basics',
      'Module 2: Device Operation & Maintenance',
      'Module 3: Motor Threshold Determination',
      'Module 4: Treatment Delivery Protocol',
      'Module 5: Patient Safety & Screening',
      'Module 6: Emergency Procedures',
      'Module 7: Documentation & Compliance',
      'Competency Assessment Form',
    ],
    targetAudience: 'Clinic managers, TMS technicians, and training coordinators',
    accent: '#ea580c',
  },
  {
    id: 'state-regulations',
    slug: 'tms-state-regulations-guide-2026',
    title: 'State-by-State TMS Regulations Guide 2026',
    subtitle: 'Stay compliant in every state',
    description: 'A comprehensive guide to TMS therapy regulations across all 50 states. Covers who can administer TMS, supervision requirements, facility licensing, and Medicaid coverage rules.',
    category: 'compliance',
    format: 'PDF Guide',
    pageCount: '22 pages',
    benefits: [
      'Who can administer TMS in each state (MD, DO, NP, PA, technician)',
      'Physician supervision requirements by state',
      'Facility licensing and accreditation needs',
      'State Medicaid TMS coverage policies',
      'Telehealth/remote supervision rules for TMS',
      'Malpractice insurance considerations',
    ],
    tableOfContents: [
      'Overview: Federal vs State TMS Regulations',
      'Administration Authority by State',
      'Supervision Requirements Matrix',
      'Facility Licensing Requirements',
      'State Medicaid Coverage Policies',
      'Telehealth & Remote Supervision',
      'Malpractice & Liability',
      'State-by-State Reference Cards (50 states)',
    ],
    targetAudience: 'Clinic owners, compliance officers, and healthcare attorneys',
    accent: '#0891b2',
  },
  {
    id: 'referral-network',
    slug: 'building-tms-referral-network',
    title: 'Building Your TMS Referral Network',
    subtitle: 'Turn colleagues into your best lead source',
    description: 'A practical guide to building and nurturing a physician referral network for your TMS practice. Includes outreach templates, lunch-and-learn presentation decks, and referral tracking systems.',
    category: 'marketing',
    format: 'Playbook',
    pageCount: '20 pages',
    benefits: [
      'Identify and prioritize top referral sources in your area',
      'Email and letter outreach templates for psychiatrists and PCPs',
      'Lunch-and-learn presentation outline (with talking points)',
      'Referral tracking spreadsheet and follow-up cadence',
      'Co-management agreement template',
      'Quarterly referral report template for partners',
    ],
    tableOfContents: [
      'Chapter 1: Mapping Your Referral Landscape',
      'Chapter 2: The Outreach Campaign',
      'Chapter 3: The Lunch-and-Learn Playbook',
      'Chapter 4: Building the Relationship',
      'Chapter 5: Referral Tracking & Attribution',
      'Chapter 6: Co-Management Protocols',
      'Chapter 7: Scaling Your Network',
    ],
    targetAudience: 'TMS clinic owners, business development managers, and physician liaisons',
    accent: '#4f46e5',
  },
];

export function getLeadMagnetBySlug(slug: string): LeadMagnet | undefined {
  return LEAD_MAGNETS.find(m => m.slug === slug);
}

export function getLeadMagnetsByCategory(category: LeadMagnet['category']): LeadMagnet[] {
  return LEAD_MAGNETS.filter(m => m.category === category);
}
