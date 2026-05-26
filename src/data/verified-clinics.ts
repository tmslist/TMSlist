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
export const HI_CLINICS: VerifiedClinic[] = [
    {
        name: "Hawaii Mental Health Specialists",
        slug: "hawaii-mental-health-specialists-honolulu",
        type: "clinical",
        address: { street: "1188 Bishop St, Suite 2304", city: "Honolulu", state: "HI", zip: "96813" },
        phone: "(808) 369-0184",
        website: "https://www.hawaiidepressionclinic.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "PTSD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "Honolulu-based outpatient psychiatric clinic that delivers NeuroStar TMS for adolescents and adults with treatment-resistant depression, with extensive experience serving Hawaii's military community.",
        verified: true,
    },
    {
        name: "Advanced Psychiatric Therapeutics",
        slug: "advanced-psychiatric-therapeutics-honolulu",
        type: "clinical",
        address: { street: "1010 S King St, Suite 405", city: "Honolulu", state: "HI", zip: "96814" },
        phone: "(808) 591-1070",
        website: "https://www.apt-hi.com/",
        machines: ["MagVenture"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "HMSA", "Tricare"],
        description: "Hawaii's first medical clinic to offer TMS, providing repetitive TMS and theta burst stimulation for treatment-resistant depression and OCD.",
        verified: true,
    },
    {
        name: "Ho'ola Pono TMS Hawaii",
        slug: "hoola-pono-tms-hawaii-pearl-city",
        type: "clinical",
        address: { street: "98-1247 Kaahumanu St, Suite 314", city: "Pearl City", state: "HI", zip: "96782" },
        website: "https://hoolaponotmshawaii.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "HMSA", "Tricare"],
        description: "Outpatient mental health clinic serving Pearl City and the surrounding Honolulu area with NeuroStar TMS therapy for major depressive disorder.",
        verified: true,
    },
];

export const WYOMING_CLINICS: VerifiedClinic[] = [
    {
        name: "Wyoming Behavioral Institute",
        slug: "wyoming-behavioral-institute-casper",
        type: "clinical",
        address: { street: "2521 East 15th Street", city: "Casper", state: "WY", zip: "82609" },
        phone: "(307) 439-2139",
        website: "https://wbihelp.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression"],
        insuranceAccepted: ["Medicare", "Medicaid", "BlueCross BlueShield", "Aetna", "Cigna", "Tricare"],
        description: "An 81-bed acute psychiatric hospital serving children, adolescents, and adults; offers outpatient TMS therapy for adults with treatment-resistant major depression.",
        verified: true,
    },
    {
        name: "Wyoming Wellness Center",
        slug: "wyoming-wellness-center-cheyenne",
        type: "clinical",
        address: { street: "1705 Albany Ave", city: "Cheyenne", state: "WY", zip: "82001" },
        phone: "(307) 532-3035",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Cheyenne mental health practice providing TMS therapy and ketamine-assisted treatment for depression and treatment-resistant mood disorders.",
        verified: true,
    },
];

