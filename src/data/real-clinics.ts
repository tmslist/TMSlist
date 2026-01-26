// Real TMS Clinics Data - Imported from Google Places raw data
// Only includes OPERATIONAL clinics with verified data

export interface RealClinic {
    name: string;
    slug: string;
    type: 'clinical' | 'wellness';
    address: {
        street: string;
        city: string;
        state: string;
        stateCode: string;
        zip: string;
    };
    phone?: string;
    website?: string;
    rating: number;
    reviewCount: number;
    workingHours?: Record<string, string[]>;
    googlePlaceId: string;
    photo?: string;
    logo?: string;
    category: string;
    subtypes: string[];
    accessibility?: string[];
    verified: boolean;
    businessStatus: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
}

// Washington DC Clinics
export const DC_CLINICS: RealClinic[] = [
    {
        name: "Vital TMS Therapy",
        slug: "vital-tms-therapy-washington-dc",
        type: "clinical",
        address: {
            street: "5225 Wisconsin Ave NW #401",
            city: "Washington",
            state: "District Of Columbia",
            stateCode: "DC",
            zip: "20015"
        },
        phone: "+1 202-335-4114",
        website: "https://www.vitaltms.com/",
        rating: 4.8,
        reviewCount: 23,
        workingHours: {
            "Monday": ["9AM-6PM"],
            "Tuesday": ["9AM-6PM"],
            "Wednesday": ["9AM-6PM"],
            "Thursday": ["9AM-6PM"],
            "Friday": ["9AM-6PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJh4y69FvJt4kRdH9Un9uRbKk",
        photo: "https://lh3.googleusercontent.com/p/AF1QipO-FDbftUZdhxtxboYeSAH0_Xg4X8NVJOke6Mgs=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist", "Mental health clinic"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "WIP Psychiatry & Ketamine/TMS Center",
        slug: "wip-psychiatry-ketamine-tms-washington-dc",
        type: "clinical",
        address: {
            street: "4325 49th St NW Suite 200",
            city: "Washington",
            state: "District Of Columbia",
            stateCode: "DC",
            zip: "20016"
        },
        phone: "+1 202-525-5123",
        website: "https://www.washingtoninterventionalpsychiatry.com/",
        rating: 4.9,
        reviewCount: 220,
        workingHours: {
            "Monday": ["9AM-8PM"],
            "Tuesday": ["9AM-8PM"],
            "Wednesday": ["9AM-8PM"],
            "Thursday": ["9AM-8PM"],
            "Friday": ["9AM-6PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJFz3JWcS3t4kRT3zyheGaNd4",
        photo: "https://lh3.googleusercontent.com/p/AF1QipPTlLjyCeLvk0u4oyms9OfzxBn_eZWEhJ_iaum0=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist", "Child psychiatrist", "Mental health clinic", "Mental health service", "Psychotherapist"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom", "LGBTQ+ friendly", "Transgender safespace"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "Tranquil Healthcare",
        slug: "tranquil-healthcare-washington-dc",
        type: "clinical",
        address: {
            street: "1050 Connecticut Ave NW #500",
            city: "Washington",
            state: "District Of Columbia",
            stateCode: "DC",
            zip: "20036"
        },
        phone: "+1 202-455-0296",
        website: "https://www.tranquilhealthcare.com/",
        rating: 5.0,
        reviewCount: 1,
        workingHours: {
            "Monday": ["9AM-5PM"],
            "Tuesday": ["9AM-5PM"],
            "Wednesday": ["9AM-5PM"],
            "Thursday": ["9AM-5PM"],
            "Friday": ["9AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJa_JY4wy3t4kR8M5FT0jU3Kc",
        photo: "https://lh3.googleusercontent.com/p/AF1QipMCdt5aVFEqyxcp-G2RKQOb4vVzfVt2pi_o_URZ=w800-h500-k-no",
        category: "Mental health service",
        subtypes: ["Mental health service", "Mental health clinic", "Nurse practitioner"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible restroom", "LGBTQ+ friendly", "Transgender safespace", "Women-owned"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// California - Fresno Area Clinics
export const FRESNO_CLINICS: RealClinic[] = [
    {
        name: "Central California TMS Center",
        slug: "central-california-tms-center-fresno",
        type: "clinical",
        address: {
            street: "2520 W Shaw Ln Ste 101-C",
            city: "Fresno",
            state: "California",
            stateCode: "CA",
            zip: "93711"
        },
        phone: "+1 559-433-1867",
        website: "http://depressionfresno.com/",
        rating: 2.7,
        reviewCount: 3,
        workingHours: {
            "Monday": ["9AM-5PM"],
            "Tuesday": ["9AM-5PM"],
            "Wednesday": ["9AM-5PM"],
            "Thursday": ["9AM-5PM"],
            "Friday": ["9AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJHUBaYWMMXycRXfBRj28wVp4",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist", "Mental health clinic"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "A Better Way Psychiatry & TMS - Fresno",
        slug: "a-better-way-psychiatry-tms-fresno",
        type: "clinical",
        address: {
            street: "1690 W Shaw Ave",
            city: "Fresno",
            state: "California",
            stateCode: "CA",
            zip: "93711"
        },
        phone: "+1 800-383-8180",
        website: "https://www.abetterwaytms.com/tms-therapy-in-fresno-california/",
        rating: 0,
        reviewCount: 0,
        workingHours: {
            "Monday": ["8AM-5PM"],
            "Tuesday": ["8AM-5PM"],
            "Wednesday": ["8AM-5PM"],
            "Thursday": ["8AM-5PM"],
            "Friday": ["8AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJOcxv0XFnlIARykUY99xNyy4",
        photo: "https://lh3.googleusercontent.com/p/AF1QipN78dFJMCKMo2MW7H5_2nan2dMnqI54sZcZpEHE=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// California - Woodland Hills / Canoga Park
export const LA_AREA_CLINICS: RealClinic[] = [
    {
        name: "A Better Way Psychiatry & TMS - Woodland Hills",
        slug: "a-better-way-psychiatry-tms-woodland-hills",
        type: "clinical",
        address: {
            street: "6304 Owensmouth Ave",
            city: "Woodland Hills",
            state: "California",
            stateCode: "CA",
            zip: "91367"
        },
        phone: "+1 818-867-4447",
        website: "https://www.abetterwaytms.com/tms-therapy-in-woodland-hills/",
        rating: 0,
        reviewCount: 0,
        workingHours: {
            "Monday": ["8AM-5PM"]
        },
        googlePlaceId: "ChIJRzyD_pydwoARlyGWqhuS4oQ",
        photo: "https://lh3.googleusercontent.com/p/AF1QipNryexCwdcpGUmyhZp6dxSPekiID1F91QfbFNd_=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// California - Newport Beach
export const NEWPORT_BEACH_CLINICS: RealClinic[] = [
    {
        name: "Harbor TMS Clinic",
        slug: "harbor-tms-clinic-newport-beach",
        type: "clinical",
        address: {
            street: "4631 Teller Ave Suite 130",
            city: "Newport Beach",
            state: "California",
            stateCode: "CA",
            zip: "92660"
        },
        phone: "+1 949-486-5991",
        website: "https://harbormentalhealth.com/transcranial-magnetic-stimulation/",
        rating: 0,
        reviewCount: 0,
        workingHours: {
            "Monday": ["9AM-5PM"],
            "Tuesday": ["9AM-5PM"],
            "Wednesday": ["9AM-5PM"],
            "Thursday": ["9AM-5PM"],
            "Friday": ["9AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJ40YbTXbf3IARt6aSmPSXVG0",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "Newport Psychiatry & TMS Treatment Center",
        slug: "newport-psychiatry-tms-treatment-center",
        type: "clinical",
        address: {
            street: "901 Dove St #145",
            city: "Newport Beach",
            state: "California",
            stateCode: "CA",
            zip: "92660"
        },
        phone: "+1 949-955-1088",
        website: "http://www.newporttms.com/",
        rating: 4.9,
        reviewCount: 45,
        workingHours: {
            "Monday": ["9AM-6PM"],
            "Tuesday": ["9AM-6PM"],
            "Wednesday": ["9AM-6PM"],
            "Thursday": ["9AM-6PM"],
            "Friday": ["9AM-6PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJbcSF08rf3IARQtKk6FnVWJ4",
        photo: "https://lh3.googleusercontent.com/p/AF1QipNkMxsUMgA77_Vh6iAYhUyyHCn5vhrvx146LapH=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist", "Mental health clinic", "Mental health service"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom", "Wheelchair accessible seating"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// California - Ventura
export const VENTURA_CLINICS: RealClinic[] = [
    {
        name: "A Better Way Psychiatry & TMS - Ventura",
        slug: "a-better-way-psychiatry-tms-ventura",
        type: "clinical",
        address: {
            street: "1884 Eastman Ave Unit 105",
            city: "Ventura",
            state: "California",
            stateCode: "CA",
            zip: "93003"
        },
        phone: "+1 805-500-6080",
        website: "https://www.abetterwaytms.com/mental-health-care-in-ventura/",
        rating: 4.6,
        reviewCount: 28,
        workingHours: {
            "Monday": ["8AM-5PM"],
            "Tuesday": ["8AM-5PM"],
            "Wednesday": ["8AM-5PM"],
            "Thursday": ["8AM-5PM"],
            "Friday": ["8AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJx6Sz5yRN6IARWX8cb89Z-Bc",
        photo: "https://lh3.googleusercontent.com/p/AF1QipNdiqT28juRnEDZ4vAEXYJIGyh7Q_f-59s_pwHA=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "Lee D. Mendiola, M.D. & Associates - TMS Center Of Ventura",
        slug: "lee-mendiola-tms-center-ventura",
        type: "clinical",
        address: {
            street: "1752 S Victoria Ave #250",
            city: "Ventura",
            state: "California",
            stateCode: "CA",
            zip: "93003"
        },
        phone: "+1 805-650-3880",
        website: "http://www.leemendiolamd.com/",
        rating: 4.7,
        reviewCount: 437,
        workingHours: {
            "Monday": ["9AM-5PM"],
            "Tuesday": ["9AM-5PM"],
            "Wednesday": ["9AM-5PM"],
            "Thursday": ["9AM-5PM"],
            "Friday": ["9AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJdwzT6k-t6YARQpMSX2G2Xrc",
        photo: "https://lh3.googleusercontent.com/p/AF1QipO3AJ6mw_zvHyN8326FxZxQJC9htJ7FQOxpFrXK=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist", "Addiction treatment center", "Medical clinic", "Mental health clinic", "Mental health service"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// Arizona - Scottsdale/Phoenix Area
export const ARIZONA_REAL_CLINICS: RealClinic[] = [
    {
        name: "Bella Vida TMS - Gilbert",
        slug: "bella-vida-tms-gilbert-az",
        type: "clinical",
        address: {
            street: "2450 E Guadalupe Rd Suite 103",
            city: "Gilbert",
            state: "Arizona",
            stateCode: "AZ",
            zip: "85234"
        },
        phone: "+1 602-610-1191",
        website: "https://bellavidatms.com/gilbert/",
        rating: 3.8,
        reviewCount: 10,
        workingHours: {
            "Monday": ["6AM-8PM"],
            "Tuesday": ["6AM-8PM"],
            "Wednesday": ["6AM-8PM"],
            "Thursday": ["6AM-8PM"],
            "Friday": ["6AM-8PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJtZF6cqyvK4cRj-0j00Kv0mo",
        photo: "https://lh3.googleusercontent.com/p/AF1QipMT1gITX-_a3_Ia7eCwu19p5NFyScGNsx3Wo6n-=w800-h500-k-no",
        category: "Mental health clinic",
        subtypes: ["Mental health clinic"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Women-owned"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "Scottsdale TMS",
        slug: "scottsdale-tms",
        type: "clinical",
        address: {
            street: "7287 E Earll Dr",
            city: "Scottsdale",
            state: "Arizona",
            stateCode: "AZ",
            zip: "85251"
        },
        phone: "+1 480-841-9279",
        website: "https://scottsdaletmstherapy.com/",
        rating: 5.0,
        reviewCount: 3,
        workingHours: {
            "Monday": ["9AM-8PM"],
            "Tuesday": ["9AM-8PM"],
            "Wednesday": ["9AM-8PM"],
            "Thursday": ["9AM-8PM"],
            "Friday": ["9AM-8PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJR0n1BBwLK4cRdSn5ru3qw3I",
        photo: "https://lh3.googleusercontent.com/p/AF1QipPIqCpYNSNdTtJZcRQDBVWwlTbLB4w-4AtBL9La=w800-h500-k-no",
        category: "Mental health clinic",
        subtypes: ["Mental health clinic", "Mental health service"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "TMS Institute of Arizona",
        slug: "tms-institute-arizona-scottsdale",
        type: "clinical",
        address: {
            street: "9746 N 90th Pl Suite 207",
            city: "Scottsdale",
            state: "Arizona",
            stateCode: "AZ",
            zip: "85258"
        },
        phone: "+1 480-448-2916",
        website: "https://www.tmsinstitute.co/",
        rating: 4.6,
        reviewCount: 10,
        workingHours: {
            "Monday": ["7:30AM-5:30PM"],
            "Tuesday": ["7:30AM-5:30PM"],
            "Wednesday": ["7:30AM-5:30PM"],
            "Thursday": ["7:30AM-5:30PM"],
            "Friday": ["7:30AM-5:30PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJrXAyqKl1K4cRi2BeDZ0G1cw",
        photo: "https://lh3.googleusercontent.com/p/AF1QipMCWW7UdTCm85DG6KM35ezqaMEjxoucg32EuOqL=w800-h500-k-no",
        category: "Mental health clinic",
        subtypes: ["Mental health clinic", "Psychiatrist"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom", "LGBTQ+ friendly", "Transgender safespace", "Women-owned"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "American TMS Clinics - Scottsdale",
        slug: "american-tms-clinics-scottsdale",
        type: "clinical",
        address: {
            street: "5020 E Shea Blvd Suite 120",
            city: "Scottsdale",
            state: "Arizona",
            stateCode: "AZ",
            zip: "85254"
        },
        phone: "+1 602-388-1005",
        website: "https://www.americantmsclinics.com/",
        rating: 4.8,
        reviewCount: 22,
        workingHours: {
            "Monday": ["9AM-7PM"],
            "Tuesday": ["9AM-7PM"],
            "Wednesday": ["9AM-7PM"],
            "Thursday": ["9AM-7PM"],
            "Friday": ["9AM-7PM"],
            "Saturday": ["10AM-4PM"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJRQ0tllhzK4cR9MG0C2_svrY",
        category: "Mental health clinic",
        subtypes: ["Mental health clinic"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom", "Wheelchair accessible seating", "LGBTQ+ friendly", "Transgender safespace"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "NeuroStim TMS Scottsdale",
        slug: "neurostim-tms-scottsdale",
        type: "clinical",
        address: {
            street: "8901 E Mountain View Rd STE 130",
            city: "Scottsdale",
            state: "Arizona",
            stateCode: "AZ",
            zip: "85258"
        },
        phone: "+1 480-870-4910",
        website: "https://neurostimtms.com/",
        rating: 4.7,
        reviewCount: 7,
        workingHours: {
            "Monday": ["8AM-5PM"],
            "Tuesday": ["8AM-5PM"],
            "Wednesday": ["8AM-5PM"],
            "Thursday": ["8AM-5PM"],
            "Friday": ["8AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJqQYPNN91K4cRhfGWG7ykK3A",
        photo: "https://lh3.googleusercontent.com/p/AF1QipOuOOUDOXDz7QTfoUV2qbqpJ8MVzMn_ZYXf3Xi-=w800-h500-k-no",
        category: "Mental health clinic",
        subtypes: ["Mental health clinic"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "NeuroGenics TMS and Psych Solutions",
        slug: "neurogenics-tms-scottsdale",
        type: "clinical",
        address: {
            street: "10450 N 74th St #160",
            city: "Scottsdale",
            state: "Arizona",
            stateCode: "AZ",
            zip: "85258"
        },
        website: "http://www.neurogenicstms.com/",
        rating: 4.4,
        reviewCount: 7,
        workingHours: {
            "Monday": ["8AM-6PM"],
            "Tuesday": ["8AM-6PM"],
            "Wednesday": ["8AM-6PM"],
            "Thursday": ["8AM-6PM"],
            "Friday": ["8AM-1PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJ_0OSWrp1K4cRKyQyWu76PWo",
        category: "Mental health clinic",
        subtypes: ["Mental health clinic", "Doctor", "Nurse practitioner"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// New York Area Clinics
export const NY_REAL_CLINICS: RealClinic[] = [
    {
        name: "LifeQuality TMS",
        slug: "lifequality-tms-brooklyn",
        type: "clinical",
        address: {
            street: "26 Court St #1510",
            city: "Brooklyn",
            state: "New York",
            stateCode: "NY",
            zip: "11201"
        },
        phone: "+1 718-400-0867",
        website: "https://lifequalitytms.com/",
        rating: 5.0,
        reviewCount: 3,
        workingHours: {
            "Monday": ["9AM-8PM"],
            "Tuesday": ["9AM-8PM"],
            "Wednesday": ["9AM-8PM"],
            "Thursday": ["9AM-8PM"],
            "Friday": ["9AM-8PM"],
            "Saturday": ["11AM-3PM"],
            "Sunday": ["9:30AM-12PM"]
        },
        googlePlaceId: "ChIJ1w8nyuJbwokRXwl8Yz9c3yY",
        photo: "https://lh3.googleusercontent.com/p/AF1QipOYuavxjOsConMN-8vwXO8Dn1u5KGvWQvcSDtjt=w800-h500-k-no",
        category: "Mental health service",
        subtypes: ["Mental health service"],
        accessibility: ["Wheelchair accessible restroom", "LGBTQ+ friendly", "Transgender safespace"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "Hope TMS and Neuropsychiatric Center",
        slug: "hope-tms-neuropsychiatric-center-nyc",
        type: "clinical",
        address: {
            street: "57 W 57th St #808",
            city: "New York",
            state: "New York",
            stateCode: "NY",
            zip: "10019"
        },
        phone: "+1 646-558-5299",
        website: "http://www.hopetmsofny.com/",
        rating: 3.1,
        reviewCount: 9,
        workingHours: {
            "Monday": ["10AM-5PM"],
            "Tuesday": ["10AM-5PM"],
            "Wednesday": ["10AM-5PM"],
            "Thursday": ["10AM-5PM"],
            "Friday": ["10AM-3:30PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJrbEF3J5ZwokRfNQPaoBoZbY",
        photo: "https://lh3.googleusercontent.com/p/AF1QipPpt0OCSXqPrLYz6Tr7P01pPgt9qz39M8XRBTiT=w800-h500-k-no",
        category: "Medical clinic",
        subtypes: ["Medical clinic"],
        accessibility: ["Wheelchair accessible restroom", "Wheelchair accessible seating"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "TTMD MED NY LLC (TMS Brain Care)",
        slug: "ttmd-med-tms-brain-care-nyc",
        type: "clinical",
        address: {
            street: "171 W 79th St",
            city: "New York",
            state: "New York",
            stateCode: "NY",
            zip: "10024"
        },
        phone: "+1 212-362-9635",
        website: "http://www.tmsbraincare.com/",
        rating: 4.4,
        reviewCount: 20,
        workingHours: {
            "Monday": ["9AM-5PM"],
            "Tuesday": ["9AM-5PM"],
            "Wednesday": ["9AM-5PM"],
            "Thursday": ["9AM-5PM"],
            "Friday": ["9AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJPctlsYhYwokRXBo7jptYU8A",
        photo: "https://lh3.googleusercontent.com/p/AF1QipPWhz2dlP0NqXyvJcnY3AWLrmBVRalc2nhF3bKt=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist", "Doctor", "Mental health service"],
        accessibility: ["Gender-neutral restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "TMS by Revived Soul Medical",
        slug: "tms-revived-soul-medical-brooklyn",
        type: "clinical",
        address: {
            street: "1329 E 17th St #1",
            city: "Brooklyn",
            state: "New York",
            stateCode: "NY",
            zip: "11230"
        },
        phone: "+1 718-382-5060",
        website: "https://tms-brooklyn.com/",
        rating: 5.0,
        reviewCount: 3,
        workingHours: {
            "Monday": ["9AM-5PM"],
            "Tuesday": ["9AM-5PM"],
            "Wednesday": ["9AM-5PM"],
            "Thursday": ["9AM-5PM"],
            "Friday": ["9AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJxdRMvPtFwokR3YaxEUGl6ec",
        photo: "https://lh3.googleusercontent.com/p/AF1QipNweU7B2C_ZiWoGgUwaZsvFOwixwR-1TlJBfbkO=w800-h500-k-no",
        category: "Mental health clinic",
        subtypes: ["Mental health clinic"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "Neurotherapeutix Medical Services",
        slug: "neurotherapeutix-medical-services-nyc",
        type: "clinical",
        address: {
            street: "171 E 74th St Unit 1-1",
            city: "New York",
            state: "New York",
            stateCode: "NY",
            zip: "10021"
        },
        phone: "+1 917-388-3090",
        website: "https://neurotherapeutixnyc.com/",
        rating: 4.7,
        reviewCount: 43,
        workingHours: {
            "Monday": ["9AM-7PM"],
            "Tuesday": ["9AM-7PM"],
            "Wednesday": ["9AM-7PM"],
            "Thursday": ["9AM-7PM"],
            "Friday": ["9AM-7PM"],
            "Saturday": ["9AM-7PM"],
            "Sunday": ["9AM-7PM"]
        },
        googlePlaceId: "ChIJ5RfJJvVZwokRg1zYoHi-8Uc",
        category: "Mental health clinic",
        subtypes: ["Mental health clinic", "Mental health service"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible restroom", "Wheelchair accessible seating", "LGBTQ+ friendly", "Transgender safespace"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "Lenox Hill Mind Care | TMS Therapy & Ketamine Treatment",
        slug: "lenox-hill-mind-care-nyc",
        type: "clinical",
        address: {
            street: "132 E 22nd St P1",
            city: "New York",
            state: "New York",
            stateCode: "NY",
            zip: "10010"
        },
        phone: "+1 914-574-5393",
        website: "https://lenoxhillmindcare.com/",
        rating: 3.9,
        reviewCount: 14,
        workingHours: {
            "Monday": ["9AM-7PM"],
            "Wednesday": ["9AM-5PM"],
            "Thursday": ["9AM-5PM"],
            "Friday": ["9AM-3PM"]
        },
        googlePlaceId: "ChIJj2djAb5YwokRRkiVILIq0Oo",
        photo: "https://lh3.googleusercontent.com/p/AF1QipP1tgqMhVUANo8u0-inns4EQw4CyTEQhsIodVD_=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist", "Mental health clinic", "Mental health service"],
        accessibility: ["Wheelchair accessible entrance"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "Mid City TMS",
        slug: "mid-city-tms-nyc",
        type: "clinical",
        address: {
            street: "280 Madison Ave STE 1102",
            city: "New York",
            state: "New York",
            stateCode: "NY",
            zip: "10016"
        },
        phone: "+1 212-517-1867",
        website: "https://www.midcitytms.com/",
        rating: 4.3,
        reviewCount: 3,
        workingHours: {
            "Monday": ["8AM-8PM"],
            "Tuesday": ["8AM-8PM"],
            "Wednesday": ["8AM-8PM"],
            "Thursday": ["8AM-8PM"],
            "Friday": ["8AM-8PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJYT7l44JZwokRLHDy0tGA1Lw",
        photo: "https://lh3.googleusercontent.com/p/AF1QipOVE81rHZGjnfjE3WftQqlWwGGhLrguYH6pj6ra=w800-h500-k-no",
        category: "Doctor",
        subtypes: ["Doctor", "General practitioner", "Mental health clinic", "Mental health service", "Psychotherapist"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// Connecticut Clinics
export const CT_CLINICS: RealClinic[] = [
    {
        name: "TMS Therapy at Contemporary Care - Danbury",
        slug: "tms-therapy-contemporary-care-danbury",
        type: "clinical",
        address: {
            street: "84 Hospital Ave Suite 1",
            city: "Danbury",
            state: "Connecticut",
            stateCode: "CT",
            zip: "06810"
        },
        phone: "+1 203-733-6676",
        website: "https://contemporarycarecenters.com/tms-therapy-in-danbury-ct/",
        rating: 4.8,
        reviewCount: 15,
        workingHours: {
            "Monday": ["9AM-5PM"],
            "Tuesday": ["9AM-5PM"],
            "Wednesday": ["9AM-5PM"],
            "Thursday": ["9AM-5PM"],
            "Friday": ["9AM-5PM"],
            "Saturday": ["9AM-1PM"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJye6C-9b_54kRYLSgf6IruaQ",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist"],
        accessibility: ["Wheelchair accessible parking lot"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "Connecticut TMS LLC - New Milford",
        slug: "connecticut-tms-new-milford",
        type: "clinical",
        address: {
            street: "30 Bridge St STE 103",
            city: "New Milford",
            state: "Connecticut",
            stateCode: "CT",
            zip: "06776"
        },
        phone: "+1 860-799-8344",
        website: "https://www.cttms.org/",
        rating: 5.0,
        reviewCount: 1,
        workingHours: {
            "Monday": ["9AM-6PM"],
            "Tuesday": ["9AM-5:30PM"],
            "Wednesday": ["9AM-5:30PM"],
            "Thursday": ["9AM-5:30PM"],
            "Friday": ["9AM-5:30PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJGwfyqr3154kRC7pz2wF5XxI",
        photo: "https://lh3.googleusercontent.com/p/AF1QipMYxQnpW6vvI45PbRkOLO2C4QQkSj-x8MqTyvmH=w800-h500-k-no",
        category: "Mental health service",
        subtypes: ["Mental health service"],
        accessibility: ["Wheelchair accessible parking lot"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// New Jersey Clinics
export const NJ_CLINICS: RealClinic[] = [
    {
        name: "Health Wellness Synergy - TMS Therapy Treatment NJ",
        slug: "health-wellness-synergy-tms-fort-lee-nj",
        type: "clinical",
        address: {
            street: "440 West St Suite 318",
            city: "Fort Lee",
            state: "New Jersey",
            stateCode: "NJ",
            zip: "07024"
        },
        phone: "+1 201-500-9728",
        website: "https://hwscenter.com/",
        rating: 5.0,
        reviewCount: 3,
        workingHours: {
            "Monday": ["8AM-9PM"],
            "Tuesday": ["8AM-9PM"],
            "Wednesday": ["8AM-9PM"],
            "Thursday": ["8AM-9PM"],
            "Friday": ["8AM-9PM"],
            "Saturday": ["8AM-9PM"],
            "Sunday": ["8AM-9PM"]
        },
        googlePlaceId: "ChIJqU6lqQv3wokRC9NXQO9gpgE",
        photo: "https://lh3.googleusercontent.com/p/AF1QipPwyLFoODRaVSN9_L0TQulhoz2oJGkXoM0eQ1CA=w800-h500-k-no",
        category: "Psychiatrist",
        subtypes: ["Psychiatrist", "Child psychiatrist", "Child psychologist", "Medical clinic", "Mental health clinic", "Mental health service", "Psychoanalyst", "Psychologist", "Psychotherapist", "Wellness center"],
        accessibility: ["Wheelchair accessible parking lot", "Wheelchair accessible restroom", "LGBTQ+ friendly", "Transgender safespace", "Women-owned"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "The TMS Center of New Jersey",
        slug: "tms-center-of-new-jersey-tinton-falls",
        type: "clinical",
        address: {
            street: "55 Gilbert St N #2203",
            city: "Tinton Falls",
            state: "New Jersey",
            stateCode: "NJ",
            zip: "07701"
        },
        phone: "+1 732-889-5689",
        website: "http://www.thetmscenterofnj.com/",
        rating: 4.7,
        reviewCount: 14,
        workingHours: {
            "Monday": ["9AM-6PM"],
            "Tuesday": ["9AM-6PM"],
            "Wednesday": ["9AM-6PM"],
            "Thursday": ["9AM-6PM"],
            "Friday": ["9AM-6PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJBWvMoNQvwokREnfak0UQy7g",
        photo: "https://lh3.googleusercontent.com/p/AF1QipNbpA2VR4Po-JM5Sz-M3AjIykZI-84mGb4mkXys=w800-h500-k-no",
        category: "Mental health service",
        subtypes: ["Mental health service"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "TMS NEUROHEALTH NJ",
        slug: "tms-neurohealth-nj-colts-neck",
        type: "clinical",
        address: {
            street: "5 Professional Cir #110",
            city: "Colts Neck",
            state: "New Jersey",
            stateCode: "NJ",
            zip: "07722"
        },
        phone: "+1 732-532-4564",
        rating: 5.0,
        reviewCount: 4,
        workingHours: {
            "Monday": ["9AM-6:30PM"],
            "Tuesday": ["9AM-6:30PM"],
            "Wednesday": ["9AM-6:30PM"],
            "Thursday": ["9AM-6:30PM"],
            "Friday": ["9AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJD2AU64kswokRStt9cQukmzw",
        category: "Mental health clinic",
        subtypes: ["Mental health clinic", "Holistic medicine practitioner", "Mental health service"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot"],
        verified: true,
        businessStatus: "OPERATIONAL"
    },
    {
        name: "TMS Health Center",
        slug: "tms-health-center-englewood-nj",
        type: "clinical",
        address: {
            street: "401 S Van Brunt St Rm 302",
            city: "Englewood",
            state: "New Jersey",
            stateCode: "NJ",
            zip: "07631"
        },
        phone: "+1 201-885-3103",
        website: "https://tmshealthcenter.com/",
        rating: 5.0,
        reviewCount: 12,
        workingHours: {
            "Tuesday": ["9AM-5PM"],
            "Wednesday": ["9AM-5PM"],
            "Thursday": ["9AM-5PM"],
            "Friday": ["9AM-5PM"]
        },
        googlePlaceId: "ChIJn2wkEE33wokRDMwCuEYoLWI",
        photo: "https://lh3.googleusercontent.com/p/AF1QipMw57ayQFOnrLJF69JZGcusFzIkEZVDgQyK-CTt=w800-h500-k-no",
        category: "Medical Center",
        subtypes: ["Medical Center"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// Florida Clinics
export const FL_REAL_CLINICS: RealClinic[] = [
    {
        name: "FLORIDA TMS CLINIC",
        slug: "florida-tms-clinic-wesley-chapel",
        type: "clinical",
        address: {
            street: "26843 Tanic Dr STE 101",
            city: "Wesley Chapel",
            state: "Florida",
            stateCode: "FL",
            zip: "33544"
        },
        phone: "+1 813-867-2378",
        website: "https://www.floridatmsclinic.com/tms-wesley-chapel",
        rating: 4.7,
        reviewCount: 62,
        workingHours: {
            "Monday": ["8AM-5PM"],
            "Tuesday": ["8AM-5PM"],
            "Wednesday": ["8AM-5PM"],
            "Thursday": ["8AM-5PM"],
            "Friday": ["8AM-5PM"],
            "Saturday": ["Closed"],
            "Sunday": ["Closed"]
        },
        googlePlaceId: "ChIJy2RuXZmxwogRmZNL64y9pNg",
        photo: "https://lh3.googleusercontent.com/p/AF1QipO2gimif1afNRFE4TScRI_whLbXJiJCnpWgzB4A=w800-h500-k-no",
        category: "Mental health service",
        subtypes: ["Mental health service", "Counselor", "Doctor", "Mental health clinic", "Psychiatrist", "Psychologist"],
        accessibility: ["Wheelchair accessible entrance", "Wheelchair accessible parking lot", "Wheelchair accessible restroom", "Wheelchair accessible seating", "Gender-neutral restroom"],
        verified: true,
        businessStatus: "OPERATIONAL"
    }
];

// Combine all real clinics
export const ALL_REAL_CLINICS: RealClinic[] = [
    ...DC_CLINICS,
    ...FRESNO_CLINICS,
    ...LA_AREA_CLINICS,
    ...NEWPORT_BEACH_CLINICS,
    ...VENTURA_CLINICS,
    ...ARIZONA_REAL_CLINICS,
    ...NY_REAL_CLINICS,
    ...CT_CLINICS,
    ...NJ_CLINICS,
    ...FL_REAL_CLINICS
];

// Default photo for clinics without images
export const DEFAULT_CLINIC_PHOTO = "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=500&fit=crop";

// Helper functions
export function getRealClinicsByState(stateCode: string): RealClinic[] {
    return ALL_REAL_CLINICS.filter(c => c.address.stateCode === stateCode && c.businessStatus === 'OPERATIONAL');
}

export function getRealClinicBySlug(slug: string): RealClinic | undefined {
    return ALL_REAL_CLINICS.find(c => c.slug === slug);
}

export function getOperationalClinics(): RealClinic[] {
    return ALL_REAL_CLINICS.filter(c => c.businessStatus === 'OPERATIONAL');
}

export function getClinicsWithRating(minRating: number): RealClinic[] {
    return ALL_REAL_CLINICS.filter(c => c.rating >= minRating && c.businessStatus === 'OPERATIONAL');
}

// Get photo for clinic (returns default if no photo)
export function getClinicPhoto(clinic: RealClinic): string {
    return clinic.photo || DEFAULT_CLINIC_PHOTO;
}

// Get only clinics WITH photos
export function getClinicsWithPhotos(): RealClinic[] {
    return ALL_REAL_CLINICS.filter(c => c.photo && c.businessStatus === 'OPERATIONAL');
}

