import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// Define types for the raw data
interface RawClinic {
    query: string;
    name: string;
    phone: string;
    website: string;
    address: string;
    street: string;
    city: string;
    state: string;
    state_code: string;
    postal_code: string;
    latitude: string;
    longitude: string;
    rating: string;
    reviews: string;
    photo: string;
    logo: string;
    business_status: string;
    working_hours: string;
    about: string;
    description: string;
    google_id: string;
    [key: string]: any; // Allow other fields from TSV/Excel
}

interface Clinic {
    id: string;
    name: string;
    slug: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    geo: {
        lat: number;
        lng: number;
    };
    phone: string;
    website: string;
    machines: string[];
    specialties: string[];
    insurances: string[];
    logo_url: string;
    hero_image_url: string;
    gallery_urls: string[];
    rating: {
        aggregate: number;
        count: number;
        sentiment_summary: string;
    };
    review_count: number;
    verified: boolean;
    is_featured: boolean;
    description?: string;
    opening_hours?: string[];
    google_id?: string;
}

const TARGET_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'clinics.json');

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function main() {
    const argPath = process.argv[2];
    if (!argPath) {
        console.error('Please provide a file path: npx tsx scripts/import_new_clinics.ts <path_to_file>');
        process.exit(1);
    }

    const inputPath = path.resolve(argPath);
    console.log(`Processing file: ${inputPath}`);

    if (!fs.existsSync(inputPath)) {
        console.error(`Error: File not found at ${inputPath}`);
        process.exit(1);
    }

    let rawData: RawClinic[] = [];

    // Check if it's an Excel file (even if it has a .tsv extension)
    const buffer = fs.readFileSync(inputPath);
    const isExcel = buffer.slice(0, 4).toString('hex') === '504b0304'; // Zip header used by XLSX

    if (isExcel) {
        console.log('Detected Excel (XLSX) format. Parsing...');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        rawData = XLSX.utils.sheet_to_json(sheet) as RawClinic[];
    } else {
        console.log('Detected text/TSV format. Parsing...');
        const content = buffer.toString('utf-8');
        const lines = content.split('\n');
        const headers = lines[0].split('\t').map(h => h.trim());

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split('\t');
            const entry: any = {};
            headers.forEach((header, index) => {
                entry[header] = (values[index] || '').trim();
            });
            rawData.push(entry as RawClinic);
        }
    }

    console.log(`Parsed ${rawData.length} entries.`);

    if (rawData.length === 0) {
        console.error('No data found in file.');
        process.exit(1);
    }

    // Load existing
    let existingClinics: Clinic[] = [];
    if (fs.existsSync(TARGET_FILE_PATH)) {
        existingClinics = JSON.parse(fs.readFileSync(TARGET_FILE_PATH, 'utf-8'));
    }
    const existingGoogleIds = new Set(existingClinics.map(c => c.google_id).filter(Boolean));
    const existingSlugSet = new Set(existingClinics.map(c => c.slug));

    let newCount = 0;
    let duplicateCount = 0;

    for (const raw of rawData) {
        // Normalize name
        const name = raw.name || raw.Name || '';
        if (!name) continue;

        // Status check
        const status = (raw.business_status || raw.Status || '').toString().toUpperCase();
        if (status && status !== 'OPERATIONAL' && status !== 'OPEN') continue;

        const google_id = raw.google_id || raw['Google ID'] || raw.place_id || '';
        if (google_id && existingGoogleIds.has(google_id)) {
            duplicateCount++;
            continue;
        }

        let baseSlug = slugify(`${name}-${raw.city || ''}`);
        let slug = baseSlug;
        let counter = 1;
        while (existingSlugSet.has(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        existingSlugSet.add(slug);

        const id = `import-${Date.now()}-${newCount}`;

        const clinic: Clinic = {
            id,
            name,
            slug,
            address: raw.street || raw.address || raw.Address || '',
            city: raw.city || raw.City || '',
            state: raw.state_code || raw.state || raw.State || '',
            zip: (raw.postal_code || raw.Zip || '').toString(),
            geo: {
                lat: parseFloat(raw.latitude || raw.Latitude) || 0,
                lng: parseFloat(raw.longitude || raw.Longitude) || 0
            },
            phone: (raw.phone || raw.Phone || '').toString(),
            website: raw.website || raw.Website || '',
            machines: [],
            specialties: raw.subtypes ? raw.subtypes.split(',').map((s: string) => s.trim()) : [],
            insurances: [],
            logo_url: raw.logo || '',
            hero_image_url: raw.photo || '',
            gallery_urls: [],
            rating: {
                aggregate: parseFloat(raw.rating || raw.Rating) || 0,
                count: parseInt(raw.reviews || raw.Reviews) || 0,
                sentiment_summary: ''
            },
            review_count: parseInt(raw.reviews || raw.Reviews) || 0,
            verified: true,
            is_featured: false,
            description: raw.about || raw.description || `TMS clinic in ${raw.city || ''}.`,
            google_id
        };

        existingClinics.push(clinic);
        newCount++;
    }

    console.log(`Imported ${newCount} new clinics.`);
    console.log(`Skipped ${duplicateCount} duplicates.`);

    fs.writeFileSync(TARGET_FILE_PATH, JSON.stringify(existingClinics, null, 2));
    console.log('Successfully updated clinics.json');
}

main().catch(console.error);