export const ALASKA_CLINICS: VerifiedClinic[] = [
    {
        name: "True North TMS",
        slug: "true-north-tms-anchorage",
        type: "clinical",
        address: { street: "920 East 72nd Ave", city: "Anchorage", state: "AK", zip: "99518" },
        phone: "(907) 344-0753",
        website: "https://truenorthtms.com/",
        machines: ["NeuroStar", "BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "The only Alaskan-owned and physician-operated TMS clinic in the state, dedicated exclusively to delivering TMS therapy since 2018.",
        verified: true,
        doctors: [
            { name: "David Telford, MD", title: "Medical Director", specialties: ["TMS Therapy", "Psychiatry", "Treatment-Resistant Depression"] },
        ],
    },
    {
        name: "Greenbrook TMS Anchorage",
        slug: "greenbrook-tms-anchorage",
        type: "clinical",
        address: { street: "4015 Lake Otis Pkwy, Suite 201", city: "Anchorage", state: "AK", zip: "99508" },
        phone: "(907) 891-3308",
        website: "https://www.greenbrooktms.com/alaska-centers/anchorage",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "National TMS provider's Anchorage center delivering NeuroStar TMS and Spravato esketamine treatment for depression and OCD.",
        verified: true,
    },
    {
        name: "Katie's Way Plus",
        slug: "katies-way-plus-anchorage",
        type: "clinical",
        address: { street: "2751 DeBarr Rd, Suite 300", city: "Anchorage", state: "AK", zip: "99508" },
        phone: "(907) 206-4088",
        website: "https://katieswayplus.com/",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Anchorage outpatient mental health clinic offering Deep TMS therapy alongside medication management and psychotherapy.",
        verified: true,
    },
];

export const NORTH_DAKOTA_CLINICS: VerifiedClinic[] = [
    {
        name: "Upper Midwest TMS",
        slug: "upper-midwest-tms-fargo",
        type: "clinical",
        address: { street: "5621 36th Ave S, Unit 300", city: "Fargo", state: "ND", zip: "58104" },
        phone: "(701) 532-1060",
        website: "https://uppermidwesttms.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Independent psychiatric clinic in Fargo focused exclusively on TMS for treatment-resistant depression and OCD, serving the Upper Midwest with referrals from psychiatrists, psychologists, and primary-care physicians.",
        verified: true,
        doctors: [
            { name: "Lisa Schock, MD", title: "Co-Founder, Psychiatrist", specialties: ["Psychiatry", "TMS Therapy", "Mood Disorders"] },
            { name: "Jonathan Olivas, MD", title: "Co-Founder, Psychiatrist", specialties: ["Psychiatry", "TMS Therapy", "Treatment-Resistant Depression"] },
        ],
    },
    {
        name: "Journey to Wellness",
        slug: "journey-to-wellness-bismarck",
        type: "clinical",
        address: { street: "418 E Broadway Ave, Suite 240", city: "Bismarck", state: "ND", zip: "58501" },
        website: "https://www.journeytowellnesspllc.com/",
        machines: ["MagVenture"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Integrative psychiatric private practice in Bismarck offering Exomind TMS, ketamine infusions, medication management, and counseling.",
        verified: true,
        doctors: [
            { name: "Jackie Materi, PMHNP-BC", title: "Psychiatric Nurse Practitioner, Owner", specialties: ["Psychiatric Mental Health", "TMS Therapy", "Integrative Psychiatry"] },
        ],
    },
    {
        name: "Wellness Rediscovered PLLC",
        slug: "wellness-rediscovered-bismarck",
        type: "clinical",
        address: { street: "705 E Main Ave", city: "Bismarck", state: "ND", zip: "58501" },
        machines: ["NeuroStar"],
        treatments: ["Depression"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Bismarck outpatient practice providing TMS therapy for major depressive disorder and treatment-resistant depression.",
        verified: true,
    },
];

export const RHODE_ISLAND_CLINICS: VerifiedClinic[] = [
    {
        name: "Butler Hospital TMS Clinic",
        slug: "butler-hospital-tms-clinic-providence",
        type: "clinical",
        address: { street: "345 Blackstone Boulevard, Delmonico 1A", city: "Providence", state: "RI", zip: "02906" },
        phone: "(401) 455-6632",
        website: "https://www.butler.org/services/outpatient/transcranial-magnetic-stimulation",
        machines: ["NeuroStar", "MagVenture"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "One of the busiest TMS programs in the Northeast, opened to the public in 2009 and affiliated with the Brown University Department of Psychiatry.",
        verified: true,
        doctors: [
            { name: "Linda Carpenter, MD", title: "Director, TMS Clinic and Neuromodulation Research Facility", specialties: ["TMS Therapy", "Mood Disorders", "Neuromodulation Research"] },
        ],
    },
    {
        name: "Brown University Health Rhode Island TMS Center",
        slug: "brown-university-health-tms-center-providence",
        type: "clinical",
        address: { street: "146 West River Street", city: "Providence", state: "RI", zip: "02904" },
        phone: "(401) 444-2315",
        website: "https://www.brownhealth.org/centers-services/transcranial-magnetic-stimulation-tms-center",
        machines: ["NeuroStar"],
        treatments: ["Depression"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Hospital-based TMS center under Brown University Health providing physician-supervised NeuroStar TMS for major depressive disorder.",
        verified: true,
    },
    {
        name: "Revive Therapeutic Services",
        slug: "revive-therapeutic-services-north-kingstown",
        type: "clinical",
        address: { street: "1130 Ten Rod Rd, Suite C-207", city: "North Kingstown", state: "RI", zip: "02852" },
        phone: "(401) 648-7172",
        website: "https://www.revivetherapeuticservices.com/tms",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Outpatient mental health practice providing NeuroStar TMS therapy for depression in Rhode Island.",
        verified: true,
    },
];

export const SOUTH_CAROLINA_CLINICS: VerifiedClinic[] = [
    {
        name: "MUSC Health TMS Clinic",
        slug: "musc-health-tms-clinic-charleston",
        type: "clinical",
        address: { street: "67 President Street", city: "Charleston", state: "SC", zip: "29425" },
        phone: "(843) 792-9888",
        website: "https://muschealth.org/medical-services/psychiatry/brain-stimulation/tms",
        machines: ["NeuroStar", "MagVenture"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "Medicaid", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "Academic medical center TMS program offering repetitive TMS, accelerated TMS, and Stanford Neuromodulation Therapy (SNT) at the Institute of Psychiatry.",
        verified: true,
    },
    {
        name: "Carolina Psychiatry",
        slug: "carolina-psychiatry-greenville",
        type: "clinical",
        address: { street: "1126 S Pleasantburg Dr, Suite 2A", city: "Greenville", state: "SC", zip: "29605" },
        phone: "(864) 729-8884",
        website: "https://carolinapsychiatry.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Outpatient psychiatric practice serving Anderson, Greenville, Seneca, and Spartanburg with NeuroStar TMS for treatment-resistant depression.",
        verified: true,
    },
    {
        name: "Greenbrook TMS Irmo",
        slug: "greenbrook-tms-irmo",
        type: "clinical",
        address: { street: "7001 St Andrews Rd, Suite 60", city: "Columbia", state: "SC", zip: "29212" },
        phone: "(803) 220-9200",
        website: "https://www.greenbrooktms.com/south-carolina-centers/irmo",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "Greenbrook center serving the Columbia area with NeuroStar TMS therapy and Spravato esketamine nasal spray for treatment-resistant depression.",
        verified: true,
    },
];

export const NEW_MEXICO_CLINICS: VerifiedClinic[] = [
    {
        name: "TMS New Mexico",
        slug: "tms-new-mexico-santa-fe",
        type: "clinical",
        address: { street: "300 Paseo De Peralta, Suite 208", city: "Santa Fe", state: "NM", zip: "87501" },
        website: "https://www.tmsnewmexico.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Presbyterian"],
        description: "Community-centered Santa Fe mental health clinic offering outpatient TMS for depression and other mood disorders.",
        verified: true,
    },
    {
        name: "Sage Neuroscience Center",
        slug: "sage-neuroscience-center-albuquerque",
        type: "clinical",
        address: { street: "9201 Montgomery Blvd NE, Suite 401", city: "Albuquerque", state: "NM", zip: "87111" },
        phone: "(505) 884-1114",
        website: "https://sageclinic.org/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Presbyterian", "UnitedHealthcare"],
        description: "Multi-specialty behavioral health practice in Albuquerque providing six-week NeuroStar TMS courses with taper sessions for treatment-resistant depression.",
        verified: true,
    },
    {
        name: "Chrysalis Psychiatry",
        slug: "chrysalis-psychiatry-albuquerque",
        type: "clinical",
        address: { street: "5400 Gibson Blvd SE", city: "Albuquerque", state: "NM", zip: "87108" },
        website: "https://chrysalispsychiatry.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Albuquerque outpatient psychiatric practice offering NeuroStar Advanced TMS therapy as a non-invasive, medication-free treatment for depression.",
        verified: true,
    },
];

export const NEVADA_CLINICS: VerifiedClinic[] = [
    {
        name: "Nevada Mental Health",
        slug: "nevada-mental-health-las-vegas",
        type: "clinical",
        address: { street: "5495 S Rainbow Blvd, Suite 201", city: "Las Vegas", state: "NV", zip: "89118" },
        phone: "(702) 825-1325",
        website: "https://nevadamentalhealth.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD", "Smoking Cessation"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Las Vegas outpatient psychiatric clinic providing NeuroStar TMS therapy for patients aged 15-86 with depression, anxiety, OCD, and smoking addiction.",
        verified: true,
    },
    {
        name: "Delve Psychiatry",
        slug: "delve-psychiatry-las-vegas",
        type: "clinical",
        address: { street: "8930 W Sunset Rd, Suite 230", city: "Las Vegas", state: "NV", zip: "89148" },
        phone: "(702) 897-7250",
        website: "https://www.delvepsychiatry.com/",
        machines: ["MagVenture"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Las Vegas outpatient practice using a neuronavigated TMS system to deliver targeted treatment for depression and OCD.",
        verified: true,
        doctors: [
            { name: "John Reitano, MD", title: "Psychiatrist, Founder", specialties: ["Psychiatry", "TMS Therapy", "Mood Disorders"] },
        ],
    },
    {
        name: "Holistic Behavioral & TMS Therapy",
        slug: "holistic-behavioral-tms-therapy-las-vegas",
        type: "clinical",
        address: { street: "7251 W Lake Mead Blvd, Suite 300", city: "Las Vegas", state: "NV", zip: "89128" },
        website: "https://www.holisticbehavioralnv.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Las Vegas behavioral health provider specializing in TMS and Spravato esketamine for treatment-resistant depression.",
        verified: true,
    },
];

export const NEBRASKA_CLINICS: VerifiedClinic[] = [
    {
        name: "Alivation Health",
        slug: "alivation-health-lincoln",
        type: "clinical",
        address: { street: "5631 S 48th St", city: "Lincoln", state: "NE", zip: "68516" },
        phone: "(402) 476-6060",
        website: "https://alivation.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "Lincoln integrative health practice offering TMS therapy for treatment-resistant depression and OCD alongside medication management and clinical research.",
        verified: true,
    },
    {
        name: "TMS Institute of Great Plains Mental Health",
        slug: "tms-institute-great-plains-omaha",
        type: "clinical",
        address: { street: "9202 W Dodge Rd, Suite 304", city: "Omaha", state: "NE", zip: "68114" },
        website: "https://tmshelpsomaha.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Omaha-based TMS clinic providing a holistic approach to depression remission through NeuroStar TMS therapy.",
        verified: true,
    },
    {
        name: "Meridian Mental Health and TMS Center",
        slug: "meridian-mental-health-tms-omaha",
        type: "clinical",
        address: { street: "6910 Pacific St, Suite 100", city: "Omaha", state: "NE", zip: "68106" },
        phone: "(402) 504-3707",
        website: "https://www.mmhaomaha.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Comprehensive psychiatric and counseling practice in Omaha offering TMS therapy for depression and other mood disorders.",
        verified: true,
    },
];

export const VERMONT_CLINICS: VerifiedClinic[] = [
    {
        name: "North Country Behavioral Medicine",
        slug: "north-country-behavioral-medicine-colchester",
        type: "clinical",
        address: { street: "441 Watertower Circle, Suite 200", city: "Colchester", state: "VT", zip: "05446" },
        phone: "(802) 404-1492",
        website: "https://ncbmvermont.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "MVP"],
        description: "Burlington-area cutting-edge psychiatric practice offering TMS therapy for patients with depression that has not responded to medications.",
        verified: true,
    },
    {
        name: "State Street TMS",
        slug: "state-street-tms-montpelier",
        type: "clinical",
        address: { street: "100 State St", city: "Montpelier", state: "VT", zip: "05602" },
        website: "https://www.statestreettms.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "MVP"],
        description: "Vermont psychiatric practice providing breakthrough NeuroStar TMS care for treatment-resistant major depressive disorder.",
        verified: true,
    },
];

export const DELAWARE_CLINICS: VerifiedClinic[] = [
    {
        name: "Brandywine Valley TMS",
        slug: "brandywine-valley-tms-wilmington",
        type: "clinical",
        address: { street: "2700 Silverside Rd, Suite 1B", city: "Wilmington", state: "DE", zip: "19810" },
        website: "https://www.brandywinevalleytms.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Highmark"],
        description: "Wilmington TMS clinic serving New Castle County and northern Delaware with bilingual psychiatrist consultations and FDA-approved NeuroStar TMS therapy.",
        verified: true,
    },
    {
        name: "TMS of Wilmington",
        slug: "tms-of-wilmington",
        type: "clinical",
        address: { street: "2000 Pennsylvania Ave, Suite 207", city: "Wilmington", state: "DE", zip: "19806" },
        website: "https://www.tmsofwilmington.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Wilmington outpatient clinic dedicated to TMS treatment for depression, serving Delaware, Pennsylvania, New Jersey, and Maryland.",
        verified: true,
    },
    {
        name: "Psychiatry Delaware",
        slug: "psychiatry-delaware-newark",
        type: "clinical",
        address: { street: "200 Hygeia Dr, Suite 1100", city: "Newark", state: "DE", zip: "19713" },
        website: "https://psychiatrydelaware.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Highmark"],
        description: "Outpatient psychiatric practice serving New Castle County with NeuroStar TMS therapy for major depressive disorder.",
        verified: true,
    },
];

export const UTAH_CLINICS: VerifiedClinic[] = [
    {
        name: "NeuroHealth Utah",
        slug: "neurohealth-utah-bountiful",
        type: "clinical",
        address: { street: "1551 Renaissance Towne Dr, Suite 290", city: "Bountiful", state: "UT", zip: "84010" },
        website: "https://neurohealthutah.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "SelectHealth"],
        description: "Salt Lake City-area outpatient psychiatric clinic offering NeuroStar TMS therapy for depression and anxiety.",
        verified: true,
    },
    {
        name: "NeuroWellness Utah",
        slug: "neurowellness-utah-lehi",
        type: "clinical",
        address: { street: "3300 N Triumph Blvd, Suite 100", city: "Lehi", state: "UT", zip: "84043" },
        phone: "(385) 352-7137",
        website: "https://www.neurowellnessutah.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "SelectHealth"],
        description: "Lehi-based clinic serving Salt Lake City, Provo, Sandy, and Draper with TMS, Spravato, and intensive outpatient programs for treatment-resistant depression.",
        verified: true,
    },
    {
        name: "Neurobehavioral Center for Growth",
        slug: "neurobehavioral-center-for-growth-salt-lake-city",
        type: "clinical",
        address: { street: "1399 South 700 East, Suite 1", city: "Salt Lake City", state: "UT", zip: "84105" },
        website: "https://www.neurobcg.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "SelectHealth"],
        description: "Salt Lake City practice offering NeuroStar TMS therapy with 19-37 minute sessions over a 4-6 week treatment course.",
        verified: true,
    },
];

export const NEW_HAMPSHIRE_CLINICS: VerifiedClinic[] = [
    {
        name: "The Mental Health Center of Greater Manchester",
        slug: "mental-health-center-greater-manchester",
        type: "clinical",
        address: { street: "401 Cypress St", city: "Manchester", state: "NH", zip: "03103" },
        phone: "(603) 668-4111",
        website: "https://www.mhcgm.org/mhcgm-programs/tms-therapy/",
        machines: ["NeuroStar"],
        treatments: ["Depression"],
        insuranceAccepted: ["Medicare", "Medicaid", "BlueCross BlueShield", "Aetna", "Cigna", "Anthem"],
        description: "Community mental health center providing prescribed TMS treatments for adults 18 and older through its Bedford Counseling Associates affiliate.",
        verified: true,
    },
    {
        name: "Center for Life Management",
        slug: "center-for-life-management-derry",
        type: "clinical",
        address: { street: "10 Tsienneto Rd", city: "Derry", state: "NH", zip: "03038" },
        phone: "(603) 434-1577",
        website: "https://tmsatclm.org/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "Medicaid", "BlueCross BlueShield", "Aetna", "Cigna", "Anthem"],
        description: "Southern New Hampshire community mental health provider offering NeuroStar TMS therapy for treatment-resistant depression.",
        verified: true,
    },
    {
        name: "Innovative Psychiatry",
        slug: "innovative-psychiatry-bedford",
        type: "clinical",
        address: { street: "169 South River Rd, Suite 1", city: "Bedford", state: "NH", zip: "03110" },
        website: "https://www.ipcnh.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Anthem"],
        description: "Bedford psychiatric practice offering FDA-approved TMS and Spravato treatments for depression and anxiety, covered by most major insurers.",
        verified: true,
    },
];

export const MAINE_CLINICS: VerifiedClinic[] = [
    {
        name: "NeuroHealth Maine",
        slug: "neurohealth-maine-south-portland",
        type: "clinical",
        address: { street: "837 Broadway", city: "South Portland", state: "ME", zip: "04106" },
        website: "https://neurohealthmaine.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "PTSD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Anthem", "Tricare"],
        description: "Portland-area clinic dedicated to treating depression and anxiety through targeted NeuroStar TMS therapy, with Maine's longest experience providing TMS.",
        verified: true,
    },
    {
        name: "TMS Maine",
        slug: "tms-maine-portland",
        type: "clinical",
        address: { street: "222 Auburn St, Suite 102", city: "Portland", state: "ME", zip: "04103" },
        website: "https://www.tmsmaine.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Anthem"],
        description: "Portland TMS-focused clinic serving northern New England with FDA-approved transcranial magnetic stimulation for treatment-resistant depression.",
        verified: true,
    },
    {
        name: "Touchstone Associates",
        slug: "touchstone-associates-portland",
        type: "clinical",
        address: { street: "222 Auburn St", city: "Portland", state: "ME", zip: "04103" },
        website: "https://touchstonemaine.com/tms",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Anthem"],
        description: "Portland mental health practice using NeuroStar TMS technology, with patients often seeing results within 2-4 weeks of starting treatment.",
        verified: true,
    },
];

export const SOUTH_DAKOTA_CLINICS: VerifiedClinic[] = [
    {
        name: "MWI Health Sioux Falls",
        slug: "mwi-health-sioux-falls",
        type: "clinical",
        address: { street: "6201 S Minnesota Ave, Suite 100", city: "Sioux Falls", state: "SD", zip: "57108" },
        website: "https://mwihealth.org/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Sanford Health Plan"],
        description: "Multi-location behavioral health practice providing FDA-cleared TMS therapy and Spravato esketamine for depression and OCD across South Dakota and Iowa.",
        verified: true,
    },
    {
        name: "Manlove Brain + Body Health",
        slug: "manlove-brain-body-health-rapid-city",
        type: "clinical",
        address: { street: "640 Flormann St, Suite 100", city: "Rapid City", state: "SD", zip: "57701" },
        website: "https://www.manlovehealth.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "First clinic in western South Dakota to offer TMS, specializing in treatment-resistant depression with TMS and Spravato esketamine.",
        verified: true,
    },
];

