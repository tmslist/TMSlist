import os
import json
import random

# --- Configuration ---
DATA_DIR = "src/data/clinics"
MAIN_DATA_FILE = "src/data/clinics.json"
OUTPUT_DIR = "src/data"

MACHINE_TYPES = ["NeuroStar", "BrainsWay", "MagVenture", "CloudTMS", "Magstim", "Nexstim"]
INSURANCES = ["BlueCross", "UnitedHealthcare", "Aetna", "Cigna", "Medicare", "Tricare", "Medicaid", "Kaiser Permanente"]
SPECIALTIES = ["Depression", "Anxiety", "OCD", "PTSD", "Bipolar", "Chronic Pain", "Tinnitus"]
MED_SCHOOLS = ["Harvard Medical School", "Johns Hopkins", "UCSF", "Stanford Medicine", "Baylor College of Medicine", "Mayo Clinic Alix School of Medicine", "UCLA David Geffen School of Medicine", "Columbia University", "University of Pennsylvania", "Duke University"]

# --- COMPLETE 50 STATE + 250 CITY DATA FROM USER ---
STATE_CITIES = {
    # 1. California
    "CA": [
        ("Los Angeles", "Los Angeles County"),
        ("San Diego", "San Diego County"),
        ("San Jose", "Santa Clara County"),
        ("San Francisco", "San Francisco County"),
        ("Fresno", "Fresno County"),
    ],
    # 2. Texas
    "TX": [
        ("Houston", "Harris County"),
        ("San Antonio", "Bexar County"),
        ("Dallas", "Dallas County"),
        ("Austin", "Travis County"),
        ("Fort Worth", "Tarrant County"),
    ],
    # 3. Florida
    "FL": [
        ("Jacksonville", "Duval County"),
        ("Miami", "Miami-Dade County"),
        ("Tampa", "Hillsborough County"),
        ("Orlando", "Orange County"),
        ("St. Petersburg", "Pinellas County"),
    ],
    # 4. New York
    "NY": [
        ("New York", "New York County"),
        ("Manhattan", "New York County"),
        ("Brooklyn", "Kings County"),
        ("Bronx", "Bronx County"),
        ("Staten Island", "Richmond County"),
        ("Queens", "Queens County"),
        ("Buffalo", "Erie County"),
        ("Yonkers", "Westchester County"),
        ("Rochester", "Monroe County"),
        ("Syracuse", "Onondaga County"),
    ],
    # 5. Pennsylvania
    "PA": [
        ("Philadelphia", "Philadelphia County"),
        ("Pittsburgh", "Allegheny County"),
        ("Allentown", "Lehigh County"),
        ("Reading", "Berks County"),
        ("Erie", "Erie County"),
    ],
    # 6. Illinois
    "IL": [
        ("Chicago", "Cook County"),
        ("Aurora", "Kane County"),
        ("Joliet", "Will County"),
        ("Naperville", "DuPage County"),
        ("Rockford", "Winnebago County"),
    ],
    # 7. Ohio
    "OH": [
        ("Columbus", "Franklin County"),
        ("Cleveland", "Cuyahoga County"),
        ("Cincinnati", "Hamilton County"),
        ("Toledo", "Lucas County"),
        ("Akron", "Summit County"),
    ],
    # 8. Georgia
    "GA": [
        ("Atlanta", "Fulton County"),
        ("Augusta", "Richmond County"),
        ("Columbus", "Muscogee County"),
        ("Macon", "Bibb County"),
        ("Savannah", "Chatham County"),
    ],
    # 9. North Carolina
    "NC": [
        ("Charlotte", "Mecklenburg County"),
        ("Raleigh", "Wake County"),
        ("Durham", "Durham County"),
        ("Greensboro", "Guilford County"),
        ("Winston-Salem", "Forsyth County"),
    ],
    # 10. Michigan
    "MI": [
        ("Detroit", "Wayne County"),
        ("Grand Rapids", "Kent County"),
        ("Warren", "Macomb County"),
        ("Sterling Heights", "Macomb County"),
        ("Ann Arbor", "Washtenaw County"),
    ],
    # 11. New Jersey
    "NJ": [
        ("Newark", "Essex County"),
        ("Jersey City", "Hudson County"),
        ("Paterson", "Passaic County"),
        ("Elizabeth", "Union County"),
        ("Lakewood", "Ocean County"),
    ],
    # 12. Virginia
    "VA": [
        ("Virginia Beach", "Virginia Beach City"),
        ("Chesapeake", "Chesapeake City"),
        ("Norfolk", "Norfolk City"),
        ("Richmond", "Richmond City"),
        ("Newport News", "Newport News City"),
    ],
    # 13. Washington
    "WA": [
        ("Seattle", "King County"),
        ("Spokane", "Spokane County"),
        ("Tacoma", "Pierce County"),
        ("Vancouver", "Clark County"),
        ("Bellevue", "King County"),
    ],
    # 14. Arizona
    "AZ": [
        ("Phoenix", "Maricopa County"),
        ("Tucson", "Pima County"),
        ("Mesa", "Maricopa County"),
        ("Chandler", "Maricopa County"),
        ("Gilbert", "Maricopa County"),
    ],
    # 15. Tennessee
    "TN": [
        ("Nashville", "Davidson County"),
        ("Memphis", "Shelby County"),
        ("Knoxville", "Knox County"),
        ("Chattanooga", "Hamilton County"),
        ("Clarksville", "Montgomery County"),
    ],
    # 16. Massachusetts
    "MA": [
        ("Boston", "Suffolk County"),
        ("Worcester", "Worcester County"),
        ("Springfield", "Hampden County"),
        ("Cambridge", "Middlesex County"),
        ("Lowell", "Middlesex County"),
    ],
    # 17. Indiana
    "IN": [
        ("Indianapolis", "Marion County"),
        ("Fort Wayne", "Allen County"),
        ("Evansville", "Vanderburgh County"),
        ("South Bend", "St. Joseph County"),
        ("Carmel", "Hamilton County"),
    ],
    # 18. Maryland
    "MD": [
        ("Baltimore", "Baltimore City"),
        ("Columbia", "Howard County"),
        ("Germantown", "Montgomery County"),
        ("Waldorf", "Charles County"),
        ("Silver Spring", "Montgomery County"),
    ],
    # 19. Missouri
    "MO": [
        ("Kansas City", "Jackson County"),
        ("St. Louis", "St. Louis City"),
        ("Springfield", "Greene County"),
        ("Columbia", "Boone County"),
        ("Independence", "Jackson County"),
    ],
    # 20. Wisconsin
    "WI": [
        ("Milwaukee", "Milwaukee County"),
        ("Madison", "Dane County"),
        ("Green Bay", "Brown County"),
        ("Kenosha", "Kenosha County"),
        ("Racine", "Racine County"),
    ],
    # 21. Colorado
    "CO": [
        ("Denver", "Denver County"),
        ("Colorado Springs", "El Paso County"),
        ("Aurora", "Arapahoe County"),
        ("Fort Collins", "Larimer County"),
        ("Lakewood", "Jefferson County"),
    ],
    # 22. Minnesota
    "MN": [
        ("Minneapolis", "Hennepin County"),
        ("St. Paul", "Ramsey County"),
        ("Rochester", "Olmsted County"),
        ("Bloomington", "Hennepin County"),
        ("Duluth", "St. Louis County"),
    ],
    # 23. South Carolina
    "SC": [
        ("Charleston", "Charleston County"),
        ("Columbia", "Richland County"),
        ("North Charleston", "Charleston County"),
        ("Mount Pleasant", "Charleston County"),
        ("Rock Hill", "York County"),
    ],
    # 24. Alabama
    "AL": [
        ("Huntsville", "Madison County"),
        ("Birmingham", "Jefferson County"),
        ("Montgomery", "Montgomery County"),
        ("Mobile", "Mobile County"),
        ("Tuscaloosa", "Tuscaloosa County"),
    ],
    # 25. Louisiana
    "LA": [
        ("New Orleans", "Orleans Parish"),
        ("Baton Rouge", "East Baton Rouge Parish"),
        ("Shreveport", "Caddo Parish"),
        ("Lafayette", "Lafayette Parish"),
        ("Lake Charles", "Calcasieu Parish"),
    ],
    # 26. Kentucky
    "KY": [
        ("Louisville", "Jefferson County"),
        ("Lexington", "Fayette County"),
        ("Bowling Green", "Warren County"),
        ("Owensboro", "Daviess County"),
        ("Covington", "Kenton County"),
    ],
    # 27. Oregon
    "OR": [
        ("Portland", "Multnomah County"),
        ("Eugene", "Lane County"),
        ("Salem", "Marion County"),
        ("Gresham", "Multnomah County"),
        ("Hillsboro", "Washington County"),
    ],
    # 28. Oklahoma
    "OK": [
        ("Oklahoma City", "Oklahoma County"),
        ("Tulsa", "Tulsa County"),
        ("Norman", "Cleveland County"),
        ("Broken Arrow", "Tulsa County"),
        ("Edmond", "Oklahoma County"),
    ],
    # 29. Connecticut
    "CT": [
        ("Bridgeport", "Fairfield County"),
        ("Stamford", "Fairfield County"),
        ("New Haven", "New Haven County"),
        ("Hartford", "Hartford County"),
        ("Waterbury", "New Haven County"),
    ],
    # 30. Utah
    "UT": [
        ("Salt Lake City", "Salt Lake County"),
        ("West Valley City", "Salt Lake County"),
        ("West Jordan", "Salt Lake County"),
        ("Provo", "Utah County"),
        ("St. George", "Washington County"),
    ],
    # 31. Nevada
    "NV": [
        ("Las Vegas", "Clark County"),
        ("Henderson", "Clark County"),
        ("North Las Vegas", "Clark County"),
        ("Reno", "Washoe County"),
        ("Enterprise", "Clark County"),
    ],
    # 32. Iowa
    "IA": [
        ("Des Moines", "Polk County"),
        ("Cedar Rapids", "Linn County"),
        ("Davenport", "Scott County"),
        ("Sioux City", "Woodbury County"),
        ("Iowa City", "Johnson County"),
    ],
    # 33. Arkansas
    "AR": [
        ("Little Rock", "Pulaski County"),
        ("Fayetteville", "Washington County"),
        ("Fort Smith", "Sebastian County"),
        ("Springdale", "Washington County"),
        ("Jonesboro", "Craighead County"),
    ],
    # 34. Kansas
    "KS": [
        ("Wichita", "Sedgwick County"),
        ("Overland Park", "Johnson County"),
        ("Kansas City", "Wyandotte County"),
        ("Olathe", "Johnson County"),
        ("Topeka", "Shawnee County"),
    ],
    # 35. Mississippi
    "MS": [
        ("Jackson", "Hinds County"),
        ("Gulfport", "Harrison County"),
        ("Southaven", "DeSoto County"),
        ("Biloxi", "Harrison County"),
        ("Hattiesburg", "Forrest County"),
    ],
    # 36. New Mexico
    "NM": [
        ("Albuquerque", "Bernalillo County"),
        ("Las Cruces", "Dona Ana County"),
        ("Rio Rancho", "Sandoval County"),
        ("Santa Fe", "Santa Fe County"),
        ("Roswell", "Chaves County"),
    ],
    # 37. Nebraska
    "NE": [
        ("Omaha", "Douglas County"),
        ("Lincoln", "Lancaster County"),
        ("Bellevue", "Sarpy County"),
        ("Grand Island", "Hall County"),
        ("Kearney", "Buffalo County"),
    ],
    # 38. Idaho
    "ID": [
        ("Boise", "Ada County"),
        ("Meridian", "Ada County"),
        ("Nampa", "Canyon County"),
        ("Idaho Falls", "Bonneville County"),
        ("Caldwell", "Canyon County"),
    ],
    # 39. West Virginia
    "WV": [
        ("Charleston", "Kanawha County"),
        ("Huntington", "Cabell County"),
        ("Morgantown", "Monongalia County"),
        ("Parkersburg", "Wood County"),
        ("Wheeling", "Ohio County"),
    ],
    # 40. Hawaii
    "HI": [
        ("Honolulu", "Honolulu County"),
        ("East Honolulu", "Honolulu County"),
        ("Pearl City", "Honolulu County"),
        ("Hilo", "Hawaii County"),
        ("Waipahu", "Honolulu County"),
    ],
    # 41. New Hampshire
    "NH": [
        ("Manchester", "Hillsborough County"),
        ("Nashua", "Hillsborough County"),
        ("Concord", "Merrimack County"),
        ("Derry", "Rockingham County"),
        ("Dover", "Strafford County"),
    ],
    # 42. Maine
    "ME": [
        ("Portland", "Cumberland County"),
        ("Lewiston", "Androscoggin County"),
        ("Bangor", "Penobscot County"),
        ("South Portland", "Cumberland County"),
        ("Auburn", "Androscoggin County"),
    ],
    # 43. Montana
    "MT": [
        ("Billings", "Yellowstone County"),
        ("Missoula", "Missoula County"),
        ("Great Falls", "Cascade County"),
        ("Bozeman", "Gallatin County"),
        ("Butte", "Silver Bow County"),
    ],
    # 44. Rhode Island
    "RI": [
        ("Providence", "Providence County"),
        ("Cranston", "Providence County"),
        ("Warwick", "Kent County"),
        ("Pawtucket", "Providence County"),
        ("East Providence", "Providence County"),
    ],
    # 45. Delaware
    "DE": [
        ("Wilmington", "New Castle County"),
        ("Dover", "Kent County"),
        ("Newark", "New Castle County"),
        ("Middletown", "New Castle County"),
        ("Bear", "New Castle County"),
    ],
    # 46. South Dakota
    "SD": [
        ("Sioux Falls", "Minnehaha County"),
        ("Rapid City", "Pennington County"),
        ("Aberdeen", "Brown County"),
        ("Brookings", "Brookings County"),
        ("Watertown", "Codington County"),
    ],
    # 47. North Dakota
    "ND": [
        ("Fargo", "Cass County"),
        ("Bismarck", "Burleigh County"),
        ("Grand Forks", "Grand Forks County"),
        ("Minot", "Ward County"),
        ("West Fargo", "Cass County"),
    ],
    # 48. Alaska
    "AK": [
        ("Anchorage", "Municipality of Anchorage"),
        ("Fairbanks", "Fairbanks North Star Borough"),
        ("Juneau", "City and Borough of Juneau"),
        ("Wasilla", "Matanuska-Susitna Borough"),
        ("Sitka", "City and Borough of Sitka"),
    ],
    # 49. Vermont
    "VT": [
        ("Burlington", "Chittenden County"),
        ("South Burlington", "Chittenden County"),
        ("Rutland", "Rutland County"),
        ("Essex Junction", "Chittenden County"),
        ("Bennington", "Bennington County"),
    ],
    # 50. Wyoming
    "WY": [
        ("Cheyenne", "Laramie County"),
        ("Casper", "Natrona County"),
        ("Gillette", "Campbell County"),
        ("Laramie", "Albany County"),
        ("Rock Springs", "Sweetwater County"),
    ],
}

