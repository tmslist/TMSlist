// Verified TMS Clinics Data - Real clinics from web research
// Data verified by Dr. Karan Narwal

export interface VerifiedClinic {
    name: string;
    slug: string;
    type: 'clinical' | 'wellness';
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
    };
    phone?: string;
    website?: string;
    machines: string[];
    treatments: string[];
    insuranceAccepted: string[];
    description: string;
    verified: boolean;
    doctors?: {
        name: string;
        title: string;
        specialties: string[];
    }[];
}

// California Verified Clinics
export const CALIFORNIA_CLINICS: VerifiedClinic[] = [
    {
        name: "California TMS Clinics",
        slug: "california-tms-clinics-santa-monica",
        type: "clinical",
        address: {
            street: "2811 Wilshire Blvd",
            city: "Santa Monica",
            state: "CA",
            zip: "90403"
        },
        phone: "(310) 829-7997",
        website: "https://californiatmsclinics.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Leading TMS therapy center in Santa Monica offering NeuroStar Advanced TMS Therapy for treatment-resistant depression.",
        verified: true
    },
    {
        name: "Del Mar Brain and TMS Center",
        slug: "del-mar-brain-tms-san-diego",
        type: "clinical",
        address: {
            street: "12395 El Camino Real, Suite 308",
            city: "San Diego",
            state: "CA",
            zip: "92130"
        },
        phone: "(858) 345-4160",
        website: "https://delmarbrainandtms.com",
        machines: ["NeuroStar", "BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety", "PTSD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Tricare"],
        description: "Comprehensive brain health center in San Diego's Del Mar area specializing in TMS therapy and neuromodulation.",
        verified: true
    },
    {
        name: "Westwood Minds",
        slug: "westwood-minds-los-angeles",
        type: "clinical",
        address: {
            street: "10801 National Blvd, Suite 560",
            city: "Los Angeles",
            state: "CA",
            zip: "90064"
        },
        phone: "(310) 734-4565",
        website: "https://westwoodminds.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Most major insurances"],
        description: "Westwood-based psychiatry practice offering NeuroStar TMS therapy in the Los Angeles area.",
        verified: true
    },
    {
        name: "Southern California TMS Center",
        slug: "southern-california-tms-center-pasadena",
        type: "clinical",
        address: {
            street: "65 N Madison Ave",
            city: "Pasadena",
            state: "CA",
            zip: "91101"
        },
        website: "https://brainsway.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Smoking Cessation"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna"],
        description: "BrainsWay Deep TMS treatment center serving the greater Pasadena and Los Angeles area.",
        verified: true
    },
    {
        name: "Advanced TMS Clinic",
        slug: "advanced-tms-clinic-oceanside",
        type: "clinical",
        address: {
            street: "3231 Waring Court, Suite P",
            city: "Oceanside",
            state: "CA",
            zip: "92056"
        },
        website: "https://neurostar.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield"],
        description: "NeuroStar TMS therapy center in North San Diego County.",
        verified: true
    },
    {
        name: "Wellness TMS Long Beach",
        slug: "wellness-tms-long-beach",
        type: "wellness",
        address: {
            street: "3780 Kilroy Airport Way",
            city: "Long Beach",
            state: "CA",
            zip: "90806"
        },
        website: "https://wellnesstms.com",
        machines: ["Exomind", "NeuroStar"],
        treatments: ["Depression", "Anxiety", "Cognitive Enhancement"],
        insuranceAccepted: ["Contact for details"],
        description: "Wellness-focused TMS center offering both clinical and wellness TMS protocols in Long Beach.",
        verified: true
    },
    {
        name: "Exomind Los Angeles",
        slug: "exomind-los-angeles",
        type: "wellness",
        address: {
            street: "1000 Wilshire Blvd",
            city: "Los Angeles",
            state: "CA",
            zip: "90017"
        },
        website: "https://exomindlosangeles.com",
        machines: ["Exomind"],
        treatments: ["Cognitive Enhancement", "Focus", "Mood Optimization"],
        insuranceAccepted: ["Self-pay", "HSA/FSA"],
        description: "Wellness TMS center offering Exomind technology for cognitive enhancement and mood optimization.",
        verified: true
    }
];

