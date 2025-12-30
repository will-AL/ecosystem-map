// Firecrawl API integration (thin wrapper around crawl endpoint)
// This assumes Firecrawl returns { id, results?: [...] }. Results may be empty if crawling is async.

export interface CrawlResult {
  partnerName: string;
  website?: string;
  category?: string;
  partnerType?: string;
  notes?: string;
  inferredReach?: number;
  sourceUrl?: string;
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

// Discovery config
export type PartnerDiscoveryMode = 'standard' | 'aggressive';

export interface PartnerDiscoveryConfig {
  mode: PartnerDiscoveryMode;
  maxDepth: number;
  maxPages: number;
  includeSubdomains: boolean;
  allowedSubdomains?: string[];
  maxPartners: number;
  agenticThreshold: number;
  agenticMaxDirectoryPages: number;
  agenticMaxPaginationAttempts: number;
  cacheTTLms: number;
}

export const DISCOVERY_CONFIGS: Record<PartnerDiscoveryMode, PartnerDiscoveryConfig> = {
  standard: {
    mode: 'standard',
    maxDepth: 2,
    maxPages: 120,
    includeSubdomains: false,
    allowedSubdomains: [],
    maxPartners: 200,
    agenticThreshold: 8,
    agenticMaxDirectoryPages: 2,
    agenticMaxPaginationAttempts: 1,
    cacheTTLms: 24 * 60 * 60 * 1000,
  },
  aggressive: {
    mode: 'aggressive',
    maxDepth: 3,
    maxPages: 300,
    includeSubdomains: true,
    allowedSubdomains: ['marketplace.', 'apps.', 'partners.'],
    maxPartners: 400,
    agenticThreshold: 8,
    agenticMaxDirectoryPages: 2,
    agenticMaxPaginationAttempts: 1,
    cacheTTLms: 24 * 60 * 60 * 1000,
  },
};

type CacheKey = string;
const discoveryCache = new Map<CacheKey, { expires: number; results: CrawlResult[]; directoryUrls: string[] }>();

function makeCacheKey(baseUrl: string, mode: PartnerDiscoveryMode) {
  try {
    const url = new URL(baseUrl);
    return `${url.hostname.toLowerCase()}::${mode}`;
  } catch {
    return `${baseUrl}::${mode}`;
  }
}

export async function startCrawl(primaryUrl: string): Promise<{ jobId: string; results: CrawlResult[] }> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('Missing FIRECRAWL_API_KEY');
  }

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
    sourceUrl: url,
  }));
}

// Helpers for map/shortlist/extract/agentic
const ALLOWLIST_RE = /(partner|partners|integration|integrations|marketplace|app[-]?marketplace|apps|directory|technology[-]?partners|solutions[-]?partners)(\/|$)/i;
const DENYLIST_RE = /(blog|press|news|events|webinars|careers|jobs|privacy|terms|legal|security|status|pricing|about|contact|support|docs|documentation|community)(\/|$)/i;
const BLOCKED_EXT = ['.pdf', '.png', '.jpg', '.jpeg', '.svg', '.zip'];

function isBlocked(url: string) {
  return BLOCKED_EXT.some((ext) => url.toLowerCase().includes(ext));
}

