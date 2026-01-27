
import { ALL_VERIFIED_CLINICS } from '../src/data/verified-clinics';
import { ALL_REAL_CLINICS } from '../src/data/real-clinics';
import fs from 'fs';
import path from 'path';

// Load clinics.json manually since importing large JSON might be slow or typed incorrectly
const clinicsJsonPath = path.join(process.cwd(), 'src/data/clinics.json');
const clinicsJsonRaw = fs.readFileSync(clinicsJsonPath, 'utf-8');
const clinicsJson = JSON.parse(clinicsJsonRaw);

console.log('--- AUDIT REPORT ---');

// Audit Verified Clinics (verified-clinics.ts)
console.log('\n[src/data/verified-clinics.ts]');
const verifiedClinicsCount = ALL_VERIFIED_CLINICS.length;
const verifiedClinicsVerifiedCount = ALL_VERIFIED_CLINICS.filter(c => c.verified).length;
console.log(`Total entries: ${verifiedClinicsCount}`);
console.log(`Verified entries: ${verifiedClinicsVerifiedCount}`);

let verifiedDoctorsCount = 0;
ALL_VERIFIED_CLINICS.forEach(c => {
    if (c.doctors) {
        verifiedDoctorsCount += c.doctors.length;
    }
});
console.log(`Total doctors listed: ${verifiedDoctorsCount}`);


// Audit Real Clinics (real-clinics.ts)
console.log('\n[src/data/real-clinics.ts]');
const realClinicsCount = ALL_REAL_CLINICS.length;
const realClinicsVerifiedCount = ALL_REAL_CLINICS.filter(c => c.verified).length;
const operationalClinicsCount = ALL_REAL_CLINICS.filter(c => c.businessStatus === 'OPERATIONAL').length;

console.log(`Total entries: ${realClinicsCount}`);
console.log(`Verified entries: ${realClinicsVerifiedCount}`);
console.log(`Operational entries: ${operationalClinicsCount}`);

// Check for overlaps/duplicates based on slug
const verifiedSlugs = new Set(ALL_VERIFIED_CLINICS.map(c => c.slug));
const realSlugs = new Set(ALL_REAL_CLINICS.map(c => c.slug));
const allSlugs = new Set([...verifiedSlugs, ...realSlugs]);

console.log(`\nUnique slugs across both lists: ${allSlugs.size}`);

// Data Quality Checks
console.log('\n[Data Quality]');
const missingImages = ALL_REAL_CLINICS.filter(c => !c.photo);
console.log(`Real Clinics missing photos: ${missingImages.length}`);

// Audit clinics.json
console.log('\n[src/data/clinics.json]');
const jsonTotal = clinicsJson.length;
const jsonVerified = clinicsJson.filter((c: any) => c.verified).length;
let jsonDoctors = 0;
clinicsJson.forEach((c: any) => {
    if (c.verified && c.doctors_data) {
        jsonDoctors += c.doctors_data.length;
    }
});

console.log(`Total entries: ${jsonTotal}`);
console.log(`Verified entries: ${jsonVerified}`);
console.log(`Doctors in verified clinics: ${jsonDoctors}`);

console.log('\n--- END REPORT ---');
