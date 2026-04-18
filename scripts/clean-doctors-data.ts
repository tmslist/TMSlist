/**
 * Script to clean non-doctor profiles from doctors_data in clinics.json
 *
 * KEEPS:
 *   - MD, DO, PhD, PsyD credentials (any format: M.D., MD, m.d., etc.)
 *   - Psychiatrist, Neurologist, Neuropsychiatrist
 *   - Physician, Medical Director
 *   - Family Practice, GP, Internist, Pediatrician (physicians)
 *   - Nurse Practitioner (NP, APRN, PMHNP, FNP, DNP)
 *   - Physician Assistant (PA, PA-C)
 *   - Clinical Psychologist (PhD/PsyD)
 *
 * REMOVES:
 *   - Executives: CEO, COO, CFO, President, VP, Director (non-clinical)
 *   - Admin: Office Manager, Receptionist, Admin, Secretary
 *   - Clinical non-prescribers: RN, Therapist, Counselor, Social Worker, LMT
 *   - Business: HR, Marketing, Sales, IT, Billing, Finance
 *   - Non-medical: Pastor, Engineer, Lawyer, etc.
 */

import * as fs from 'fs';

const INPUT_FILE = 'src/data/clinics.json';
const OUTPUT_FILE = 'src/data/clinics.json';

function isDoctorProfile(name: string, title: string): boolean {
  const combined = `${name} ${title}`.toLowerCase();
  const nameLower = name.toLowerCase();
  const titleLower = (title || '').toLowerCase();

  // === CREDENTIAL CHECKS ===
  // Any MD/DO/PhD/PsyD format
  if (/[,.\s](md|do|m\.d\.|d\.o\.|ph\.?d|ps\.?y\.?d|d\.?n\.?p|mbbs|mrcpsych|mrcp)\b/i.test(combined)) return true;

  // "M.D." or "PhD" at end of name
  if (/[,\s](md|do|phd|psyd|dnp)\.?$/i.test(nameLower)) return true;

  // "MD" or "DO" etc. in the title by itself or with punctuation
  if (/\b(M\.?D\.?|D\.?O\.?|Ph\.?D\.?|Psy\.?D\.?|MBBS|MRCPSYCH|MRCP)\b/i.test(combined)) return true;

  // === SPECIALTY CHECKS ===
  // Core TMS-related specialties
  if (/psychiatrist|neurologist|neuropsychiatrist/i.test(combined)) return true;

  // Other physician specialties
  if (/internist|pediatrician|family\s*(?:practice|physician|medicine)|geriatrician|psychopharmacologist|anesthesiologist|cardiologist|oncologist|radiologist|surgeon|hospitalist|addiction\s*medicine|child\s*psychiatrist|geriatric\s*psychiatrist|rheumatologist|emergency\s*medicine|pulmonar|critical\s*care|hematology|endocrinology|nephrology|urology|orthopedic|obstetric|gynecology|dermatology|ophthalmology|thoracic/i.test(combined)) return true;

  // === PRESCRIBER ROLE CHECKS ===
  if (/nurse\s*practitioner|np\b|pmhnp|fnp|anp|agnp|bcp|aprn|dnp|pa-?c|physician\s*assistant/i.test(combined)) return true;

  // === TITLE-BASED DOCTOR CHECKS ===
  // "medical doctor", "doctor of medicine", "doctor" in title with context
  if (/\b(medical\s*doctor|doctor\s*of\s*medicine|doctor\b)/i.test(titleLower) &&
      !/recruiter|recruitment|relations|director|manager|assistant/i.test(combined)) return true;

  // "physician" in title (standalone or with credentials)
  if (/^physician$|,\s*physician$|physician\s*(?:and|&)|\bphysician\b.*(?:md|do|abpn)/i.test(combined) &&
      !/recruiter|recruitment|relations/i.test(combined)) return true;

  // "medical director" (clinical, not executive)
  if (/medical\s*director/i.test(combined) && !/executive|chief|vice\s*pres/i.test(combined)) return true;

  // === NAME-BASED DOCTOR CHECKS ===
  // "Dr." prefix in name
  if (/^dr\.?\s|^\s*dr\.?\s|^dr\.\s/i.test(nameLower)) return true;

  // Name ends with credentials
  if (/[,\s](md|do|phd|psyd|dnp)\s*$|,\s*(md|do|phd)\s*$/i.test(nameLower)) return true;

  // === BORDERLINE — keep if clinical context ===
  // Clinical psychologist with credentials
  if (/clinical\s*psychologist/i.test(combined) && /\b(phd|psyd|psy\.d)\b/i.test(combined)) return true;

  // === CATCH ALL DOCTOR ===
  // "Doctor" anywhere with no non-doctor indicators
  if (/\bdoctor\b/i.test(combined)) {
    const nonDoctorIndicators = /recruiter|recruitment|relations|therapist|counselor|social\s*worker|owner|coordinator|manager\b|director\b|executive|assistant|admin|clerk/i;
    if (!nonDoctorIndicators.test(combined)) return true;
  }

  return false;
}

