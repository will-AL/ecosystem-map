import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveriesByClient } from '@/lib/supabase';
import { mockDiscoveries } from '@/lib/mockData';

const useMock = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost' ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const client = searchParams.get('client');

    if (!client) {
      return NextResponse.json(
        { error: 'Client parameter is required' },
        { status: 400 }
      );
    }

    if (useMock() || client === 'Demo Client') {
      const discoveries = mockDiscoveries.filter(d => d.client_name === client);
      return NextResponse.json({ discoveries, mock: true });
    }

    const discoveries = await getDiscoveriesByClient(client);

    return NextResponse.json({ discoveries });
  } catch (error) {
    console.error('Error fetching discoveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discoveries' },
      { status: 500 }
    );
  }
}
