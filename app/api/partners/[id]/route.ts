import { NextRequest, NextResponse } from 'next/server';
import { getPartnerById, updatePartner } from '@/lib/notion';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