export const IDAHO_CLINICS: VerifiedClinic[] = [
    {
        name: "MidValley Healthcare",
        slug: "midvalley-healthcare-boise",
        type: "clinical",
        address: { street: "9550 W Bethel Court, Suite 100", city: "Boise", state: "ID", zip: "83709" },
        website: "https://midvalleyhealthcare.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Tricare"],
        description: "Boise-area outpatient mental health practice offering non-invasive NeuroStar TMS therapy with patients awake and alert during sessions.",
        verified: true,
    },
    {
        name: "TMS Solutions Boise",
        slug: "tms-solutions-boise",
        type: "clinical",
        address: { street: "1188 W Iron Eagle Dr, Suite 130", city: "Eagle", state: "ID", zip: "83616" },
        website: "https://www.brainsway.com/location/tms-solutions-boise/",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Smoking Cessation"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Tricare"],
        description: "Boise-area Deep TMS provider offering FDA-approved BrainsWay treatment for depression, OCD, and smoking addiction.",
        verified: true,
    },
    {
        name: "NuMe TMS Boise",
        slug: "nume-tms-boise",
        type: "clinical",
        address: { street: "3023 E Copper Point Dr, Suite 103", city: "Meridian", state: "ID", zip: "83642" },
        website: "https://www.numetms.com/",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Boise and Meridian depression treatment center using BrainsWay Deep TMS to deliver faster, more efficacious sessions for treatment-resistant patients.",
        verified: true,
    },
];

