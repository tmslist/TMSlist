/**
 * Fetch Real Doctor Images from Google
 * 
 * This script strips out fake placeholder images (Unsplash/UI-Avatars) 
 * and uses Apify's Google Search Scraper to fetch real photos in bulk 
 * based on doctor name and clinic, completely bypassing local bot blocks.
 * 
 * Usage:
 * npx tsx scripts/fetch-real-google-images.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { ApifyClient } from 'apify-client';

const args = process.argv.slice(2);
const targetFile = args[0] || 'clinics.json';
const CLINICS_PATH = path.join(process.cwd(), 'src', 'data', targetFile);
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
if (!APIFY_API_TOKEN) {
    console.error('APIFY_API_TOKEN env var is required');
    process.exit(1);
}

async function main() {
    console.log('=== Fetching Real Doctor Images via Apify ===\n');

    if (!APIFY_API_TOKEN) {
        console.error('ERROR: APIFY_API_TOKEN environment variable is required.');
        process.exit(1);
    }

    const rawData = fs.readFileSync(CLINICS_PATH, 'utf-8');
    const clinics = JSON.parse(rawData);

    // Phase 1: Collect all doctors that need images (handles both image_url and photo_url)
    const doctorsToUpdate: { clinicIdx: number; docIdx: number; query: string; imageKey: string }[] = [];
    const uniqueQueries = new Set<string>();

    for (let i = 0; i < clinics.length; i++) {
        const clinic = clinics[i];
        if (!clinic.doctors_data) continue;

        for (let j = 0; j < clinic.doctors_data.length; j++) {
            const doctor = clinic.doctors_data[j];
            const imageKey = doctor.photo_url !== undefined ? 'photo_url' : 'image_url';

            // Strip fake placeholders so we can fetch the real ones
            if (doctor[imageKey] && (doctor[imageKey].includes('unsplash.com') || doctor[imageKey].includes('ui-avatars.com') || doctor[imageKey].includes('placehold.co') || doctor[imageKey].includes('api.dicebear.com'))) {
                doctor[imageKey] = null;
            }

            if (!doctor[imageKey]) {
                const query = `"${doctor.name}" psychiatrist OR doctor "${clinic.name}"`;
                doctorsToUpdate.push({ clinicIdx: i, docIdx: j, query, imageKey });
                uniqueQueries.add(query);
            }
        }
    }

    if (uniqueQueries.size === 0) {
        console.log('ℹ️ No new images were found to update.');
        return;
    }

    console.log(`Found ${uniqueQueries.size} unique doctor queries. Starting Apify Actor...`);
    console.log('(This may take a few minutes as Apify processes the batch in the cloud)\n');

    const client = new ApifyClient({ token: APIFY_API_TOKEN });

    // Phase 2: Call Apify's official Google Search Scraper
    const run = await client.actor("apify/google-search-scraper").call({
        queries: Array.from(uniqueQueries).join('\n'), // Run all queries in one bulk batch
        searchType: "image",
        resultsPerPage: 5, // Grab a few results to allow fallbacks
        maxPagesPerQuery: 1,
    });

    console.log(`✅ Apify Actor finished successfully! Fetching dataset...`);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Create a map to quickly match search queries to their resulting image URL
    const imageUrlMap = new Map<string, string>();
    for (const item of items) {
        const term = item.searchQuery?.term;
        if (term && item.imageResults && item.imageResults.length > 0) {
            // Find the first result that has an imageUrl or a thumbnailUrl
            const validResult = item.imageResults.find((res: any) => res.imageUrl || res.thumbnailUrl);
            if (validResult) {
                imageUrlMap.set(term, validResult.imageUrl || validResult.thumbnailUrl);
            }
        }
    }

    // Phase 3: Apply back to our data
    let updatedCount = 0;
    for (const target of doctorsToUpdate) {
        const realImageUrl = imageUrlMap.get(target.query);
        if (realImageUrl) {
            clinics[target.clinicIdx].doctors_data[target.docIdx][target.imageKey] = realImageUrl;
            console.log(`✅ Found: ${target.query}`);
            updatedCount++;
        } else {
            console.log(`❌ No image found for: ${target.query}`);
        }
    }

    if (updatedCount > 0) {
        fs.writeFileSync(CLINICS_PATH, JSON.stringify(clinics, null, 2), 'utf-8');
        console.log(`\n🎉 Successfully found and saved ${updatedCount} doctor images!`);
    } else {
        console.log('\nℹ️ Apify ran successfully, but no images were matched.');
    }
}

main().catch(console.error);