async function findDirectoryPages(baseUrl: string, config: PartnerDiscoveryConfig): Promise<{ candidates: string[]; total: number; filtered: number }> {
  if (!process.env.FIRECRAWL_API_KEY) throw new Error('Missing FIRECRAWL_API_KEY');
  // Firecrawl MAP endpoint contract may differ; best-effort implementation
  const resp = await fetch('https://api.firecrawl.dev/v1/map', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: baseUrl,
      includeSubdomains: config.includeSubdomains,
      limit: config.maxPages,
      maxDepth: config.maxDepth,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Firecrawl map failed: ${resp.status} ${txt}`);
  }
  const data = await resp.json();
  const urls: string[] = data?.urls || data?.data?.map?.urls || [];
  const filtered = urls
    .filter((u: string) => !isBlocked(u))
    .filter((u: string) => ALLOWLIST_RE.test(u) && !DENYLIST_RE.test(u));

  const scored = filtered.map((u) => {
    const l = u.toLowerCase();
    let score = 0;
    if (ALLOWLIST_RE.test(l)) score += 2;
    if (l.includes('partner')) score += 1;
    if (l.includes('integration')) score += 1;
    if (l.includes('marketplace')) score += 1;
    return { url: u, score };
  });
  const ranked = scored.sort((a, b) => b.score - a.score).map((s) => s.url);
  return { candidates: ranked.slice(0, 10), total: urls.length, filtered: filtered.length };
}

function dedupePartners(partners: CrawlResult[]): { results: CrawlResult[]; dropped: number } {
  const seen = new Set<string>();
  const out: CrawlResult[] = [];
  let dropped = 0;
  for (const p of partners) {
    const name = (p.partnerName || '').trim().toLowerCase();
    const host = (() => {
      try {
        return p.website ? new URL(p.website).hostname.toLowerCase() : p.sourceUrl ? new URL(p.sourceUrl).hostname.toLowerCase() : '';
      } catch {
        return '';
      }
    })();
    const key = `${name}::${host}`;
    if (!name || seen.has(key)) {
      dropped += 1;
      continue;
    }
    seen.add(key);
    out.push(p);
  }
  return { results: out, dropped };
}

// Agentic placeholder: reuse extract with same prompt but mark agenticRan
async function agenticExtract(urls: string[], config: PartnerDiscoveryConfig) {
  const attempts: Array<{ url: string; paginationAttempted: boolean; partnersExtracted: number }> = [];
  let collected: CrawlResult[] = [];
  for (let i = 0; i < urls.length && i < config.agenticMaxDirectoryPages; i++) {
    const url = urls[i];
    const res = await extractPartnersFromUrl(url);
    attempts.push({ url, paginationAttempted: false, partnersExtracted: res.length });
    collected = collected.concat(res);
    if (collected.length >= config.maxPartners) break;
  }
  return { partners: collected, attempts };
}

export interface DiscoveryTrace {
  step: string;
  info?: any;
}

export async function discoverPartners(seedUrl: string, mode: PartnerDiscoveryMode): Promise<{
  jobId: string;
  results: CrawlResult[];
  trace: DiscoveryTrace[];
}> {
  const config = DISCOVERY_CONFIGS[mode];
  const trace: DiscoveryTrace[] = [{ step: 'config', info: config }];
  const cacheKey = makeCacheKey(seedUrl, mode);
  const now = Date.now();

  const cached = discoveryCache.get(cacheKey);
  if (cached && cached.expires > now) {
    trace.push({ step: 'cache_hit', info: { cacheKey, count: cached.results.length } });
    return { jobId: `cached-${cacheKey}`, results: cached.results.slice(0, config.maxPartners), trace };
  }

  // Fast-path candidates from patterns
  const fastCandidates = buildCandidateUrls(seedUrl);
  trace.push({ step: 'fast_path_candidates', info: { fastPathCandidatesTried: fastCandidates } });

  let collected: CrawlResult[] = [];
  const extractedUrls: Array<{ url: string; partnersExtracted: number; partnersKept: number; partnersDropped: number }> = [];

  for (const url of fastCandidates) {
    const res = await extractPartnersFromUrl(url);
    const filtered = res.filter((p) => p.partnerName && (p.website || p.notes));
    const { results: deduped, dropped } = dedupePartners(filtered);
    extractedUrls.push({ url, partnersExtracted: res.length, partnersKept: deduped.length, partnersDropped: dropped });
    collected = collected.concat(deduped);
    if (collected.length >= 25 || collected.length >= config.maxPartners) break;
  }

  // MAP / shortlist / extract if needed
  if (collected.length < config.agenticThreshold) {
    try {
      const mapRes = await findDirectoryPages(seedUrl, config);
      trace.push({
        step: 'map',
        info: {
          mapTotalUrls: mapRes.total,
          mapFilteredUrls: mapRes.filtered,
          shortlistedDirectoryUrls: mapRes.candidates,
        },
      });

      for (const url of mapRes.candidates) {
        const res = await extractPartnersFromUrl(url);
        const filtered = res.filter((p) => p.partnerName && (p.website || p.notes));
        const { results: deduped, dropped } = dedupePartners(filtered);
        extractedUrls.push({ url, partnersExtracted: res.length, partnersKept: deduped.length, partnersDropped: dropped });
        collected = collected.concat(deduped);
        if (collected.length >= 25 || collected.length >= config.maxPartners) break;
      }
    } catch (err) {
      trace.push({ step: 'map_error', info: { error: (err as Error)?.message } });
    }
  }

  // Agentic fallback if still low
  let agenticRan = false;
  const agenticAttempts: Array<{ url: string; paginationAttempted: boolean; partnersExtracted: number }> = [];
  if (collected.length < config.agenticThreshold) {
    agenticRan = true;
    const candidates = extractedUrls.map((e) => e.url);
    const { partners, attempts } = await agenticExtract(candidates.length ? candidates : fastCandidates.slice(0, 2), config);
    const filtered = partners.filter((p) => p.partnerName && (p.website || p.notes));
    const { results: deduped, dropped } = dedupePartners(filtered);
    agenticAttempts.push(...attempts);
    extractedUrls.push({ url: 'agentic', partnersExtracted: partners.length, partnersKept: deduped.length, partnersDropped: dropped });
    collected = collected.concat(deduped);
  }

  const { results: dedupedFinal, dropped: dedupeDropped } = dedupePartners(collected);
  let finalResults = dedupedFinal.slice(0, config.maxPartners);

  // Cache store
  discoveryCache.set(cacheKey, {
    expires: now + config.cacheTTLms,
    results: finalResults,
    directoryUrls: extractedUrls.map((e) => e.url),
  });

  trace.push({
    step: 'extract_summary',
    info: {
      extractedUrls,
      dedupeDroppedCount: dedupeDropped,
      agenticRan,
      agenticAttempts,
      finalPartnerCount: finalResults.length,
      terminationReason:
        finalResults.length >= config.agenticThreshold
          ? 'map_extract_success'
          : agenticRan && finalResults.length > 0
          ? 'agentic_fallback_success'
          : finalResults.length === 0
          ? 'no_directory_found'
          : 'failed',
    },
  });

  return { jobId: `discover-${Date.now()}`, results: finalResults, trace };
}
