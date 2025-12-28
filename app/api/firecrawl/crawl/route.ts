import { NextRequest, NextResponse } from 'next/server';
import { startCrawl } from '@/lib/firecrawl';

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

    const { jobId } = await startCrawl({
      clientName,
      seedUrls,
      competitorDomains: competitorDomains || [],
      keywords: keywords || [],
    });

    return NextResponse.json({ jobId, status: 'processing' });
  } catch (error) {
    console.error('Error starting crawl:', error);
    return NextResponse.json(
      { error: 'Failed to start crawl' },
      { status: 500 }
    );
  }
}