// Florida Verified Clinics
export const FLORIDA_CLINICS: VerifiedClinic[] = [
    {
        name: "Beaches TMS & Brain Health",
        slug: "beaches-tms-jacksonville",
        type: "clinical",
        address: {
            street: "1301 Riverplace Blvd",
            city: "Jacksonville",
            state: "FL",
            zip: "32207"
        },
        website: "https://brainsway.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Jacksonville's premier Deep TMS treatment center using BrainsWay technology.",
        verified: true
    },
    {
        name: "My TMS Miami",
        slug: "my-tms-miami",
        type: "clinical",
        address: {
            street: "9055 SW 87th Ave",
            city: "Miami",
            state: "FL",
            zip: "33176"
        },
        website: "https://mytmstherapy.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Smoking Cessation"],
        insuranceAccepted: ["Most major insurances"],
        description: "Part of the My TMS network offering Deep TMS therapy in Miami.",
        verified: true
    },
    {
        name: "My TMS Boca Raton",
        slug: "my-tms-boca-raton",
        type: "clinical",
        address: {
            street: "951 NW 13th St",
            city: "Boca Raton",
            state: "FL",
            zip: "33486"
        },
        website: "https://mytmstherapy.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Most major insurances"],
        description: "My TMS network location in Boca Raton offering BrainsWay Deep TMS therapy.",
        verified: true
    },
    {
        name: "Neuro Wellness TMS Centers",
        slug: "neuro-wellness-tms-coral-springs",
        type: "clinical",
        address: {
            street: "5050 W Atlantic Blvd",
            city: "Coral Springs",
            state: "FL",
            zip: "33067"
        },
        website: "https://psychologytoday.com",
        machines: ["NeuroStar", "BrainsWay Deep TMS"],
        treatments: ["Depression", "Anxiety", "OCD", "PTSD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna"],
        description: "Comprehensive TMS center serving South Florida including Fort Lauderdale, Davie, and Boca Raton.",
        verified: true
    }
];

// Illinois Verified Clinics
export const ILLINOIS_CLINICS: VerifiedClinic[] = [
    {
        name: "Hopemark Health - Chicago",
        slug: "hopemark-health-chicago",
        type: "clinical",
        address: {
            street: "30 N Michigan Ave",
            city: "Chicago",
            state: "IL",
            zip: "60602"
        },
        website: "https://hopemarkhealth.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety", "Smoking Cessation"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Multi-location TMS provider in Chicagoland offering BrainsWay Deep TMS at Millennium Park.",
        verified: true
    },
    {
        name: "Hopemark Health - Naperville",
        slug: "hopemark-health-naperville",
        type: "clinical",
        address: {
            street: "1051 Perimeter Dr",
            city: "Naperville",
            state: "IL",
            zip: "60563"
        },
        website: "https://hopemarkhealth.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Hopemark Health TMS center in the western Chicago suburbs.",
        verified: true
    },
    {
        name: "Luxury Psychiatry Clinic - Chicago",
        slug: "luxury-psychiatry-clinic-chicago",
        type: "wellness",
        address: {
            street: "1 N State St",
            city: "Chicago",
            state: "IL",
            zip: "60602"
        },
        website: "https://luxurypsychiatryclinic.com",
        machines: ["Exomind"],
        treatments: ["Depression", "Anxiety", "Cognitive Enhancement"],
        insuranceAccepted: ["Self-pay", "Some insurances"],
        description: "Luxury psychiatry practice in Chicago's West Loop offering Exomind wellness TMS.",
        verified: true
    }
];

