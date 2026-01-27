/**
 * Process Clinic Submissions
 * 
 * This script takes new clinic submissions and merges them into the main clinics.json file.
 * It can be run manually or automated via CI/CD.
 * 
 * Usage:
 *   npx ts-node scripts/process_submissions.ts ./new_submissions.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface Submission {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    website: string;
    description?: string;
    machines: string[];
    treatments: string[];
    insurances: string[];
    media?: {
        logo_url?: string;
        hero_image_url?: string;
        video_url?: string;
    };
    google_business_profile?: {
        embed_url?: string;
    };
    doctor?: {
        name?: string;
        title?: string;
        image_url?: string;
        years_experience?: number;
    };
    created_by: {
        name: string;
        email: string;
        submitted_at: string;
        source: string;
    };
}

interface Clinic {
    id: string;
    name: string;
    slug: string;
    description_long?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    geo: { lat: number; lng: number };
    contact: { phone: string; website_url: string };
    machines: string[];
    treatments: string[];
    insurance_accepted: string[];
    verified: boolean;
    rating: { aggregate: number; count: number };
    hero_image_url?: string;
    media?: { logo_url?: string; hero_image_url?: string; video_url?: string };
    google_business_profile?: { embed_url?: string };
    created_by?: { name: string; email?: string; submitted_at: string; source: string };
    doctors_data?: any[];
}

// Generate slug from name and city
function generateSlug(name: string, city: string): string {
    const combined = `${name}-${city}`;
    return combined
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 80);
}

// Generate unique ID
function generateId(state: string, city: string, existingIds: Set<string>): string {
    const stateCode = state.toLowerCase();
    const cityCode = city.toLowerCase().substring(0, 2);
    let counter = 1;
    let id = `${stateCode}-${cityCode}-${String(counter).padStart(3, '0')}`;

    while (existingIds.has(id)) {
        counter++;
        id = `${stateCode}-${cityCode}-${String(counter).padStart(3, '0')}`;
    }

    return id;
}

// Convert submission to clinic format
function submissionToClinic(submission: Submission, existingIds: Set<string>): Clinic {
    const id = generateId(submission.state, submission.city, existingIds);
    const slug = generateSlug(submission.name, submission.city);

    const clinic: Clinic = {
        id,
        name: submission.name,
        slug,
        description_long: submission.description || `${submission.name} offers FDA-cleared TMS therapy in ${submission.city}, ${submission.state}.`,
        address: submission.address,
        city: submission.city,
        state: submission.state,
        zip: submission.zip,
        geo: { lat: 0, lng: 0 }, // Would need geocoding API for real coordinates
        contact: {
            phone: submission.phone,
            website_url: submission.website
        },
        machines: submission.machines || [],
        treatments: submission.treatments || [],
        insurance_accepted: submission.insurances || [],
        verified: false, // New submissions are unverified by default
        rating: { aggregate: 0, count: 0 },
        hero_image_url: submission.media?.hero_image_url,
        media: submission.media,
        google_business_profile: submission.google_business_profile,
        created_by: submission.created_by,
        doctors_data: []
    };

    // Add doctor if provided
    if (submission.doctor?.name) {
        const doctorSlug = `dr-${submission.doctor.name.toLowerCase().replace(/[^a-z]+/g, '-').replace('dr-', '')}-${submission.city.toLowerCase()}`;
        clinic.doctors_data = [{
            name: submission.doctor.name,
            slug: doctorSlug,
            title: submission.doctor.title || 'TMS Specialist',
            image_url: submission.doctor.image_url || `https://placehold.co/400x400/e2e8f0/1e293b?text=${submission.doctor.name.split(' ')[0]}`,
            years_experience: submission.doctor.years_experience || 0,
            specialties: ['Depression', 'TMS Therapy']
        }];
    }

    return clinic;
}

// Main function
async function processSubmissions(submissionsPath?: string) {
    const clinicsPath = path.join(__dirname, '../src/data/clinics.json');

    // Load existing clinics
    const clinicsData = JSON.parse(fs.readFileSync(clinicsPath, 'utf-8')) as Clinic[];
    const existingIds = new Set(clinicsData.map(c => c.id));
    const existingSlugs = new Set(clinicsData.map(c => c.slug));

    console.log(`📊 Existing clinics: ${clinicsData.length}`);

    // Load submissions
    let submissions: Submission[] = [];

    if (submissionsPath && fs.existsSync(submissionsPath)) {
        submissions = JSON.parse(fs.readFileSync(submissionsPath, 'utf-8'));
    } else {
        // Check for default submissions file
        const defaultPath = path.join(__dirname, '../src/data/submissions.json');
        if (fs.existsSync(defaultPath)) {
            submissions = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
        }
    }

    if (submissions.length === 0) {
        console.log('ℹ️  No submissions to process.');
        console.log('\nTo add a submission, create a JSON file with the following format:');
        console.log(JSON.stringify([{
            name: "Example TMS Clinic",
            address: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            zip: "90001",
            phone: "(555) 123-4567",
            website: "https://example.com",
            machines: ["NeuroStar"],
            treatments: ["Depression"],
            insurances: ["Medicare"],
            created_by: {
                name: "John Smith",
                email: "john@example.com",
                submitted_at: new Date().toISOString(),
                source: "website_form"
            }
        }], null, 2));
        return;
    }

    console.log(`📥 Processing ${submissions.length} submission(s)...`);

    let added = 0;
    let skipped = 0;

    for (const submission of submissions) {
        // Check for duplicate (by name + city)
        const potentialSlug = generateSlug(submission.name, submission.city);
        if (existingSlugs.has(potentialSlug)) {
            console.log(`⏭️  Skipped (duplicate): ${submission.name} in ${submission.city}`);
            skipped++;
            continue;
        }

        // Convert and add
        const clinic = submissionToClinic(submission, existingIds);
        clinicsData.push(clinic);
        existingIds.add(clinic.id);
        existingSlugs.add(clinic.slug);

        console.log(`✅ Added: ${clinic.name} (${clinic.id})`);
        added++;
    }

    // Save updated clinics
    fs.writeFileSync(clinicsPath, JSON.stringify(clinicsData, null, 2));

    console.log(`\n📊 Summary:`);
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total clinics: ${clinicsData.length}`);

    // Clear submissions file if we processed from the default location
    if (!submissionsPath) {
        const defaultPath = path.join(__dirname, '../src/data/submissions.json');
        if (fs.existsSync(defaultPath)) {
            fs.writeFileSync(defaultPath, '[]');
            console.log('\n🧹 Cleared submissions.json');
        }
    }
}

// Run
const submissionsArg = process.argv[2];
processSubmissions(submissionsArg);
