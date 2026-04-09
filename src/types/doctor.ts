export interface Doctor {
    name: string;
    first_name?: string;
    last_name?: string;
    credential?: string;
    title?: string;
    school?: string;
    years_experience?: number;
    specialties?: string[];
    bio?: string;
    bio_focus?: string;
    image?: string;
    image_url?: string;
    slug?: string;
}
