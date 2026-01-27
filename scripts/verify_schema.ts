import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'dist/clinic/york-tms-clinic-york/index.html');
const content = fs.readFileSync(filePath, 'utf-8');

const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let match;

while ((match = regex.exec(content)) !== null) {
    try {
        const json = JSON.parse(match[1]);
        if (json['@type'] && (json['@type'].includes('MedicalClinic') || json['@type'] === 'WebSite')) {
            console.log('--- FOUND SCHEMA ---');
            console.log(JSON.stringify(json, null, 2));
            console.log('--------------------');
        }
    } catch (e) {
        console.error('Failed to parse JSON block:', e);
    }
}
