import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveriesByClient } from '@/lib/supabase';

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
