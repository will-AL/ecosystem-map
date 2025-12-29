import { NextRequest, NextResponse } from 'next/server';
import { startCrawl, structuredDiscover } from '@/lib/firecrawl';
import { mockDiscoveries } from '@/lib/mockData';
import { createDiscoveries } from '@/lib/supabase';

// Supabase writes are optional; Firecrawl requires its API key.
const shouldMockStorage = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost' ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy';

const canCallFirecrawl = () => !!process.env.FIRECRAWL_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, seedUrls, competitorDomains, keywords } = body;

    if (!clientName || !seedUrls || seedUrls.length === 0) {
      return NextResponse.json(
        { error: 'Client name and seed URLs are required' },
        { status: 400 }
      );
    }

    // Helper to stash results based on storage mode
    const storeResults = async (jobId: string, results: any[], allowSupabase: boolean) => {
      if (results.length === 0) return 0;
      if (allowSupabase) {
        const toInsert = results.map((r) => ({
          client_name: clientName,
          partner_name: r.partnerName,
          website: r.website,
          category: r.category,
          partner_type: r.partnerType,
          notes: r.notes,
          inferred_reach: r.inferredReach,
        }));
        try {
          await createDiscoveries(toInsert as any);
          return results.length;
        } catch (err) {
          console.error('Failed to persist Firecrawl results to Supabase:', err);
        }
      }
      // fallback to in-memory mock (Demo or no Supabase)
      results.forEach((r, idx) => {
        mockDiscoveries.unshift({
          id: `${jobId}-${idx}`,
          client_name: clientName,
          partner_name: r.partnerName,
          website: r.website,
          category: r.category,
          partner_type: r.partnerType,
          notes: r.notes,
          inferred_reach: r.inferredReach,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      });
      return results.length;
    };

    // First, try structured extraction (pattern-based) to reduce noise/cost.
    let structuredStored = 0;
    let structuredJobId = '';
    if (canCallFirecrawl()) {
      const { jobId, results } = await structuredDiscover(seedUrls[0]);
      structuredJobId = jobId;
      structuredStored = await storeResults(jobId || `structured-${Date.now()}`, results, clientName !== 'Demo Client' && !shouldMockStorage());
      if (results.length > 0) {
        return NextResponse.json({
          jobId: jobId || `structured-${Date.now()}`,
          status: 'completed',
          structured: true,
          mock: clientName === 'Demo Client' || shouldMockStorage(),
          stored: structuredStored,
        });
      }
    }

    // Demo client: if we have a Firecrawl key, call live API but store results in-memory only.
    if (clientName === 'Demo Client' && canCallFirecrawl()) {
      const { jobId, results } = await startCrawl({
        clientName,
        seedUrls,
        competitorDomains: competitorDomains || [],
        keywords: keywords || [],
      });

      const stored = await storeResults(jobId, results, false);
      return NextResponse.json({ jobId, status: 'processing', mock: true, stored });
    }

    // Otherwise, decide mock vs real based on envs.
    if (!canCallFirecrawl()) {
      // No Firecrawl key: fallback to mock for safety
      const jobId = `mock-job-${Date.now()}`;
      mockDiscoveries.unshift({
        id: jobId,
        client_name: clientName,
        partner_name: seedUrls[0] || 'New Discovery',
        website: seedUrls[0] || 'https://example.com',
        category: 'Generated',
        partner_type: 'Brand',
        notes: (keywords || []).join(', '),
        inferred_reach: 50000,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ jobId, status: 'processing', mock: true });
    }

    const { jobId, results } = await startCrawl({
      clientName,
      seedUrls,
      competitorDomains: competitorDomains || [],
      keywords: keywords || [],
    });

    const stored = await storeResults(jobId, results, !shouldMockStorage());

    return NextResponse.json({ jobId, status: 'processing', stored, structured: false, mock: shouldMockStorage() });
  } catch (error) {
    console.error('Error starting crawl:', error);
    return NextResponse.json(
      { error: 'Failed to start crawl', detail: (error as Error)?.message },
      { status: 500 }
    );
  }
}
