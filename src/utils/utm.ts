export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
}

export function extractUTM(url: URL): UTMParams {
  const params: UTMParams = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const) {
    const val = url.searchParams.get(key);
    if (val) params[key] = val;
  }
  return params;
}

export function utmToMetadata(utm: UTMParams): Record<string, unknown> {
  const meta: Record<string, unknown> = {};
  if (utm.utm_source) meta.utm_source = utm.utm_source;
  if (utm.utm_medium) meta.utm_medium = utm.utm_medium;
  if (utm.utm_campaign) meta.utm_campaign = utm.utm_campaign;
  if (utm.utm_term) meta.utm_term = utm.utm_term;
  if (utm.utm_content) meta.utm_content = utm.utm_content;
  if (utm.referrer) meta.referrer = utm.referrer;
  return meta;
}
