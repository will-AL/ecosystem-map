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

  const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      urls: request.seedUrls,
      competitorDomains: request.competitorDomains,
      keywords: request.keywords,
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
