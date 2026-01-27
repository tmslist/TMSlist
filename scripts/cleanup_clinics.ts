import fs from 'fs';
import path from 'path';

const TARGET_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'clinics.json');

async function clean() {
    if (!fs.existsSync(TARGET_FILE_PATH)) return;

    const clinics = JSON.parse(fs.readFileSync(TARGET_FILE_PATH, 'utf-8'));
    const originalCount = clinics.length;

    // Filter out clinics where name or city is undefined or slug contains "undefined"
    const cleaned = clinics.filter((c: any) => {
        const isInvalid = !c.name || c.name === 'undefined' || c.slug.includes('undefined');
        return !isInvalid;
    });

    console.log(`Original count: ${originalCount}`);
    console.log(`Removed: ${originalCount - cleaned.length}`);
    console.log(`New count: ${cleaned.length}`);

    fs.writeFileSync(TARGET_FILE_PATH, JSON.stringify(cleaned, null, 2));
}

clean().catch(console.error);