// New York Verified Clinics
export const NEW_YORK_CLINICS: VerifiedClinic[] = [
    {
        name: "Hope TMS of NY",
        slug: "hope-tms-new-york",
        type: "clinical",
        address: {
            street: "156 William St",
            city: "New York",
            state: "NY",
            zip: "10038"
        },
        website: "https://hopetmsofny.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Oxford"],
        description: "Manhattan-based Deep TMS center offering BrainsWay technology for treatment-resistant depression.",
        verified: true
    },
    {
        name: "Neuropsychiatric Center NYC",
        slug: "neuropsychiatric-center-nyc",
        type: "clinical",
        address: {
            street: "110 E 40th St",
            city: "New York",
            state: "NY",
            zip: "10016"
        },
        website: "https://psychiatristsnyc.com",
        machines: ["BrainsWay Deep TMS", "NeuroStar"],
        treatments: ["Depression", "OCD", "Anxiety", "PTSD"],
        insuranceAccepted: ["Most major insurances"],
        description: "Comprehensive neuropsychiatry practice in Midtown Manhattan offering multiple TMS modalities.",
        verified: true
    }
];

// Texas Verified Clinics
export const TEXAS_CLINICS: VerifiedClinic[] = [
    {
        name: "Sandhya Prashad MD",
        slug: "sandhya-prashad-md-houston",
        type: "clinical",
        address: {
            street: "2929 Allen Pkwy",
            city: "Houston",
            state: "TX",
            zip: "77019"
        },
        website: "https://sprashadmd.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Contact for details"],
        description: "Houston psychiatrist offering BrainsWay Deep TMS therapy for depression and OCD.",
        verified: true
    }
];

// Washington Verified Clinics
export const WASHINGTON_CLINICS: VerifiedClinic[] = [
    {
        name: "University Place TMS Clinic",
        slug: "university-place-tms-clinic",
        type: "clinical",
        address: {
            street: "3400 South 23rd St",
            city: "University Place",
            state: "WA",
            zip: "98466"
        },
        website: "https://uptms.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Premera"],
        description: "Pacific Northwest's Deep TMS specialist serving the greater Tacoma area.",
        verified: true
    }
];

// Arizona Verified Clinics
export const ARIZONA_CLINICS: VerifiedClinic[] = [
    {
        name: "American TMS Clinics - Scottsdale",
        slug: "american-tms-clinics-scottsdale",
        type: "clinical",
        address: { street: "7500 E Pinnacle Peak Rd", city: "Scottsdale", state: "AZ", zip: "85255" },
        website: "https://americantmsclinics.com",
        machines: ["NeuroStar", "BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Leading TMS clinic serving Scottsdale, Phoenix, and Paradise Valley with both NeuroStar and Deep TMS.",
        verified: true
    },
    {
        name: "Bella Vida TMS",
        slug: "bella-vida-tms-phoenix",
        type: "clinical",
        address: { street: "4350 E Camelback Rd", city: "Phoenix", state: "AZ", zip: "85018" },
        website: "https://bellavidatms.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Most major insurances"],
        description: "TMS therapy provider serving Phoenix, Glendale, Scottsdale, and Gilbert areas.",
        verified: true
    },
    {
        name: "TMS Institute of Arizona",
        slug: "tms-institute-arizona-scottsdale",
        type: "clinical",
        address: { street: "10290 N 92nd St", city: "Scottsdale", state: "AZ", zip: "85258" },
        website: "https://tmsinstitute.co",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield"],
        description: "Scottsdale-based TMS institute specializing in treatment-resistant depression.",
        verified: true
    },
    {
        name: "Serenity TMS Centers - Phoenix",
        slug: "serenity-tms-centers-phoenix",
        type: "clinical",
        address: { street: "3030 N Central Ave", city: "Phoenix", state: "AZ", zip: "85012" },
        website: "https://serenitymentalhealthcenters.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Smoking Cessation"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna"],
        description: "Multi-location TMS center with clinics in Phoenix and Chandler offering Deep TMS therapy.",
        verified: true
    }
];

