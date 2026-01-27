
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clinicsPath = path.join(process.cwd(), 'src/data/clinics.json');
const CLINIC_DEFAULT_IMAGE = '/images/tms_chair_luxury_1769446442231.png';
const DOCTOR_DEFAULT_IMAGE = '/images/tms_doctor_consult_1769446457625.png';

try {
    const data = fs.readFileSync(clinicsPath, 'utf-8');
    const clinics = JSON.parse(data);

    let updatedCount = 0;

    const updatedClinics = clinics.map((clinic) => {
        let changed = false;

        // Update Clinic Image
        if (!clinic.hero_image_url || clinic.hero_image_url.includes('placehold.co')) {
            clinic.hero_image_url = CLINIC_DEFAULT_IMAGE;
            changed = true;
        }

        // Update Doctors
        if (clinic.doctors_data && Array.isArray(clinic.doctors_data)) {
            clinic.doctors_data = clinic.doctors_data.map((doc) => {
                if (!doc.image_url || doc.image_url.includes('placehold.co')) {
                    doc.image_url = DOCTOR_DEFAULT_IMAGE;
                    changed = true;
                }
                return doc;
            });
        }

        if (changed) updatedCount++;
        return clinic;
    });

    fs.writeFileSync(clinicsPath, JSON.stringify(updatedClinics, null, 2), 'utf-8');
    console.log(`Successfully updated images for ${updatedCount} clinics.`);

} catch (err) {
    console.error('Error updating clinics:', err);
}
