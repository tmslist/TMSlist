/**
 * NPI Registry API integration for doctor credential verification.
 * Uses the free, public NPPES NPI Registry API (no key required).
 * https://npiregistry.cms.hhs.gov/api-page
 */

interface NpiResult {
  npi: string;
  name: string;
  credential: string;
  specialty: string;
  state: string;
  city: string;
  status: 'active' | 'deactivated';
  enumerationDate: string;
  taxonomies: { code: string; desc: string; primary: boolean; state: string; license: string }[];
  addresses: { address_1: string; city: string; state: string; postal_code: string; address_purpose: string }[];
}

/**
 * Search the NPI Registry by doctor name.
 */
export async function searchNpi(opts: {
  firstName: string;
  lastName: string;
  state?: string;
}): Promise<NpiResult[]> {
  const params = new URLSearchParams({
    version: '2.1',
    first_name: opts.firstName,
    last_name: opts.lastName,
    enumeration_type: 'NPI-1', // Individual providers only
    limit: '10',
  });

  if (opts.state) params.set('state', opts.state);

  try {
    const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?${params}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || data.result_count === 0) return [];

    return data.results.map((r: any) => ({
      npi: r.number,
      name: `${r.basic?.first_name || ''} ${r.basic?.last_name || ''}`.trim(),
      credential: r.basic?.credential || '',
      specialty: r.taxonomies?.[0]?.desc || '',
      state: r.addresses?.[0]?.state || '',
      city: r.addresses?.[0]?.city || '',
      status: r.basic?.status === 'A' ? 'active' : 'deactivated',
      enumerationDate: r.basic?.enumeration_date || '',
      taxonomies: (r.taxonomies || []).map((t: any) => ({
        code: t.code,
        desc: t.desc,
        primary: t.primary,
        state: t.state,
        license: t.license,
      })),
      addresses: (r.addresses || []).map((a: any) => ({
        address_1: a.address_1,
        city: a.city,
        state: a.state,
        postal_code: a.postal_code,
        address_purpose: a.address_purpose,
      })),
    }));
  } catch {
    return [];
  }
}

/**
 * Verify a specific NPI number.
 */
export async function verifyNpi(npiNumber: string): Promise<NpiResult | null> {
  try {
    const res = await fetch(`https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npiNumber}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results || data.result_count === 0) return null;

    const r = data.results[0];
    return {
      npi: r.number,
      name: `${r.basic?.first_name || ''} ${r.basic?.last_name || ''}`.trim(),
      credential: r.basic?.credential || '',
      specialty: r.taxonomies?.[0]?.desc || '',
      state: r.addresses?.[0]?.state || '',
      city: r.addresses?.[0]?.city || '',
      status: r.basic?.status === 'A' ? 'active' : 'deactivated',
      enumerationDate: r.basic?.enumeration_date || '',
      taxonomies: (r.taxonomies || []).map((t: any) => ({
        code: t.code,
        desc: t.desc,
        primary: t.primary,
        state: t.state,
        license: t.license,
      })),
      addresses: (r.addresses || []).map((a: any) => ({
        address_1: a.address_1,
        city: a.city,
        state: a.state,
        postal_code: a.postal_code,
        address_purpose: a.address_purpose,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Auto-verify a doctor by matching name + state against NPI Registry.
 * Returns the NPI data if a confident match is found.
 */
export async function autoVerifyDoctor(opts: {
  firstName: string;
  lastName: string;
  state: string;
  credential?: string;
}): Promise<{ verified: boolean; npiData: NpiResult | null; confidence: 'high' | 'medium' | 'low' }> {
  const results = await searchNpi({
    firstName: opts.firstName,
    lastName: opts.lastName,
    state: opts.state,
  });

  if (results.length === 0) {
    return { verified: false, npiData: null, confidence: 'low' };
  }

  // Look for exact match with active status
  const exactMatch = results.find(r =>
    r.status === 'active' &&
    r.name.toLowerCase().includes(opts.lastName.toLowerCase()) &&
    r.state === opts.state
  );

  if (exactMatch) {
    // Check if credential matches for high confidence
    const credentialMatch = opts.credential && exactMatch.credential.toLowerCase().includes(opts.credential.toLowerCase().replace(/[.,]/g, ''));
    return {
      verified: true,
      npiData: exactMatch,
      confidence: credentialMatch ? 'high' : 'medium',
    };
  }

  return { verified: false, npiData: results[0], confidence: 'low' };
}
