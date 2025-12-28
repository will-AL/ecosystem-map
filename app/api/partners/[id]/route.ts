import { NextRequest, NextResponse } from 'next/server';
import { getPartnerById, updatePartner } from '@/lib/notion';
import { getMockPartnerById } from '@/lib/mockData';

const useMock = () =>
  !process.env.NOTION_API_KEY ||
  process.env.NOTION_API_KEY === 'dummy' ||
  process.env.NOTION_DATABASE_ID === 'dummy';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (useMock()) {
      const partner = getMockPartnerById(params.id);
      if (!partner) {
        return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
      }
      const notionUrl = `https://notion.so/${params.id.replace(/-/g, '')}`;
      return NextResponse.json({ partner: { ...partner, notionUrl }, mock: true });
    }

    const partner = await getPartnerById(params.id);
    const notionUrl = `https://notion.so/${params.id.replace(/-/g, '')}`;

    return NextResponse.json({
      partner: { ...partner, notionUrl },
    });
  } catch (error) {
    console.error('Error fetching partner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner' },
      { status: 500 }
    );
  }
}

// Optional: Milestone 4 write-back
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    await updatePartner(params.id, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating partner:', error);
    return NextResponse.json(
      { error: 'Failed to update partner' },
      { status: 500 }
    );
  }
}
