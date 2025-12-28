import { NextRequest, NextResponse } from 'next/server';
import { getPartnersByClient } from '@/lib/notion';
import { getMockPartnersByClient } from '@/lib/mockData';

const useMock = () =>
  !process.env.NOTION_API_KEY ||
  process.env.NOTION_API_KEY === 'dummy' ||
  process.env.NOTION_DATABASE_ID === 'dummy';

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
      const { partners, metrics } = getMockPartnersByClient(client);
      return NextResponse.json({ partners, metrics, mock: true });
    }

    const { partners, metrics } = await getPartnersByClient(client);

    return NextResponse.json({ partners, metrics });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}
