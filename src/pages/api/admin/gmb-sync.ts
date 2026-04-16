/**
 * Google Business Profile API Sync Endpoint
 * Syncs clinic data to Google Business Profile API for enhanced local SEO
 */
import type { APIRoute } from 'astro';
import { checkRateLimit } from '../../../utils/rateLimit';

interface ClinicGBPData {
  name: string;
  address: {
    streetAddress: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  website?: string;
  hours?: {
    dayOfWeek: string;
    openTime: string;
    closeTime: string;
  }[];
  photos?: {
    url: string;
    caption: string;
  }[];
  category?: string;
  description?: string;
}

// GBP API v1 endpoint for managing business listings
const GBP_API_BASE = 'https://businessinformation.googleapis.com/v1';
const GBP_API_KEY = import.meta.env.GOOGLE_BUSINESS_API_KEY;

/**
 * Transform clinic data to GBP API format
 */
export function syncClinicToGBP(clinic: any): ClinicGBPData {
  const address = clinic.address_obj || {};

  return {
    name: clinic.name,
    address: {
      streetAddress: address.street || address.address1 || '',
      city: address.city || clinic.city || '',
      region: address.state || clinic.state || '',
      postalCode: address.zip || address.postalCode || '',
      country: address.country || 'US',
    },
    phone: clinic.phone || clinic.phone_number || undefined,
    website: clinic.website || `https://tmslist.com/clinic/${clinic.slug || clinic.url_path}/`,
    category: 'Medical Clinic',
    description: clinic.description || `TMS Therapy clinic specializing in ${(clinic.specialties || []).join(', ')}.`,
    hours: clinic.hours?.map((h: any) => ({
      dayOfWeek: h.day,
      openTime: h.open,
      closeTime: h.close,
    })),
    photos: clinic.photos?.map((p: string) => ({
      url: p,
      caption: 'Clinic exterior',
    })),
  };
}

/**
 * Submit clinic data to Google Business Profile API
 */
async function submitToGBP(clinicData: ClinicGBPData, accessToken: string): Promise<{ success: boolean; locationId?: string; error?: string }> {
  if (!GBP_API_KEY) {
    return { success: false, error: 'Google Business API key not configured' };
  }

  try {
    // Step 1: Search for existing location by name/address
    const searchResponse = await fetch(
      `${GBP_API_BASE}/accounts?pageSize=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.json();
      return { success: false, error: error.error?.message || 'Failed to access GBP account' };
    }

    const accountData = await searchResponse.json();
    const accountName = accountData.accounts?.[0]?.name;

    if (!accountName) {
      return { success: false, error: 'No GBP account found' };
    }

    // Step 2: Create or update location
    const locationPayload = {
      languageCode: 'en-US',
      storefrontAddress: {
        country: clinicData.address.country,
        administrativeArea: clinicData.address.region,
        locality: clinicData.address.city,
        addressLines: [clinicData.address.streetAddress],
        postalCode: clinicData.address.postalCode,
      },
      businessName: clinicData.name,
      phoneNumbers: clinicData.phone ? { primaryPhone: clinicData.phone } : undefined,
      websiteUrl: clinicData.website,
      profile: {
        description: clinicData.description,
      },
      categories: clinicData.category ? {
        primaryCategory: { categoryId: 'gcid:medical_clinic' },
      } : undefined,
    };

    const createResponse = await fetch(
      `${GBP_API_BASE}/${accountName}/locations?requestId=${crypto.randomUUID()}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationPayload),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.json();
      return { success: false, error: error.error?.message || 'Failed to create/update GBP location' };
    }

    const locationData = await createResponse.json();
    return { success: true, locationId: locationData.name };
  } catch (error) {
    console.error('GBP API error:', error);
    return { success: false, error: 'Internal error submitting to GBP' };
  }
}

/**
 * Upload photos to GBP location
 */
async function uploadPhotos(locationId: string, photos: ClinicGBPData['photos'], accessToken: string): Promise<boolean> {
  if (!photos?.length || !GBP_API_KEY) return true;

  try {
    for (const photo of photos) {
      // Note: Photo upload requires binary data - simplified here
      const photoMetadata = {
        photo: {
          mediaType: 'PHOTO_TYPE_EXTERIOR',
          attributionPossibility: {
            attributionSource: {
              type: 'CUSTOM',
            },
          },
        },
        locationAssociation: {
          category: 'PHOTO_CATEGORY_EXTERIOR',
        },
      };

      await fetch(
        `${GBP_API_BASE}/${locationId}/photos:upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(photoMetadata),
        }
      );
    }
    return true;
  } catch (error) {
    console.error('GBP photo upload error:', error);
    return false;
  }
}

/**
 * Main API route handler
 */
export const POST: APIRoute = async ({ request }) => {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  // Validate authorization
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.substring(7);

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { clinic } = body;

  if (!clinic || typeof clinic !== 'object') {
    return new Response(JSON.stringify({ error: 'Clinic data required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Transform clinic to GBP format
  const gbpData = syncClinicToGBP(clinic);

  // Submit to GBP
  const result = await submitToGBP(gbpData, accessToken);

  // If successful, optionally upload photos
  if (result.success && gbpData.photos?.length) {
    await uploadPhotos(result.locationId!, gbpData.photos, accessToken);
  }

  return new Response(JSON.stringify(result), {
    status: result.success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Batch sync multiple clinics
 */
export const PUT: APIRoute = async ({ request }) => {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, 'api');
  if (rateLimitResponse) return rateLimitResponse;

  // Validate authorization
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.substring(7);

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { clinics } = body;

  if (!Array.isArray(clinics)) {
    return new Response(JSON.stringify({ error: 'Clinics array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Process each clinic
  const results = await Promise.all(
    clinics.map(async (clinic) => {
      const gbpData = syncClinicToGBP(clinic);
      const result = await submitToGBP(gbpData, accessToken);
      return { clinicId: clinic.id, ...result };
    })
  );

  const successCount = results.filter((r) => r.success).length;

  return new Response(JSON.stringify({
    total: clinics.length,
    successful: successCount,
    failed: clinics.length - successCount,
    results,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