function isNonDoctorProfile(name: string, title: string): boolean {
  const combined = `${name} ${title}`.toLowerCase();

  const nonDoctorPatterns: Array<[RegExp, string]> = [
    // Executives
    [/\b(ceo|coo|cfo|cio|cto|chief\s+(?!medical|clinical).*|president(?!\s+(?:and\s+|of\s+)?medical)|vice\s*pres(?:ident)?|vp\b|executive\s*director|deputy|assistant\s*vice|senior\s*vice|chair|chairman|chairperson)\b/i, 'executive'],
    // Non-clinical directors
    [/\bdirector\b(?!.*(?:clinical|medical|tms|treatment))/i, 'non-clinical director'],
    [/director\s+of\s+(?:nursing|human\s*resources|finance|facilities|purchasing|marketing|development|pharmacy|radiology|grants|claims|revenue|compliance|quality|outreach|communications|archi|museum|library|housing|parks|transplant|emergency|cardiac|orthopedic|sports|early|children|community|materials|regulatory|acute|surgical|mixed|plant|maintenance)/i, 'non-clinical director of...'],
    // Admin
    [/\b(office\s*manager|clinic\s*manager|practice\s*manager|front\s*(?:desk|office)|receptionist|admissions|registration|patient\s*(?:access|liaison|experience|educator)|scheduler|secretary|executive\s*assistant|senior\s*assistant|admin|administrative\s*assistant|credentialing|referral|coordinator|supervisor|superintendent|team\s*lead|clinic\s*leader|center\s*director|programs?\s*director)\b/i, 'admin'],
    // Business/Finance/HR/IT
    [/\b(hr\b|human\s*resources|recruiter|talent\s*acquisition|marketing|sales|business\s*development|accounting|bookkeeper|controller|financial\s*analyst|finance\s*executive|accountant|billing|specialist|coder|medical\s*billing|reimbursement|coding|it\b|information\s*technology|software|developer|programmer|systems?\s*(?:analyst|administrator|engineer|support)|network|database|webmaster|project\s*manager|erp|tech\s*lead|data\s*architect|it\s*director|it\s*manager|solutions\s*architect|security\s*officer|help\s*desk|technology\s*director)\b/i, 'business/IT'],
    // Non-prescriber clinical
    [/\b(therapist(?!\s*(?:at|for|in|on).*md)|counselor|psychotherapist|social\s*worker|lmft|lcsw|lpc|msw\b|rn\b|registered\s*nurse(?!\s*(?:practitioner|clinician|manager|director))|lpn|lvn|cna|nursing\s*assistant|medical\s*assistant(?!\s*(?:to\s+physician))|behavioral\s*health\s*(?:tech|technician|worker|intervention)|peer\s*support|care\s*coordinator|triage|mh\s*worker|mental\s*health\s*worker)\b/i, 'non-prescriber clinical'],
    // TMS/Lab tech
    [/\b(tms\s*tech|tms\s*technician|technician(?!.*md)|technologist|radiology\s*tech|mri\s*tech|lab\s*(?:tech|director|manager)|x-?ray\s*tech|cardio\s*tech|ultrasound)\b/i, 'tech'],
    // Non-medical professionals
    [/\b(pastor|minister|priest|clergy|chaplain|attorney|lawyer|judge|coroner|sheriff|deputy|patrol|police|fire\s*fighter|emt|paramedic|commissioner|mayor|council|mortgage|loan\s*officer|broker|stockbroker|musician|yoga|fitness\s*professional|graphic\s*designer|dental|hygienist|chiropractor(?!.*md)|physical\s*therapist|pt\b|occupational\s*therap|speech(?:\s*language)?\s*pathologist|massage\s*therapist|aesthetician|recreation|volunteer|ranger|maintenance|gardener|chef|dietary|farm|mechanic|flight\s*paramedic|respiratory\s*therapist)\b/i, 'non-medical professional'],
    // Business roles
    [/\b(founder|co-?founder|owner(?!\s*(?:md|physician|psychiatrist|medical))|partner|shareholder|member\s*(?:technical|staff)|associate(?!\s*(?:physician|medical))|senior\s*(?!physician|psychiatrist,|md\b)|junior|intern(?!\s*(?:physician|md|psychiatrist))|student|trainee|fellow(?!\s*(?:physician|md))|resident(?!\s*(?:physician|md|psychiatrist))|principal(?!\s*(?:investigator|physician))|managing\s*(?:principal|partner|member))\b/i, 'business role'],
    // Operational
    [/\b(compliance|medical\s*records|him\b|health\s*information|executive\s*admin|hospital\s*admin|purchasing|inventory|procurement|logistics|warehouse|facilities|plant\s*operations|security|safety|transportation|aviation|automotive|construction|engineering(?!.*medical)|mechanical|electrical|civil|environmental|sanitation)\b/i, 'operational'],
    // Catch-alls
    [/\b(clerk|usher|attendant|porter|janitor|driver|operator|supplier|vendor|lead$)/i, 'support staff'],
  ];

  for (const [pattern, label] of nonDoctorPatterns) {
    if (pattern.test(combined)) {
      // Override if they have doctor credentials
      const hasDoctorCredential = /[,\s](md|do|m\.d\.|d\.o\.|ph\.?d|ps\.?y\.?d|d\.?n\.?p|mbbs)\b/i.test(combined);
      if (hasDoctorCredential) continue;

      // Override for clinical director
      if (/director/i.test(combined) && /clinical|tms|treatment|business\s*development/i.test(combined)) continue;

      return true;
    }
  }

  return false;
}