# Full 50 state list
STATES = [
    {"name": "Alabama", "code": "AL"},
    {"name": "Alaska", "code": "AK"},
    {"name": "Arizona", "code": "AZ"},
    {"name": "Arkansas", "code": "AR"},
    {"name": "California", "code": "CA"},
    {"name": "Colorado", "code": "CO"},
    {"name": "Connecticut", "code": "CT"},
    {"name": "Delaware", "code": "DE"},
    {"name": "Florida", "code": "FL"},
    {"name": "Georgia", "code": "GA"},
    {"name": "Hawaii", "code": "HI"},
    {"name": "Idaho", "code": "ID"},
    {"name": "Illinois", "code": "IL"},
    {"name": "Indiana", "code": "IN"},
    {"name": "Iowa", "code": "IA"},
    {"name": "Kansas", "code": "KS"},
    {"name": "Kentucky", "code": "KY"},
    {"name": "Louisiana", "code": "LA"},
    {"name": "Maine", "code": "ME"},
    {"name": "Maryland", "code": "MD"},
    {"name": "Massachusetts", "code": "MA"},
    {"name": "Michigan", "code": "MI"},
    {"name": "Minnesota", "code": "MN"},
    {"name": "Mississippi", "code": "MS"},
    {"name": "Missouri", "code": "MO"},
    {"name": "Montana", "code": "MT"},
    {"name": "Nebraska", "code": "NE"},
    {"name": "Nevada", "code": "NV"},
    {"name": "New Hampshire", "code": "NH"},
    {"name": "New Jersey", "code": "NJ"},
    {"name": "New Mexico", "code": "NM"},
    {"name": "New York", "code": "NY"},
    {"name": "North Carolina", "code": "NC"},
    {"name": "North Dakota", "code": "ND"},
    {"name": "Ohio", "code": "OH"},
    {"name": "Oklahoma", "code": "OK"},
    {"name": "Oregon", "code": "OR"},
    {"name": "Pennsylvania", "code": "PA"},
    {"name": "Rhode Island", "code": "RI"},
    {"name": "South Carolina", "code": "SC"},
    {"name": "South Dakota", "code": "SD"},
    {"name": "Tennessee", "code": "TN"},
    {"name": "Texas", "code": "TX"},
    {"name": "Utah", "code": "UT"},
    {"name": "Vermont", "code": "VT"},
    {"name": "Virginia", "code": "VA"},
    {"name": "Washington", "code": "WA"},
    {"name": "West Virginia", "code": "WV"},
    {"name": "Wisconsin", "code": "WI"},
    {"name": "Wyoming", "code": "WY"},
]

