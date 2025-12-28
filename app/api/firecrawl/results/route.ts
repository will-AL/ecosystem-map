import { NextRequest, NextResponse } from 'next/server';
import { getCrawlResults } from '@/lib/firecrawl';
import { createDiscoveries } from '@/lib/supabase';
import { mockDiscoveries } from '@/lib/mockData';

const useMock = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost' ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy' ||
  !process.env.FIRECRAWL_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');
    const client = searchParams.get('client');

    if (!jobId || !client) {
      return NextResponse.json(
        { error: 'jobId and client are required' },
        { status: 400 }
      );
    }

    if (useMock() || client === 'Demo Client') {
      const discoveries = mockDiscoveries.filter((d) => d.client_name === client);
      return NextResponse.json({ discoveries, mock: true });
    }

    const results = await getCrawlResults(jobId);

    if (results.length === 0) {
      return NextResponse.json({ discoveries: [], stored: 0 });
    }

    const toInsert = results.map((r) => ({
      client_name: client,
      partner_name: r.partnerName,
      website: r.website,
      category: r.category,
      partner_type: r.partnerType,
      notes: r.notes,
      inferred_reach: r.inferredReach,
    }));

    const inserted = await createDiscoveries(toInsert as any);

    return NextResponse.json({ discoveries: inserted, stored: inserted.length });
  } catch (error) {
    console.error('Error fetching crawl results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crawl results' },
      { status: 500 }
    );
  }
}