export const OKLAHOMA_CLINICS: VerifiedClinic[] = [
    {
        name: "TMS Therapy Center of Tulsa",
        slug: "tms-therapy-center-of-tulsa",
        type: "clinical",
        address: { street: "6108 South Memorial Drive", city: "Tulsa", state: "OK", zip: "74133" },
        phone: "(918) 627-8858",
        website: "https://www.tulsatms.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Tulsa outpatient clinic offering NeuroStar TMS therapy for recurrent and chronic treatment-resistant depression.",
        verified: true,
        doctors: [
            { name: "Sherif Sokkar, MD", title: "Medical Director", specialties: ["Psychiatry", "TMS Therapy", "Treatment-Resistant Depression"] },
        ],
    },
    {
        name: "Edmond Psychiatric Associates",
        slug: "edmond-psychiatric-associates-edmond",
        type: "clinical",
        address: { street: "3617 S Broadway, Suite 100", city: "Edmond", state: "OK", zip: "73013" },
        website: "https://edmondpsychiatricassociates.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna"],
        description: "Oklahoma City-area psychiatric clinic that pioneered NeuroStar rTMS in the region beginning in 2009 for treatment-resistant depression.",
        verified: true,
    },
    {
        name: "FutureHealth TMS",
        slug: "futurehealth-tms-lawton",
        type: "clinical",
        address: { street: "1011 SW C Ave, Suite C", city: "Lawton", state: "OK", zip: "73501" },
        website: "https://futurehealthtms.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Tricare"],
        description: "Lawton, Oklahoma TMS clinic serving the Fort Sill military community and southwest Oklahoma with NeuroStar TMS therapy for depression.",
        verified: true,
    },
];