// Colorado Verified Clinics
export const COLORADO_CLINICS: VerifiedClinic[] = [
    {
        name: "Axis Integrated Mental Health",
        slug: "axis-integrated-denver",
        type: "clinical",
        address: { street: "1550 Larimer St", city: "Denver", state: "CO", zip: "80202" },
        website: "https://axismh.com",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety", "PTSD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Cigna", "UnitedHealthcare"],
        description: "Comprehensive mental health center offering Deep TMS in Denver, Boulder, and Westminster.",
        verified: true
    },
    {
        name: "TMS Center of Colorado",
        slug: "tms-center-colorado-lakewood",
        type: "clinical",
        address: { street: "7400 W Colfax Ave", city: "Lakewood", state: "CO", zip: "80214" },
        website: "https://tmscenterofcolorado.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna"],
        description: "TMS therapy center serving the Denver metro area with locations in Lakewood and Denver.",
        verified: true
    },
    {
        name: "Southern Colorado TMS Center",
        slug: "southern-colorado-tms-center",
        type: "clinical",
        address: { street: "2440 N Union Ave", city: "Pueblo", state: "CO", zip: "81003" },
        website: "https://southerncoloradotms.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "Most major insurances"],
        description: "Serving the Southern Colorado region with NeuroStar TMS therapy.",
        verified: true
    }
];

// Georgia Verified Clinics
export const GEORGIA_CLINICS: VerifiedClinic[] = [
    {
        name: "Breakthru Psychiatric Solutions",
        slug: "breakthru-psych-sandy-springs",
        type: "clinical",
        address: { street: "6000 Lake Forrest Dr", city: "Sandy Springs", state: "GA", zip: "30328" },
        website: "https://breakthrupsych.com",
        machines: ["NeuroStar", "BrainsWay Deep TMS"],
        treatments: ["Depression", "Anxiety", "OCD", "PTSD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Offering accelerated TMS protocols in Sandy Springs and Alpharetta, Georgia.",
        verified: true
    },
    {
        name: "Atlanta Integrative Psychiatry",
        slug: "atlanta-integrative-psychiatry",
        type: "clinical",
        address: { street: "3200 Downwood Cir NW", city: "Atlanta", state: "GA", zip: "30327" },
        website: "https://atlantatms.clinic",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Most major insurances"],
        description: "Atlanta-based integrative psychiatry practice offering TMS therapy.",
        verified: true
    },
    {
        name: "Skyland Trail - Glenn Family Wellness Clinic",
        slug: "skyland-trail-atlanta",
        type: "clinical",
        address: { street: "1961 North Druid Hills Rd", city: "Atlanta", state: "GA", zip: "30329" },
        website: "https://skylandtrail.org",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "Bipolar Depression"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna"],
        description: "Nonprofit mental health treatment organization in Atlanta's Brookhaven community.",
        verified: true
    }
];

// Pennsylvania Verified Clinics  
export const PENNSYLVANIA_CLINICS: VerifiedClinic[] = [
    {
        name: "New Directions Mental Health - Pittsburgh",
        slug: "new-directions-pittsburgh",
        type: "clinical",
        address: { street: "301 5th Ave", city: "Pittsburgh", state: "PA", zip: "15222" },
        website: "https://newdirectionspgh.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "UPMC", "Highmark", "Aetna"],
        description: "Multiple locations across southwest Pennsylvania including Pittsburgh, Greensburg, and Wexford.",
        verified: true
    },
    {
        name: "York TMS Clinic",
        slug: "york-tms-clinic",
        type: "clinical",
        address: { street: "425 Limekiln Rd", city: "York", state: "PA", zip: "17404" },
        website: "https://yorktmsclinic.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield"],
        description: "Central Pennsylvania TMS provider serving York and surrounding counties.",
        verified: true
    },
    {
        name: "TMS Center of Lehigh Valley",
        slug: "tms-center-lehigh-valley",
        type: "clinical",
        address: { street: "3100 Emrick Blvd", city: "Bethlehem", state: "PA", zip: "18020" },
        website: "https://tmsallentownpa.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Cigna"],
        description: "Serving the Lehigh Valley region including Allentown and Bethlehem.",
        verified: true
    }
];

