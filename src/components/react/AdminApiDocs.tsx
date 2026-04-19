import { useState } from 'react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  name: string;
  description: string;
  auth: 'required' | 'optional' | 'none';
  rateLimit: string;
  category: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: { type: string; properties: Record<string, string> };
  responseExample?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/clinics',
    name: 'List Clinics',
    description: 'Retrieve a paginated list of TMS clinics with filtering options',
    auth: 'required',
    rateLimit: '100/min',
    category: 'Clinics',
    parameters: [
      { name: 'page', type: 'integer', required: false, description: 'Page number (default: 1)' },
      { name: 'limit', type: 'integer', required: false, description: 'Items per page (default: 20, max: 100)' },
      { name: 'state', type: 'string', required: false, description: 'Filter by US state code (e.g., CA, TX)' },
      { name: 'insurance', type: 'string', required: false, description: 'Filter by insurance provider' },
      { name: 'has_tms', type: 'boolean', required: false, description: 'Only show TMS-certified clinics' },
    ],
    responseExample: `{
  "data": [
    {
      "id": "clinic_abc123",
      "name": "Bay Area TMS Center",
      "address": "123 Market St, San Francisco, CA 94105",
      "phone": "+1-415-555-0123",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "insurance": ["Aetna", "Blue Cross", "Cigna"],
      "tms_certified": true,
      "rating": 4.8,
      "review_count": 127
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 342,
    "pages": 18
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/clinics/{id}',
    name: 'Get Clinic',
    description: 'Retrieve detailed information about a specific clinic',
    auth: 'required',
    rateLimit: '200/min',
    category: 'Clinics',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Unique clinic identifier' },
    ],
    responseExample: `{
  "id": "clinic_abc123",
  "name": "Bay Area TMS Center",
  "slug": "bay-area-tms-center",
  "description": "Leading TMS therapy provider...",
  "address": {
    "street": "123 Market St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105"
  },
  "doctors": [...],
  "reviews": [...],
  "hours": {
    "monday": "9:00-17:00",
    "tuesday": "9:00-17:00"
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/doctors',
    name: 'List Doctors',
    description: 'Search for TMS-certified doctors and psychiatrists',
    auth: 'required',
    rateLimit: '100/min',
    category: 'Doctors',
    parameters: [
      { name: 'clinic_id', type: 'string', required: false, description: 'Filter by clinic' },
      { name: 'specialty', type: 'string', required: false, description: 'Medical specialty' },
      { name: 'state', type: 'string', required: false, description: 'US state code' },
    ],
    responseExample: `{
  "data": [
    {
      "id": "doc_xyz789",
      "name": "Dr. Sarah Chen",
      "title": "MD, PhD",
      "specialty": "Psychiatry",
      "clinics": ["clinic_abc123"],
      "board_certified": true,
      "rating": 4.9
    }
  ]
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/reviews',
    name: 'List Reviews',
    description: 'Retrieve patient reviews for clinics and doctors',
    auth: 'required',
    rateLimit: '200/min',
    category: 'Reviews',
    parameters: [
      { name: 'clinic_id', type: 'string', required: false, description: 'Filter by clinic' },
      { name: 'doctor_id', type: 'string', required: false, description: 'Filter by doctor' },
      { name: 'min_rating', type: 'integer', required: false, description: 'Minimum star rating (1-5)' },
    ],
    responseExample: `{
  "data": [
    {
      "id": "rev_123",
      "clinic_id": "clinic_abc123",
      "rating": 5,
      "title": "Life-changing treatment",
      "body": "After years of...",
      "created_at": "2026-03-15T10:30:00Z"
    }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/leads',
    name: 'Create Lead',
    description: 'Submit a patient lead for clinic outreach',
    auth: 'required',
    rateLimit: '50/min',
    category: 'Leads',
    requestBody: {
      type: 'object',
      properties: {
        clinic_id: 'string (required)',
        name: 'string (required)',
        email: 'string (required)',
        phone: 'string (required)',
        insurance: 'string (optional)',
        message: 'string (optional)',
      },
    },
    responseExample: `{
  "id": "lead_abc123",
  "status": "pending",
  "estimated_response": "24 hours"
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/insurance',
    name: 'List Insurance Providers',
    description: 'Get all supported insurance providers for filtering',
    auth: 'optional',
    rateLimit: '500/min',
    category: 'Reference',
    responseExample: `{
  "data": [
    { "id": "ins_aetna", "name": "Aetna" },
    { "id": "ins_bcbs", "name": "Blue Cross Blue Shield" },
    { "id": "ins_cigna", "name": "Cigna" }
  ]
}`,
  },
];

const SDK_SNIPPETS = {
  javascript: `// Install: npm install @tmslist/sdk

import { TMSListClient } from '@tmslist/sdk';

const client = new TMSListClient({
  apiKey: process.env.TMSLIST_API_KEY
});

// List clinics
const clinics = await client.clinics.list({
  state: 'CA',
  has_tms: true,
  limit: 20
});

// Get clinic details
const clinic = await client.clinics.get('clinic_abc123');

// Submit a lead
const lead = await client.leads.create({
  clinic_id: 'clinic_abc123',
  name: 'John Smith',
  email: 'john@example.com',
  phone: '+1-555-0123',
  insurance: 'Aetna'
});

console.log(clinics.data.length, 'clinics found');`,

  python: `# Install: pip install tmslist-sdk

from tmslist import TMSListClient

client = TMSListClient(api_key=os.environ.get('TMSLIST_API_KEY'))

# List clinics
clinics = client.clinics.list(
    state='CA',
    has_tms=True,
    limit=20
)

# Get clinic details
clinic = client.clinics.get('clinic_abc123')

# Submit a lead
lead = client.leads.create(
    clinic_id='clinic_abc123',
    name='John Smith',
    email='john@example.com',
    phone='+1-555-0123',
    insurance='Aetna'
)

print(f"{len(clinics.data)} clinics found")`,
};

export default function AdminApiDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSdk, setActiveSdk] = useState<'javascript' | 'python'>('javascript');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(ENDPOINTS.map(e => e.category)))];

  const filteredEndpoints = ENDPOINTS.filter(e => {
    if (activeCategory !== 'all' && e.category !== activeCategory) return false;
    if (searchQuery && !e.path.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const METHOD_COLORS: Record<string, string> = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-violet-100 text-violet-700',
    PUT: 'bg-amber-100 text-amber-700',
    PATCH: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">API Documentation</h1>
          <p className="text-gray-500 mt-1">TMS List API reference, authentication, and SDK examples</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-emerald-700">API Status: Operational</span>
        </div>
      </div>

      {/* Auth guide */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              All API requests require an API key passed via the <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">Authorization</code> header.
            </p>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2">Example Request</p>
              <pre className="text-sm text-green-400 font-mono overflow-x-auto">
{`curl -X GET "https://api.tmslist.com/v1/clinics" \\
  -H "Authorization: Bearer tms_sk_live_xxxxx" \\
  -H "Content-Type: application/json"`}
              </pre>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Rate limits are applied per API key and vary by plan:
            </p>
            <div className="space-y-2">
              {[
                { plan: 'Starter', limit: '1,000 req/day' },
                { plan: 'Professional', limit: '10,000 req/day' },
                { plan: 'Enterprise', limit: '100,000 req/day' },
              ].map(p => (
                <div key={p.plan} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-700">{p.plan}</span>
                  <span className="text-sm font-mono text-gray-500">{p.limit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: endpoint list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 sticky top-8">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
              />
            </div>
            <div className="p-2 border-b border-gray-200">
              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      activeCategory === cat
                        ? 'bg-violet-100 text-violet-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredEndpoints.map(endpoint => (
                <button
                  key={endpoint.path}
                  onClick={() => setSelectedEndpoint(endpoint)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedEndpoint?.path === endpoint.path ? 'bg-violet-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${METHOD_COLORS[endpoint.method]}`}>
                      {endpoint.method}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      endpoint.auth === 'required' ? 'bg-red-50 text-red-600' :
                      endpoint.auth === 'optional' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {endpoint.auth === 'required' ? 'Auth' : endpoint.auth === 'optional' ? 'Opt' : 'None'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{endpoint.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{endpoint.path}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main: endpoint detail */}
        <div className="lg:col-span-2">
          {selectedEndpoint ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 text-sm font-bold rounded ${METHOD_COLORS[selectedEndpoint.method]}`}>
                    {selectedEndpoint.method}
                  </span>
                  <code className="text-lg font-mono font-semibold text-gray-900">{selectedEndpoint.path}</code>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedEndpoint.name}</h2>
                <p className="text-gray-500 mt-1">{selectedEndpoint.description}</p>
                <div className="flex gap-3 mt-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    selectedEndpoint.auth === 'required' ? 'bg-red-50 text-red-600' :
                    selectedEndpoint.auth === 'optional' ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    Auth: {selectedEndpoint.auth}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    Rate: {selectedEndpoint.rateLimit}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-600">
                    {selectedEndpoint.category}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Parameters */}
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Parameters</h3>
                    <div className="space-y-2">
                      {selectedEndpoint.parameters.map(param => (
                        <div key={param.name} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 min-w-32 flex-shrink-0">{param.name}</code>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{param.type}</span>
                              {param.required && (
                                <span className="text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">required</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{param.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Request body */}
                {selectedEndpoint.requestBody && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Request Body</h3>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-100 font-mono">
{`{
  ${Object.entries(selectedEndpoint.requestBody.properties).map(([k, v]) => `"${k}": ${v}`).join(',\n  ')}
}`}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Response */}
                {selectedEndpoint.responseExample && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Response Example</h3>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400">200 OK</span>
                        <button className="text-xs text-violet-400 hover:text-violet-300">Copy</button>
                      </div>
                      <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                        {selectedEndpoint.responseExample}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">Select an endpoint from the sidebar to view documentation</p>
            </div>
          )}

          {/* SDK snippets */}
          <div className="bg-white rounded-xl border border-gray-200 mt-8 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">SDK Examples</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveSdk('javascript')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeSdk === 'javascript' ? 'bg-amber-400 text-yellow-900' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  JavaScript
                </button>
                <button
                  onClick={() => setActiveSdk('python')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    activeSdk === 'python' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>
            <div className="bg-gray-900 p-5 overflow-x-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400">{activeSdk === 'javascript' ? 'JavaScript / TypeScript' : 'Python'}</span>
                <button className="text-xs text-violet-400 hover:text-violet-300">Copy</button>
              </div>
              <pre className="text-sm text-green-400 font-mono whitespace-pre overflow-x-auto">
                {activeSdk === 'javascript' ? SDK_SNIPPETS.javascript : SDK_SNIPPETS.python}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