export const KENTUCKY_CLINICS: VerifiedClinic[] = [
    {
        name: "Hagan Health",
        slug: "hagan-health-louisville",
        type: "clinical",
        address: { street: "4169 Westport Rd", city: "Louisville", state: "KY", zip: "40207" },
        website: "https://haganhealth.com/",
        machines: ["NeuroStar", "BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Anthem", "Humana"],
        description: "Louisville psychiatric practice offering both BrainsWay Deep TMS and NeuroStar TMS technologies to treat depression, OCD, and other psychiatric disorders.",
        verified: true,
    },
    {
        name: "Oasis TMS Louisville",
        slug: "oasis-tms-louisville",
        type: "clinical",
        address: { street: "9500 Williamsburg Plaza, Suite 100", city: "Louisville", state: "KY", zip: "40222" },
        phone: "(502) 742-8182",
        website: "https://oasistms.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Humana"],
        description: "Louisville TMS clinic dedicated to NeuroStar TMS therapy for adults with treatment-resistant depression.",
        verified: true,
    },
    {
        name: "Lexington TMS",
        slug: "lexington-tms",
        type: "clinical",
        address: { street: "1401 Harrodsburg Rd, Suite C-185", city: "Lexington", state: "KY", zip: "40504" },
        website: "https://lexingtontms.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "Humana", "Anthem"],
        description: "Central Kentucky TMS clinic offering both standard and accelerated TMS protocols for depression.",
        verified: true,
    },
];

