/**
 * Fast Image Filler
 * 
 * Instantly populates missing clinic and doctor images with high-quality 
 * fallbacks (Unsplash & UI Avatars) without making any slow network requests.
 * 
 * Usage:
 * npx tsx scripts/fast-fill-images.ts clinics.json
 * npx tsx scripts/fast-fill-images.ts international-clinics.json
 */

import * as fs from 'fs';
import * as path from 'path';

const CLINIC_IMAGE_POOL = [
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1516549655169-df83a092dd14?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1516574187841-693083f69382?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1596541223130-5d31a73fb6c6?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=800&h=500&fit=crop"
];

const BG_COLORS = ['0369a1', '1d4ed8', '4338ca', '6d28d9', '0e7490', '047857', 'b45309', 'be123c', '0f766e', '4f46e5'];

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

async function main() {
    const args = process.argv.slice(2);
    const targetFile = args[0] || 'clinics.json';
    const filePath = path.join(process.cwd(), 'src', 'data', targetFile);

    console.log(`\n=== Fast Image Filler for ${targetFile} ===\n`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let clinicsUpdated = 0;
    let doctorsUpdated = 0;

    for (const clinic of data) {
        // 1. Fix Clinic Hero Image (replaces missing or blurry google favicons)
        if (!clinic.hero_image_url || clinic.hero_image_url.includes('s2.googleusercontent.com') || clinic.hero_image_url.includes('favicon')) {
            const idx = simpleHash(clinic.name || clinic.id) % CLINIC_IMAGE_POOL.length;
            clinic.hero_image_url = CLINIC_IMAGE_POOL[idx];
            clinicsUpdated++;
        }

        // 2. Fix Doctor Images
        if (clinic.doctors_data && Array.isArray(clinic.doctors_data)) {
            for (const doc of clinic.doctors_data) {
                const imgKey = doc.photo_url !== undefined ? 'photo_url' : 'image_url';
                const currentImg = doc[imgKey];

                // Assign a professional initial-avatar if missing or using an old broken placeholder
                if (!currentImg || currentImg.includes('dicebear') || currentImg.includes('tms_doctor_consult')) {
                    const first = (doc.first_name || doc.name || 'D').charAt(0).toUpperCase();
                    const last = (doc.last_name || doc.name?.split(' ').pop() || 'R').charAt(0).toUpperCase();
                    const bg = BG_COLORS[simpleHash(doc.name || 'Doc') % BG_COLORS.length];
                    doc[imgKey] = `https://ui-avatars.com/api/?name=${first}${last}&background=${bg}&color=fff&size=256&bold=true&format=png`;
                    doctorsUpdated++;
                }
            }
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Successfully updated ${clinicsUpdated} clinics and ${doctorsUpdated} doctors in ${targetFile}.`);
}

main().catch(console.error);