// Ohio Verified Clinics
export const OHIO_CLINICS: VerifiedClinic[] = [
    {
        name: "TMS Institute of Ohio",
        slug: "tms-institute-ohio-sandusky",
        type: "clinical",
        address: { street: "2600 Hayes Ave", city: "Sandusky", state: "OH", zip: "44870" },
        website: "https://tmssanduskyohio.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna"],
        description: "Northern Ohio TMS center providing NeuroStar Advanced Therapy.",
        verified: true
    },
    {
        name: "Neurobehavioral Medicine Consultants",
        slug: "neurobehavioral-medicine-bellaire",
        type: "clinical",
        address: { street: "4525 Belmont Ave", city: "Bellaire", state: "OH", zip: "43906" },
        website: "https://neurobehavioralmed.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "Most major insurances"],
        description: "Multi-location practice with clinics in Bellaire, Steubenville, and Cambridge.",
        verified: true
    },
    {
        name: "Greenbrook Mental Wellness - North Canton",
        slug: "greenbrook-north-canton",
        type: "clinical",
        address: { street: "4450 Portage St NW", city: "North Canton", state: "OH", zip: "44720" },
        website: "https://greenbrooktms.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Part of the national Greenbrook TMS network serving Northeast Ohio.",
        verified: true
    }
];

// Michigan Verified Clinics
export const MICHIGAN_CLINICS: VerifiedClinic[] = [
    {
        name: "Modern Mind Clinic",
        slug: "modern-mind-clinic-michigan",
        type: "clinical",
        address: { street: "5333 McAuley Dr", city: "Ann Arbor", state: "MI", zip: "48106" },
        website: "https://modernmindclinic.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield of Michigan", "Priority Health"],
        description: "Michigan psychiatric practice offering NeuroStar TMS therapy.",
        verified: true
    },
    {
        name: "Greenbrook Mental Wellness - Livonia",
        slug: "greenbrook-livonia-michigan",
        type: "clinical",
        address: { street: "17117 W 9 Mile Rd", city: "Livonia", state: "MI", zip: "48152" },
        website: "https://greenbrooktms.com",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna"],
        description: "Greenbrook TMS network location serving Metro Detroit area.",
        verified: true
    },
    {
        name: "Pine Rest ECT and TMS Clinic",
        slug: "pine-rest-tms-grand-rapids",
        type: "clinical",
        address: { street: "300 68th St SE", city: "Grand Rapids", state: "MI", zip: "49548" },
        website: "https://pinerest.org",
        machines: ["NeuroStar", "BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Priority Health", "Aetna"],
        description: "Comprehensive ECT and TMS clinic at Pine Rest Christian Mental Health Services.",
        verified: true
    }
];

// All verified clinics combined
export const ALL_VERIFIED_CLINICS: VerifiedClinic[] = [
    ...CALIFORNIA_CLINICS,
    ...FLORIDA_CLINICS,
    ...ILLINOIS_CLINICS,
    ...NEW_YORK_CLINICS,
    ...TEXAS_CLINICS,
    ...WASHINGTON_CLINICS,
    ...ARIZONA_CLINICS,
    ...COLORADO_CLINICS,
    ...GEORGIA_CLINICS,
    ...PENNSYLVANIA_CLINICS,
    ...OHIO_CLINICS,
    ...MICHIGAN_CLINICS
];


// Get clinics by type
export function getClinicsByType(type: 'clinical' | 'wellness'): VerifiedClinic[] {
    return ALL_VERIFIED_CLINICS.filter(clinic => clinic.type === type);
}

// Get clinics by state
export function getClinicsByState(state: string): VerifiedClinic[] {
    return ALL_VERIFIED_CLINICS.filter(clinic => clinic.address.state === state);
}

// Get wellness clinics
export function getWellnessClinics(): VerifiedClinic[] {
    return getClinicsByType('wellness');
}