export const MINNESOTA_CLINICS: VerifiedClinic[] = [
    {
        name: "Mayo Clinic Department of Psychiatry and Psychology",
        slug: "mayo-clinic-psychiatry-rochester",
        type: "clinical",
        address: { street: "200 First St SW", city: "Rochester", state: "MN", zip: "55905" },
        phone: "(507) 284-2511",
        website: "https://www.mayoclinic.org/tests-procedures/transcranial-magnetic-stimulation/care-at-mayo-clinic/pcc-20384627",
        machines: ["NeuroStar", "MagVenture"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "Medicaid", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "Mayo Clinic's Rochester campus offers TMS therapy through the Department of Psychiatry and Psychology, providing care for depression and OCD within an integrated academic medical center.",
        verified: true,
    },
    {
        name: "Sonder Behavioral Health and Wellness",
        slug: "sonder-behavioral-health-wellness-edina",
        type: "clinical",
        address: { street: "7400 France Ave S, Suite 245", city: "Edina", state: "MN", zip: "55435" },
        website: "https://www.sonderwellness.com/tms",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "HealthPartners"],
        description: "Minneapolis-area NeuroStar provider delivering 36-session TMS treatment courses over 4-6 weeks for treatment-resistant depression.",
        verified: true,
    },
    {
        name: "NeuroStim TMS Minneapolis",
        slug: "neurostim-tms-minneapolis",
        type: "clinical",
        address: { street: "3433 Broadway Street NE, Suite 430", city: "Minneapolis", state: "MN", zip: "55413" },
        website: "https://neurostimtms.com/neurostim-tms-minneapolis/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "HealthPartners"],
        description: "Minneapolis branch of NeuroStim TMS, a multi-state TMS provider delivering NeuroStar therapy for treatment-resistant depression.",
        verified: true,
    },
];