function main() {
  console.log('Loading clinics data...');
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

  let totalProfilesBefore = 0;
  let totalProfilesAfter = 0;
  let profilesRemoved = 0;
  let profilesKept = 0;
  let clinicsWithNoDoctors = 0;
  const removedExamples: Array<{ name: string; title: string; clinic: string }> = [];
  const keptExamples: Array<{ name: string; title: string; clinic: string }> = [];

  const cleanedData = data.map((clinic: any) => {
    if (!clinic.doctors_data || clinic.doctors_data.length === 0) {
      return clinic;
    }

    totalProfilesBefore += clinic.doctors_data.length;

    const cleanedDoctors = clinic.doctors_data.filter((doc: any) => {
      const name = doc.name || '';
      const title = doc.title || '';

      const isDoctor = isDoctorProfile(name, title);
      const isNonDoctor = isNonDoctorProfile(name, title);

      if (isDoctor) {
        profilesKept++;
        if (keptExamples.length < 25) {
          keptExamples.push({ name, title, clinic: clinic.name });
        }
        return true;
      }

      if (isNonDoctor) {
        profilesRemoved++;
        if (removedExamples.length < 40) {
          removedExamples.push({ name, title, clinic: clinic.name });
        }
        return false;
      }

      // Uncertain — keep but log
      profilesKept++;
      if (keptExamples.length < 25) {
        keptExamples.push({ name, title, clinic: clinic.name });
      }
      return true;
    });

    totalProfilesAfter += cleanedDoctors.length;

    if (cleanedDoctors.length === 0) {
      clinicsWithNoDoctors++;
    }

    return { ...clinic, doctors_data: cleanedDoctors };
  });

  console.log('\n========== CLEANUP REPORT ==========');
  console.log(`Total clinics: ${data.length}`);
  console.log(`Profiles BEFORE cleanup: ${totalProfilesBefore}`);
  console.log(`Profiles AFTER cleanup: ${totalProfilesAfter}`);
  console.log(`Profiles removed: ${profilesRemoved} (${totalProfilesBefore > 0 ? ((profilesRemoved / totalProfilesBefore) * 100).toFixed(1) : 0}%)`);
  console.log(`Profiles kept: ${profilesKept}`);
  console.log(`Clinics with NO doctors after cleanup: ${clinicsWithNoDoctors}`);

  console.log('\n--- Sample KEPT profiles ---');
  keptExamples.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name} | ${r.title} | ${r.clinic}`);
  });

  console.log('\n--- Sample REMOVED profiles ---');
  removedExamples.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.name} | ${r.title} | ${r.clinic}`);
  });

  console.log('\nWriting cleaned data...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleanedData, null, 2), 'utf8');
  console.log(`Done! Written to ${OUTPUT_FILE}`);
}

main();
