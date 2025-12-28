import { NextRequest, NextResponse } from 'next/server';
import { supabase, updateDiscoveryStatus } from '@/lib/supabase';
import { createPartner } from '@/lib/notion';
import { mockDiscoveries } from '@/lib/mockData';

const useMock = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'http://localhost' ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy' ||
  process.env.NOTION_API_KEY === 'dummy';

export async function POST(request: NextRequest) {
  try {
    const { discoveryIds } = await request.json();

    if (!discoveryIds || !Array.isArray(discoveryIds)) {
      return NextResponse.json(
        { error: 'Discovery IDs array is required' },
        { status: 400 }
      );
    }

    if (useMock()) {
      const created = [];
      for (const id of discoveryIds) {
        const discovery = mockDiscoveries.find(d => d.id === id);
        if (!discovery) continue;
        discovery.status = 'approved';
        discovery.notion_page_id = discovery.id;
        created.push({ discoveryId: discovery.id, notionPageId: discovery.id });
      }
      return NextResponse.json({ created, mock: true });
    }

    // Fetch discoveries
    const { data: discoveries, error } = await supabase
      .from('firecrawl_discoveries')
      .select('*')
      .in('id', discoveryIds);

    if (error) throw error;

    const created = [];

    // Create partners in Notion
    for (const discovery of discoveries || []) {
      try {
        const notionPageId = await createPartner({
          partnerName: discovery.partner_name,
          clientName: discovery.client_name,
          partnerType: discovery.partner_type,
          website: discovery.website,
          category: discovery.category,
          notes: discovery.notes,
          reach: discovery.inferred_reach,
          source: 'Firecrawl',
        });

        await updateDiscoveryStatus(discovery.id, 'approved', notionPageId);

        created.push({
          discoveryId: discovery.id,
          notionPageId,
        });
      } catch (err) {
        console.error(`Failed to create partner for discovery ${discovery.id}:`, err);
      }
    }

    return NextResponse.json({ created });
  } catch (error) {
    console.error('Error approving discoveries:', error);
    return NextResponse.json(
      { error: 'Failed to approve discoveries' },
      { status: 500 }
    );
  }
}
