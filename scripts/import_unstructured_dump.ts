import fs from 'fs';
import path from 'path';

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
    specialties: string[];
    machines: string[];
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

const RAW_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'chat_dump.txt');
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
    console.log('Starting chat dump import...');

    if (!fs.existsSync(RAW_FILE_PATH)) {
        console.error('No chat dump file found.');
        process.exit(1);
    }

    const content = fs.readFileSync(RAW_FILE_PATH, 'utf-8');

    // Split by the start of a record.
    // Pattern: Newline followed by "TMS clinic, [zip], [City], [State]"
    // The "query" field in the header is "TMS clinic, ...".
    const recordsRaw = content.split(/\n(?=TMS clinic, \d+|TMS clinic, \w+)/);

    console.log(`Found ${recordsRaw.length} record blocks (including header block).`);

    let existingClinics: Clinic[] = [];
    if (fs.existsSync(TARGET_FILE_PATH)) {
        existingClinics = JSON.parse(fs.readFileSync(TARGET_FILE_PATH, 'utf-8'));
    }
    const existingGoogleIds = new Set(existingClinics.map(c => c.google_id).filter(Boolean));
    const existingSlugSet = new Set(existingClinics.map(c => c.slug));

    let newCount = 0;

    for (const block of recordsRaw) {
        // Skip header block (contains "query\tname\t...")
        if (block.startsWith('query\t') || block.startsWith('query\n')) continue;

        // Basic extraction
        const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 5) continue;

        const isOperational = block.includes('OPERATIONAL');
        if (!isOperational) continue;

        // Extract Query from first line
        const queryLine = lines[0]; // e.g. "TMS clinic, 40218, Louisville, KY, US"

        // Extract Name - usually line 1 or 2. 
        // Heuristic: Line 1 matches the city name often? No.
        // In the dump:
        // Line 0: TMS clinic, ...
        // Line 1: Name (e.g. Hagan Health...)
        // Line 2: Name for emails / Slug-like?
        const name = lines[1];

        // Address: Look for line with Zip code match or just generic structure?
        // In dump, Address is typically 9th field, but lines are variable.
        // Heuristic: Look for long string with digits?
        // Or look for phone/website first.

        const phoneRegex = /\+1\s\d{3}-\d{3}-\d{4}/;
        const phoneMatch = block.match(phoneRegex);
        const phone = phoneMatch ? phoneMatch[0] : '';

        const urlRegex = /https?:\/\/(?!lh3\.google|search\.google|www\.google|streetviewpixels)[^\s]+/;
        const urlMatch = block.match(urlRegex);
        const website = urlMatch ? urlMatch[0] : '';

        // Google ID: often 0x... or long numeric link
        // Line starting with 0x...
        const googleIdMatch = block.match(/(0x[a-f0-9]+:[0-z]+)/);
        const google_id = googleIdMatch ? googleIdMatch[1] : `gen-${slugify(name)}-${Date.now()}`;

        if (existingGoogleIds.has(google_id)) continue;

        // Coords: lines with just numbers like "38.233243"
        // Regex for lat/long on separate lines
        const latLongRegex = /\n(-?\d+\.\d+)\n(-?\d+\.\d+)\n/;
        const geoMatch = block.match(latLongRegex);
        let geo = { lat: 0, lng: 0 };
        if (geoMatch) {
            geo = { lat: parseFloat(geoMatch[1]), lng: parseFloat(geoMatch[2]) };
        }

        // Address / City / State
        // In query line: "TMS clinic, [zip], [city], [state code], US"
        // e.g. "TMS clinic, 40218, Louisville, KY, US"
        // or "TMS clinic, 1088, West Hatfield, MA, US"
        const queryParts = queryLine.split(',').map(s => s.trim());
        let city = '', state = '', zip = '';
        if (queryParts.length >= 5) {
            state = queryParts[queryParts.length - 2];
            city = queryParts[queryParts.length - 3];
            zip = queryParts[queryParts.length - 4];
            // If zip is not number, shift?
            if (isNaN(parseInt(zip))) {
                // try parsing logic
            }
        }

        // Hours
        let openingHours: string[] = [];
        try {
            const hoursMatch = block.match(/(\{"Monday":.+?\})/);
            if (hoursMatch) {
                const hoursJson = JSON.parse(hoursMatch[1].replace(/'/g, '"'));
                openingHours = Object.entries(hoursJson).map(([day, time]) => `${day}: ${Array.isArray(time) ? time.join(', ') : time}`);
            }
        } catch (e) { }

        // Rating
        // Look for number 1.0-5.0 on its own line followed by an integer
        const ratingMatch = block.match(/\n([1-5]\.\d)\n(\d+)\n/);
        let rating = { aggregate: 0, count: 0, sentiment_summary: '' };
        if (ratingMatch) {
            rating.aggregate = parseFloat(ratingMatch[1]);
            rating.count = parseInt(ratingMatch[2]);
        }

        // Photo
        const photoMatch = block.match(/https:\/\/lh3\.googleusercontent\.com\/p\/[^\s]+/);
        const photo = photoMatch ? photoMatch[0] : '';

        // Slug
        let baseSlug = slugify(`${name}-${city}`);
        let slug = baseSlug;
        let counter = 1;
        while (existingSlugSet.has(slug)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
        existingSlugSet.add(slug);

        const clinic: Clinic = {
            id: `chat-import-${newCount}-${Date.now()}`,
            name: name,
            slug: slug,
            address: '', // Hard to parse perfectly without structured data, leaving blank or trying to find
            city: city,
            state: state,
            zip: zip,
            geo: geo,
            phone: phone,
            website: website,
            specialties: ['TMS'],
            machines: [],
            insurances: [],
            logo_url: '',
            hero_image_url: photo,
            gallery_urls: [],
            rating: rating,
            review_count: rating.count,
            verified: true,
            is_featured: false,
            description: `TMS service provider in ${city}, ${state}.`,
            opening_hours: openingHours,
            google_id: google_id
        };

        existingClinics.push(clinic);
        newCount++;
    }

    console.log(`Imported ${newCount} new clinics locally.`);
    fs.writeFileSync(TARGET_FILE_PATH, JSON.stringify(existingClinics, null, 2));
}

main().catch(console.error);
