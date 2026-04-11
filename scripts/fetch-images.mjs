/**
 * Utility: Google Custom Search API image fetcher
 * Usage: node scripts/fetch-images.mjs "Smart TMS London clinic"
 * Returns JSON array of image results
 */
import 'dotenv/config';

const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const CX = process.env.GOOGLE_SEARCH_CX;

if (!API_KEY || !CX) {
  console.error('Missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX in .env');
  process.exit(1);
}

export async function searchImages(query, num = 3) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&searchType=image&num=${num}&safe=active`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google API error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return (data.items || []).map(item => ({
    url: item.link,
    title: item.title,
    context: item.image?.contextLink,
    width: item.image?.width,
    height: item.image?.height,
  }));
}

export async function searchClinicImages(clinicName, city, country) {
  const query = `${clinicName} ${city} ${country} TMS clinic`;
  return searchImages(query, 3);
}

export async function searchDoctorPhoto(doctorName, clinic, city) {
  const query = `${doctorName} ${clinic} ${city} psychiatrist`;
  return searchImages(query, 2);
}

// CLI mode
if (process.argv[2]) {
  const query = process.argv.slice(2).join(' ');
  console.log(`Searching: "${query}"...`);
  const results = await searchImages(query, 5);
  console.log(JSON.stringify(results, null, 2));
}
