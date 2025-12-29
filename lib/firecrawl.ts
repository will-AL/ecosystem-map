// Firecrawl API integration (thin wrapper around crawl endpoint)
// This assumes Firecrawl returns { id, results?: [...] }. Results may be empty if crawling is async.

export interface CrawlRequest {
  clientName: string;
  seedUrls: string[];
  competitorDomains: string[];
  keywords: string[];
}

export interface CrawlResult {
  partnerName: string;
  website?: string;
  category?: string;
  partnerType?: string;
  notes?: string;
  inferredReach?: number;
}

interface FirecrawlResponse {
  id: string;
  results?: Array<{
    title?: string;
    url?: string;
    category?: string;
    description?: string;
    reach?: number;
    partnerType?: string;
  }>;
}

export async function startCrawl(request: CrawlRequest): Promise<{ jobId: string; results: CrawlResult[] }> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('Missing FIRECRAWL_API_KEY');
  }

  // Firecrawl v2 expects a single url field (not urls/keywords). Use the first seed URL.
  const primaryUrl = request.seedUrls[0];
  if (!primaryUrl) {
    throw new Error('At least one seed URL is required');
  }

  const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: primaryUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as FirecrawlResponse;
  const results =
    data.results?.map((r) => ({
      partnerName: r.title || r.url || 'Unknown',
      website: r.url,
      category: r.category,
      notes: r.description,
      inferredReach: r.reach,
      partnerType: (r as any).partnerType,
    })) || [];

  return { jobId: data.id, results };
}

export async function getCrawlResults(jobId: string): Promise<CrawlResult[]> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('Missing FIRECRAWL_API_KEY');
  }

  const response = await fetch(`https://api.firecrawl.dev/v1/crawl/${jobId}`, {
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl results failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as FirecrawlResponse;

  return (
    data.results?.map((r) => ({
      partnerName: r.title || r.url || 'Unknown',
      website: r.url,
      category: r.category,
      notes: r.description,
      inferredReach: r.reach,
      partnerType: (r as any).partnerType,
    })) || []
  );
}

// ------------------------------------------------------------
// Structured extraction aimed at partner directories

const DIRECTORY_PATTERNS = [
  '/integrations',
  '/partners',
  '/partner',
  '/marketplace',
  '/app-marketplace',
  '/apps',
  '/directory',
  '/technology-partners',
  '/solutions-partners',
  '/partners/integrations',
  '/partners/solutions',
  '/integrations/partners',
  '/integrations/apps',
];

function buildCandidateUrls(baseUrl: string): string[] {
  try {
    const url = new URL(baseUrl);
    const origin = `${url.protocol}//${url.host}`;
    const paths = new Set<string>();
    DIRECTORY_PATTERNS.forEach((p) => paths.add(origin.replace(/\/$/, '') + p));
    const root = url.hostname.split('.').slice(-2).join('.');
    ['marketplace', 'app', 'apps', 'partners'].forEach((sub) => {
      paths.add(`${url.protocol}//${sub}.${root}/`);
    });
    paths.add(baseUrl);
    return Array.from(paths);
  } catch {
    return [baseUrl];
  }
}

const extractionPrompt =
  'Extract ONLY official partners/integrations listed on this page as part of a partner directory, integration marketplace, or partner listing. ' +
  'Ignore customers, investors, testimonial logos, footer logos, and any mentions that are not part of a directory listing. ' +
  'Return partner name, category if present, partner URL if present, and a short description if present.';

const extractionSchema = {
  type: 'object',
  properties: {
    partners: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string' },
          partnerUrl: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  required: ['partners'],
};

async function extractPartnersFromUrl(url: string): Promise<CrawlResult[]> {
  if (!process.env.FIRECRAWL_API_KEY) throw new Error('Missing FIRECRAWL_API_KEY');

  const response = await fetch('https://api.firecrawl.dev/v1/extract', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      prompt: extractionPrompt,
      schema: extractionSchema,
      onlyMainContent: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl extract failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const partners = (data?.partners || data?.data?.partners || []) as any[];
  return partners.map((p, idx) => ({
    partnerName: p.name || `Partner ${idx + 1}`,
    website: p.partnerUrl || p.url,
    category: p.category,
    notes: p.description,
    inferredReach: undefined,
    partnerType: p.partnerType,
  }));
}

// Try structured extraction using directory-like candidate URLs.
export async function structuredDiscover(seedUrl: string): Promise<{ jobId: string; results: CrawlResult[] }> {
  const candidates = buildCandidateUrls(seedUrl);
  for (const candidate of candidates) {
    try {
      const results = await extractPartnersFromUrl(candidate);
      if (results.length > 0) {
        return { jobId: `structured-${Date.now()}`, results };
      }
    } catch (err) {
      console.warn('Structured extract failed for', candidate, err);
    }
  }
  return { jobId: '', results: [] };
}