# --- Real Data from User Request ---
REAL_CLINICS = [
  {
    "id": "ca-la-001",
    "name": "UCLA Health TMS Center",
    "slug": "ucla-health-tms-los-angeles",
    "description_long": "As a world-renowned academic medical center, UCLA Health offers one of the most advanced TMS programs in California.",
    "address": "300 Medical Plaza, Suite 2200",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90095",
    "address_obj": {
      "street": "300 Medical Plaza, Suite 2200",
      "city": "Los Angeles", "state": "CA", "zip": "90095",
      "county": "Los Angeles County",
      "nearby_landmarks": ["UCLA Campus", "Westwood Village", "Ronald Reagan Medical Center"]
    },
    "geo": { "lat": 34.066, "lng": -118.445 },
    "contact": { "phone": "(310) 825-7471", "website_url": "https://www.uclahealth.org/psychiatry/tms" },
    "machines": ["BrainsWay Deep TMS", "MagVenture", "Magstim"],
    "treatments": ["Major Depressive Disorder", "OCD", "Chronic Pain", "Tinnitus"],
    "insurance_accepted": ["Blue Cross", "Blue Shield", "Aetna", "Cigna", "UnitedHealthcare", "Medicare"],
    "cost_info": { "accepts_insurance": True, "cash_price_per_session": "$350 - $500", "financing_available": False },
    "verified": True,
    "rating": { "aggregate": 4.6, "count": 42, "sentiment_summary": "Highly professional academic environment." },
    "doctor_ids": ["sp-ca-001"],
    "opening_hours": ["Mon-Fri 08:00-17:00"],
    "faqs": [{ "question": "Does UCLA Health accept Medicare?", "answer": "Yes." }],
    "doctors_data": [{
        "name": "Dr. Andrew Leuchter, MD", "first_name": "Andrew", "last_name": "Leuchter",
        "slug": "dr-andrew-leuchter-los-angeles", "title": "Director of TMS Service",
        "school": "UCLA David Geffen School of Medicine", "years_experience": 30,
        "specialties": ["Depression", "Neuromodulation", "Research"],
        "bio_focus": "Depression", "image_url": "https://placehold.co/400x400/e2e8f0/1e293b?text=Dr+Leuchter"
    }]
  },
  {
    "id": "ca-sf-001",
    "name": "Silicon Valley TMS",
    "slug": "silicon-valley-tms-san-jose",
    "description_long": "Silicon Valley TMS is known for working with Kaiser Permanente referrals.",
    "address": "1100 Lincoln Ave, Suite 382",
    "city": "San Jose", "state": "CA", "zip": "95125",
    "address_obj": { "street": "1100 Lincoln Ave, Suite 382", "city": "San Jose", "state": "CA", "zip": "95125", "county": "Santa Clara County", "nearby_landmarks": ["Willow Glen", "Downtown San Jose"] },
    "geo": { "lat": 37.303, "lng": -121.902 },
    "contact": { "phone": "(888) 203-0941", "website_url": "https://siliconvalleytms.com" },
    "machines": ["NeuroStar"],
    "treatments": ["Depression", "Anxiety", "Postpartum Depression"],
    "insurance_accepted": ["Kaiser Permanente", "Sutter Health", "Aetna", "BlueCross"],
    "cost_info": { "accepts_insurance": True, "financing_available": True },
    "verified": True,
    "rating": { "aggregate": 4.9, "count": 85, "sentiment_summary": "Excellent Kaiser support." },
    "doctor_ids": ["sp-ca-002"],
    "opening_hours": ["Mon-Fri 07:00-19:00", "Sat 09:00-14:00"],
    "faqs": [{ "question": "Do you accept Kaiser?", "answer": "Yes." }],
    "doctors_data": [{
        "name": "Dr. Saad Shakir, MD", "first_name": "Saad", "last_name": "Shakir",
        "slug": "dr-saad-shakir-san-jose", "title": "Medical Director",
        "school": "Stanford Medicine", "years_experience": 15,
        "specialties": ["Depression", "Anxiety", "Occupational Mental Health"],
        "bio_focus": "TMS", "image_url": "https://placehold.co/400x400/e2e8f0/1e293b?text=Dr+Shakir"
    }]
  },
  {
    "id": "ca-cm-001",
    "name": "Brain Health Solutions",
    "slug": "brain-health-solutions-costa-mesa",
    "description_long": "Led by Dr. Robert Bota, offering the SAINT Protocol.",
    "address": "3151 Airway Ave, Suite R",
    "city": "Costa Mesa", "state": "CA", "zip": "92626",
    "address_obj": { "street": "3151 Airway Ave, Suite R", "city": "Costa Mesa", "state": "CA", "zip": "92626", "county": "Orange County", "nearby_landmarks": ["John Wayne Airport", "South Coast Plaza"] },
    "geo": { "lat": 33.678, "lng": -117.872 },
    "contact": { "phone": "(949) 779-0551", "website_url": "https://brainhealthsolutions.com" },
    "machines": ["MagVenture", "SAINT Protocol Setup"],
    "treatments": ["Depression", "OCD", "Bipolar Disorder", "PTSD"],
    "insurance_accepted": ["Anthem", "Blue Shield", "Magellan", "Cigna", "Tricare"],
    "cost_info": { "accepts_insurance": True, "cash_price_per_session": "$300", "financing_available": True },
    "verified": True,
    "rating": { "aggregate": 5.0, "count": 31, "sentiment_summary": "Dr. Bota is praised for empathy." },
    "doctor_ids": ["sp-ca-003"],
    "opening_hours": ["Mon-Fri 09:00-17:00"],
    "faqs": [{ "question": "What is SAINT?", "answer": "Rapid 5-day accelerated TMS." }],
    "doctors_data": [{
        "name": "Dr. Robert Bota, MD", "first_name": "Robert", "last_name": "Bota",
        "slug": "dr-robert-bota-costa-mesa", "title": "Board-Certified Psychiatrist",
        "school": "UCI School of Medicine", "years_experience": 20,
        "specialties": ["Treatment Resistant Depression", "Bipolar", "TMS Research"],
        "bio_focus": "Depression", "image_url": "https://placehold.co/400x400/e2e8f0/1e293b?text=Dr+Bota"
    }]
  }
]

