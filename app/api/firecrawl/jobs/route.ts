import { NextRequest, NextResponse } from 'next/server';
import { getLatestPartnerJob } from '@/lib/supabase';
import { getLatestJobLogByClient } from '@/lib/firecrawlJobs';

export async function GET(request: NextRequest) {
  const client = request.nextUrl.searchParams.get('client');
  if (!client) {
    return NextResponse.json({ error: 'Client parameter is required' }, { status: 400 });
  }

  // Demo/in-memory first
  if (client === 'Demo Client' || !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost' || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy') {
    const log = getLatestJobLogByClient(client);
    return NextResponse.json({ job: log || null });
  }

  try {
    const job = await getLatestPartnerJob(client);
    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching latest partner job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}
