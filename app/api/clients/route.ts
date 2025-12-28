import { NextRequest, NextResponse } from 'next/server';
import { getClientList } from '@/lib/notion';
import { getMockClients } from '@/lib/mockData';

const useMock = () =>
  !process.env.NOTION_API_KEY ||
  process.env.NOTION_API_KEY === 'dummy' ||
  !process.env.NOTION_DATABASE_ID ||
  process.env.NOTION_DATABASE_ID === 'dummy';

export async function GET(_request: NextRequest) {
  try {
    if (useMock()) {
      return NextResponse.json({ clients: getMockClients(), mock: true });
    }

    const clients = await getClientList();
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