def get_slug(text):
    return text.lower().strip().replace(" ", "-").replace(".", "").replace(",", "")

def generate_doctor_profile(city, state_code):
    first = random.choice(['Alan', 'Sarah', 'David', 'Lisa', 'Michael', 'Jennifer', 'Robert', 'Emily', 'James', 'Maria', 'William', 'Elizabeth', 'Christopher', 'Jessica', 'Daniel', 'Ashley'])
    last = random.choice(["Smith", "Patel", "Garcia", "Johnson", "Lee", "Kim", "Martinez", "Wong", "Davis", "Brown", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson"])
    name = f"{first} {last}"
    school = random.choice(MED_SCHOOLS)
    years = random.randint(10, 35)
    
    slug = get_slug(f"dr-{name}-{city}")
    
    return {
        "name": f"Dr. {name}, MD",
        "first_name": first,
        "last_name": last,
        "slug": slug,
        "title": "Board-Certified Psychiatrist",
        "school": school,
        "years_experience": years,
        "specialties": random.sample(SPECIALTIES, 3),
        "bio_focus": random.choice(["Depression", "TMS", "Adolescents"]),
        "image_url": f"https://placehold.co/400x400/e2e8f0/1e293b?text=Dr+{last}"
    }

def main():
    print("--- SEO Engine: Generating Complete 50-State Data Layer ---")
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)

    all_clinics = []
    
    # 1. Add Real Clinics
    all_clinics.extend(REAL_CLINICS)
    used_slugs = {c['slug'] for c in REAL_CLINICS}
    
    # 2. Generate Clinics for ALL 50 states
    provider_id_counter = 100
    
    for state in STATES:
        cities_list = STATE_CITIES.get(state['code'], [])
        
        for city_name, county_name in cities_list:
             # Generate 2-4 clinics per city
             num_clinics = random.randint(2, 4)
             for k in range(num_clinics):
                
                doctors_data = []
                for _ in range(random.randint(1, 3)):
                    doctors_data.append(generate_doctor_profile(city_name, state['code']))
                
                clinic_names = [
                    f"{city_name} TMS Center",
                    f"{city_name} Mental Health & TMS",
                    f"{city_name} Depression Treatment Center",
                    f"Dr. {doctors_data[0]['last_name']} Private Practice",
                    f"{city_name} Neuromodulation Clinic",
                ]
                clinic_name_base = clinic_names[k % len(clinic_names)]
                
                slug = get_slug(f"{clinic_name_base}-{city_name}")
                if slug in used_slugs: 
                    slug = get_slug(f"{clinic_name_base}-{city_name}-{k}")
                if slug in used_slugs: continue
                used_slugs.add(slug)

                machines = random.sample(MACHINE_TYPES, random.randint(1, 3))
                
                clinic = {
                    "id": f"{state['code'].lower()}-{provider_id_counter}",
                    "name": clinic_name_base,
                    "slug": slug,
                    "description_long": f"{clinic_name_base} provides FDA-cleared TMS therapy in {city_name}, {state['name']}. We specialize in treating treatment-resistant depression with {machines[0]} technology.",
                    
                    "address": f"{random.randint(100, 9999)} Medical Center Dr",
                    "city": city_name,
                    "state": state['code'],
                    "zip": str(random.randint(10000, 99999)), 

                    "address_obj": {
                        "street": f"{random.randint(100, 9999)} Medical Center Dr",
                        "city": city_name,
                        "state": state['code'],
                        "zip": str(random.randint(10000, 99999)),
                        "county": county_name,
                        "nearby_landmarks": [f"{city_name} Medical Plaza", f"Downtown {city_name}"]
                    },
                    
                    "geo": { "lat": 0, "lng": 0 },
                    "contact": {
                        "phone": f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
                        "website_url": f"https://{slug.replace('-', '')[:20]}.com"
                    },
                    "machines": machines,
                    "treatments": random.sample(["Major Depressive Disorder", "Anxiety", "OCD", "PTSD", "Bipolar"], 3),
                    "insurance_accepted": random.sample(INSURANCES, random.randint(3, 6)),
                    "cost_info": {
                        "accepts_insurance": True,
                        "cash_price_per_session": f"${random.randint(250, 450)}",
                        "financing_available": random.choice([True, False])
                    },
                    "verified": random.choice([True, True, True, False]),
                    "rating": {
                        "aggregate": round(random.uniform(4.2, 5.0), 1),
                        "count": random.randint(15, 200),
                        "sentiment_summary": random.choice([
                            "Patients praise the compassionate care.",
                            "Excellent staff and comfortable environment.",
                            "High success rates reported by patients.",
                            "Professional and efficient treatment process."
                        ])
                    },
                    "doctor_ids": [],
                    "opening_hours": ["Mon-Fri 09:00-17:00"],
                    "faqs": [{
                        "question": f"Is TMS covered by insurance at {clinic_name_base}?",
                        "answer": "Yes, we accept most major insurance plans."
                    }],
                    "doctors_data": doctors_data
                }
                
                all_clinics.append(clinic)
                provider_id_counter += 1

    # Save Global Aggregate
    with open(MAIN_DATA_FILE, "w") as f:
        json.dump(all_clinics, f, indent=2)

    # Count stats
    states_covered = len(set(c['state'] for c in all_clinics))
    cities_covered = len(set(c['city'] for c in all_clinics))
    doctors_count = sum(len(c.get('doctors_data', [])) for c in all_clinics)

    print(f"--- Generated {len(all_clinics)} Clinics ---")
    print(f"--- States: {states_covered} | Cities: {cities_covered} | Doctors: {doctors_count} ---")

if __name__ == "__main__":
    main()