export const TENNESSEE_CLINICS: VerifiedClinic[] = [
    {
        name: "Nashville NeuroCare Therapy",
        slug: "nashville-neurocare-therapy",
        type: "clinical",
        address: { street: "30 Burton Hills Blvd, Suite 360", city: "Nashville", state: "TN", zip: "37215" },
        phone: "(615) 395-6539",
        website: "https://nashvilleneurocare.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "Tennessee's most experienced and largest TMS provider, offering 100% medication-free treatment options across Nashville and Franklin since 2010.",
        verified: true,
        doctors: [
            { name: "W. Scott West, MD", title: "Founder, Medical Director", specialties: ["Psychiatry", "TMS Therapy", "Clinical Depression"] },
        ],
    },
    {
        name: "Vanderbilt Health TMS Program",
        slug: "vanderbilt-health-tms-nashville",
        type: "clinical",
        address: { street: "1601 23rd Ave S", city: "Nashville", state: "TN", zip: "37212" },
        phone: "(615) 936-3555",
        website: "https://www.vanderbilthealth.com/treatment/transcranial-magnetic-stimulation-tms",
        machines: ["NeuroStar", "MagVenture"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "Medicaid", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "Vanderbilt University Medical Center's TMS program providing repetitive TMS for treatment-resistant depression and OCD within an academic medical setting.",
        verified: true,
    },
    {
        name: "Synaptic Psych",
        slug: "synaptic-psych-memphis",
        type: "clinical",
        address: { street: "5050 Poplar Ave, Suite 1500", city: "Memphis", state: "TN", zip: "38157" },
        website: "https://hopeforyourbrain.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD", "Anxiety"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Multi-location Tennessee psychiatry group (formerly NeuroScience & TMS Treatment Center) offering full-service evidence-based mental health care including TMS in Memphis, Nashville, Brentwood, and Franklin.",
        verified: true,
    },
];

export const MISSOURI_CLINICS: VerifiedClinic[] = [
    {
        name: "Lakeside Behavioral Health",
        slug: "lakeside-behavioral-health-bridgeton",
        type: "clinical",
        address: { street: "12277 De Paul Drive, Suite 401", city: "Bridgeton", state: "MO", zip: "63044" },
        website: "https://lakesidebh.com/",
        machines: ["BrainsWay Deep TMS"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "Medicaid", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "St. Louis-area outpatient clinic offering Deep TMS therapy and intensive outpatient programs for treatment-resistant depression and OCD.",
        verified: true,
    },
    {
        name: "Palmier TMS & Behavioral Health",
        slug: "palmier-tms-st-louis",
        type: "clinical",
        address: { street: "12855 N Forty Drive, Suite 375", city: "St. Louis", state: "MO", zip: "63141" },
        website: "https://palmiertms.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare"],
        description: "Multi-location Missouri TMS practice specializing in treating moderate to severe depression and OCD across all ages with Transcranial Magnetic Stimulation.",
        verified: true,
    },
    {
        name: "Greenbrook TMS Tesson Ferry",
        slug: "greenbrook-tms-tesson-ferry-st-louis",
        type: "clinical",
        address: { street: "12855 Tesson Ferry Rd, Suite 100", city: "St. Louis", state: "MO", zip: "63128" },
        website: "https://www.greenbrooktms.com/missouri-centers/tesson-ferry",
        machines: ["NeuroStar"],
        treatments: ["Depression", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "UnitedHealthcare", "Tricare"],
        description: "Greenbrook's south St. Louis center providing NeuroStar TMS therapy and Spravato esketamine treatment for treatment-resistant depression.",
        verified: true,
    },
];

export const MONTANA_CLINICS: VerifiedClinic[] = [
    {
        name: "Montana Psychiatry & Brain Health Center - Billings",
        slug: "montana-psychiatry-brain-health-billings",
        type: "clinical",
        address: { street: "517 S 24th St W, Unit C3", city: "Billings", state: "MT", zip: "59102" },
        phone: "(406) 839-2985",
        website: "https://mtpsychiatry.com/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "PacificSource"],
        description: "Comprehensive psychiatric and brain-health practice serving children and adults in Billings with TMS, ketamine therapy, and medication management.",
        verified: true,
        doctors: [
            { name: "Erin Amato, MD", title: "TMS Medical Director", specialties: ["Psychiatry", "TMS Therapy", "Mood Disorders"] },
        ],
    },
    {
        name: "Montana Psychiatry & Brain Health Center - Bozeman",
        slug: "montana-psychiatry-brain-health-bozeman",
        type: "clinical",
        address: { street: "822 Stoneridge Dr, Suite A-2", city: "Bozeman", state: "MT", zip: "59718" },
        phone: "(406) 551-8001",
        website: "https://mtpsychiatry.com/bozeman-office/",
        machines: ["NeuroStar"],
        treatments: ["Depression", "Anxiety", "OCD"],
        insuranceAccepted: ["Medicare", "BlueCross BlueShield", "Aetna", "Cigna", "PacificSource"],
        description: "Bozeman office of Montana Psychiatry & Brain Health Center providing TMS therapy and integrated psychiatric care for southwestern Montana.",
        verified: true,
    },
];

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
    ...MICHIGAN_CLINICS,
    ...HI_CLINICS,
    ...WYOMING_CLINICS,
    ...ALASKA_CLINICS,
    ...NORTH_DAKOTA_CLINICS,
    ...RHODE_ISLAND_CLINICS,
    ...SOUTH_CAROLINA_CLINICS,
    ...NEW_MEXICO_CLINICS,
    ...NEVADA_CLINICS,
    ...NEBRASKA_CLINICS,
    ...VERMONT_CLINICS,
    ...DELAWARE_CLINICS,
    ...UTAH_CLINICS,
    ...NEW_HAMPSHIRE_CLINICS,
    ...MAINE_CLINICS,
    ...SOUTH_DAKOTA_CLINICS,
    ...IDAHO_CLINICS,
    ...OKLAHOMA_CLINICS,
    ...KENTUCKY_CLINICS,
    ...MINNESOTA_CLINICS,
    ...TENNESSEE_CLINICS,
    ...MISSOURI_CLINICS,
    ...MONTANA_CLINICS,
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
