/**
 * Fetch Real Doctor Images from Google
 * 
 * This script strips out fake placeholder images (Unsplash/UI-Avatars) 
 * and uses the Google Custom Search API to find the real, actual photos 
 * of your doctors based on their name and clinic.
 * 
 * Usage:
 * GOOGLE_API_KEY="your_api_key" GOOGLE_CX="your_search_engine_id" npx tsx scripts/fetch-real-google-images.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const CLINICS_PATH = path.join(process.cwd(), 'src', 'data', 'clinics.json');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

async function searchGoogleImage(query: string): Promise<string | null> {
    if (!GOOGLE_API_KEY || !GOOGLE_CX) return null;

    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_CX}&searchType=image&num=1&key=${GOOGLE_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].link;
        }
    } catch (err) {
        console.error(`Failed to fetch image for: ${query}`);
    }
    return null;
}

async function main() {
    console.log('=== Fetching Real Doctor Images from Google ===\n');

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
        console.error('ERROR: GOOGLE_API_KEY and GOOGLE_CX environment variables are required.');
        console.log('\nTo get these for free:');
        console.log('1. Get an API Key: https://developers.google.com/custom-search/v1/overview');
        console.log('2. Create a Custom Search Engine (CX) and turn on "Image search": https://programmablesearchengine.google.com/');
        process.exit(1);
    }

    const rawData = fs.readFileSync(CLINICS_PATH, 'utf-8');
    const clinics = JSON.parse(rawData);
    let updatedCount = 0;

    for (const clinic of clinics) {
        if (!clinic.doctors_data) continue;

        for (const doctor of clinic.doctors_data) {
            // Strip fake placeholders so we can fetch the real ones
            if (doctor.image_url && (doctor.image_url.includes('unsplash.com') || doctor.image_url.includes('ui-avatars.com') || doctor.image_url.includes('placehold.co'))) {
                doctor.image_url = null;
            }

            // If no real image exists, fetch from Google
            if (!doctor.image_url) {
                const query = `"${doctor.name}" psychiatrist OR doctor "${clinic.name}"`;
                console.log(`Searching Google Images for: ${query}`);

                const realImageUrl = await searchGoogleImage(query);
                if (realImageUrl) {
                    doctor.image_url = realImageUrl;
                    console.log(`✅ Found: ${realImageUrl}`);
                    updatedCount++;
                } else {
                    console.log(`❌ No image found.`);
                }

                // Save periodically to avoid losing progress
                if (updatedCount > 0 && updatedCount % 10 === 0) {
                    fs.writeFileSync(CLINICS_PATH, JSON.stringify(clinics, null, 2), 'utf-8');
                }

                // Respect Google API rate limits by pausing for 1.5 seconds
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }
    }

    if (updatedCount > 0) {
        fs.writeFileSync(CLINICS_PATH, JSON.stringify(clinics, null, 2), 'utf-8');
        console.log(`\n🎉 Successfully found and saved ${updatedCount} real doctor images!`);
    } else {
        console.log('\nℹ️ No new images were found or updated.');
    }
}

main().catch(console.error);