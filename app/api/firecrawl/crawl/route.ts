import { NextRequest, NextResponse } from 'next/server';
import { startCrawl } from '@/lib/firecrawl';
import { mockDiscoveries } from '@/lib/mockData';
import { createDiscoveries } from '@/lib/supabase';

const useMock = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost' ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy' ||
  !process.env.FIRECRAWL_API_KEY;

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

    if (useMock() || clientName === 'Demo Client') {
      // Return a fake job ID and append a mock discovery so the UI can show results
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

    if (results.length > 0) {
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
      } catch (err) {
        console.error('Failed to persist Firecrawl results to Supabase:', err);
      }
    }

    return NextResponse.json({ jobId, status: 'processing', stored: results.length });
  } catch (error) {
    console.error('Error starting crawl:', error);
    return NextResponse.json(
      { error: 'Failed to start crawl' },
      { status: 500 }
    );
  }
}
