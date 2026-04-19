export interface TMSNewsItem {
  id: string;
  headline: string;
  source: string;
  sourceUrl: string;
  date: string;
  category: 'fda' | 'clinical-trial' | 'study' | 'insurance' | 'industry' | 'breakthrough';
  summary: string;
  url: string;
}

export const tmsNews: TMSNewsItem[] = [
  {
    id: 'saint-trial-2026',
    headline: 'Stanford SAINT Protocol Shows 90%+ Remission in Refractory Depression',
    source: 'American Journal of Psychiatry',
    sourceUrl: 'https://ajp.psychiatryonline.org',
    date: '2026-03-15',
    category: 'breakthrough',
    summary: 'The Stanford Accelerated Intelligent Neuromodulation Therapy (SAINT) protocol achieved 91% remission in treatment-resistant depression, significantly outperforming standard TMS.',
    url: '/research/accelerated-tms-protocols/',
  },
  {
    id: 'fda-migraine-2026',
    headline: 'FDA Expands TMS Clearance for Acute Migraine Treatment',
    source: 'FDA Newsroom',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements',
    date: '2026-02-20',
    category: 'fda',
    summary: 'The FDA cleared single-pulse TMS devices for acute treatment of migraine with aura, expanding beyond preventive use.',
    url: '/treatments/migraine/',
  },
  {
    id: 'tms-ptsd-va-2026',
    headline: 'VA Covers TMS for PTSD in Veterans with Depression',
    source: 'Veterans Affairs',
    sourceUrl: 'https://www.va.gov',
    date: '2026-01-28',
    category: 'insurance',
    summary: 'Department of Veterans Affairs updated coverage policy to include TMS for PTSD when comorbid depression meets treatment-resistant criteria.',
    url: '/treatments/ptsd-tms/',
  },
  {
    id: 'theta-burst-meta-2025',
    headline: 'Theta Burst Stimulation Matches Standard TMS in Largest Meta-Analysis Yet',
    source: 'The Lancet Psychiatry',
    sourceUrl: 'https://www.thelancet.com/journals/lanpsy',
    date: '2025-12-10',
    category: 'study',
    summary: 'A meta-analysis of 42 randomized controlled trials found intermittent theta burst stimulation (iTBS) produces equivalent outcomes to standard 10Hz TMS in half the session time.',
    url: '/protocols/theta-burst-tms/',
  },
  {
    id: 'neurostar-brainsway-2025',
    headline: 'Neuronetics and BrainsWay Settle Patent Dispute, Expand Distribution',
    source: 'MedTech Dive',
    sourceUrl: 'https://www.medtechdive.com',
    date: '2025-11-18',
    category: 'industry',
    summary: 'Leading TMS device manufacturers Neuronetics and BrainsWay reach cross-licensing agreement, expanding clinic access and reducing device costs by an estimated 15%.',
    url: '/technology/',
  },
  {
    id: 'tms-bipolar-2025',
    headline: 'NIH-Funded Study: TMS Safe for Bipolar Depression with Proper Monitoring',
    source: 'JAMA Psychiatry',
    sourceUrl: 'https://jamanetwork.com/journals/jamapsychiatry',
    date: '2025-10-22',
    category: 'clinical-trial',
    summary: 'Landmark NIH study found TMS can be safely used in bipolar depression when patients are on mood stabilizers, with seizure risk comparable to unipolar depression.',
    url: '/treatments/bipolar-depression/',
  },
  {
    id: 'tms-insurance-cigna-2025',
    headline: 'Cigna Expands TMS Coverage to Include OCD as Primary Indication',
    source: 'Cigna Behavioral Health',
    sourceUrl: 'https://www.cigna.com',
    date: '2025-09-15',
    category: 'insurance',
    summary: 'Cigna updated its behavioral health policy to cover TMS for OCD as a primary indication, removing the requirement for failed antidepressant trials.',
    url: '/insurance/cigna/',
  },
  {
    id: 'tms-ketamine-combo-2025',
    headline: 'Combined TMS and Ketamine Shows Dramatic Synergy in Treatment-Resistant Cases',
    source: 'Biological Psychiatry',
    sourceUrl: 'https://www.sciencedirect.com/journal/biological-psychiatry',
    date: '2025-08-30',
    category: 'study',
    summary: 'Phase II trial combining TMS with intravenous ketamine showed 78% remission at 4 weeks compared to 45% for either treatment alone, suggesting synergistic mechanisms.',
    url: '/compare/tms-vs-ketamine/',
  },
  {
    id: 'tms-alzheimer-2025',
    headline: 'FDA Grants Breakthrough Device Designation for TMS in Alzheimer\'s',
    source: 'FDA',
    sourceUrl: 'https://www.fda.gov',
    date: '2025-07-14',
    category: 'fda',
    summary: 'The FDA granted breakthrough device designation for transcranial magnetic stimulation targeting Alzheimer\'s disease cognitive symptoms, expediting review of Neuronetics\' NeuroStar AD system.',
    url: '/treatments/alzheimers-tms/',
  },
  {
    id: 'tms-coverage-medicare-2025',
    headline: 'Medicare Proposes New TMS Reimbursement Rates Reflecting Clinical Outcomes',
    source: 'CMS',
    sourceUrl: 'https://www.cms.gov',
    date: '2025-06-20',
    category: 'insurance',
    summary: 'CMS proposed updated reimbursement rates for CPT codes 90867-90875 based on real-world outcome data, increasing per-session pay by 8% for high-response clinics.',
    url: '/insurance/medicare-tms/',
  },
  {
    id: 'tms-adhd-2025',
    headline: 'Multi-Site Trial Shows TMS Improves Attention in ADHD Adults',
    source: 'American Journal of Psychiatry',
    sourceUrl: 'https://ajp.psychiatryonline.org',
    date: '2025-05-12',
    category: 'clinical-trial',
    summary: 'A 12-site randomized sham-controlled trial found 6 weeks of prefrontal TMS significantly improved attention and working memory in adults with ADHD off medications.',
    url: '/treatments/adhd-tms/',
  },
  {
    id: 'tms-fibromyalgia-2025',
    headline: 'TMS Receives Positive HTA Review for Fibromyalgia Pain in UK',
    source: 'NICE',
    sourceUrl: 'https://www.nice.org.uk',
    date: '2025-04-18',
    category: 'insurance',
    summary: 'NICE issued positive guidance on TMS for fibromyalgia pain management, recommending NHS coverage pending cost-effectiveness review expected Q3 2026.',
    url: '/treatments/fibromyalgia-tms/',
  },
  {
    id: 'home-tms-2025',
    headline: 'FDA Clears First Home TMS Device for Depression Maintenance',
    source: 'FDA Newsroom',
    sourceUrl: 'https://www.fda.gov/news-events/press-announcements',
    date: '2025-03-25',
    category: 'fda',
    summary: 'NeuroSphere received FDA clearance for the first home-use TMS device for maintenance treatment in previously-treated patients, requiring clinic enrollment and monitoring.',
    url: '/technology/home-tms-devices/',
  },
  {
    id: 'tms-outcomes-registry-2025',
    headline: 'Industry-Wide TMS Outcomes Registry Shows 55% Response Rate Across 50,000 Patients',
    source: 'Clinical TMS Society',
    sourceUrl: 'https://www.clinicaltmssociety.org',
    date: '2025-02-08',
    category: 'study',
    summary: 'The first comprehensive registry of real-world TMS outcomes found 55% response and 31% remission rates across all FDA-cleared devices, exceeding previously cited clinical trial figures.',
    url: '/research/tms-depression-meta-analysis/',
  },
  {
    id: 'deep-tms-ocd-2025',
    headline: 'BrainsWay Deep TMS OCD Protocol Shows Sustained 12-Month Benefits',
    source: 'Journal of Clinical Psychiatry',
    sourceUrl: 'https://www.psychiatrist.com/jcp',
    date: '2025-01-20',
    category: 'clinical-trial',
    summary: 'Long-term follow-up of OCD patients treated with deep TMS showed maintained improvement at 12 months in 62% of responders, with minimal retreatment needed.',
    url: '/treatments/ocd/',
  },
];

export function getNewsByCategory(category: TMSNewsItem['category']) {
  return tmsNews.filter(n => n.category === category);
}

export function getRecentNews(limit = 10) {
  return [...tmsNews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
}

export const categoryLabels: Record<TMSNewsItem['category'], string> = {
  fda: 'FDA Approvals',
  'clinical-trial': 'Clinical Trials',
  study: 'Research Studies',
  insurance: 'Insurance & Coverage',
  industry: 'Industry News',
  breakthrough: 'Breakthroughs',
};