import { createClient } from '@supabase/supabase-js';
import { FirecrawlDiscovery } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Get discoveries for a client
export async function getDiscoveriesByClient(clientName: string) {
  const { data, error } = await supabase
    .from('firecrawl_discoveries')
    .select('*')
    .eq('client_name', clientName)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as FirecrawlDiscovery[];
}

// Create discovery
export async function createDiscovery(discovery: Omit<FirecrawlDiscovery, 'id' | 'created_at' | 'status'>) {
  const { data, error } = await supabase
    .from('firecrawl_discoveries')
    .insert([{ ...discovery, status: 'pending' }])
    .select()
    .single();

  if (error) throw error;
  return data as FirecrawlDiscovery;
}

// Bulk create discoveries
export async function createDiscoveries(
  discoveries: Array<Omit<FirecrawlDiscovery, 'id' | 'created_at' | 'status'>>
) {
  if (discoveries.length === 0) return [];

  const payload = discoveries.map((d) => ({ ...d, status: 'pending' }));

  const { data, error } = await supabase
    .from('firecrawl_discoveries')
    .insert(payload)
    .select();

  if (error) throw error;
  return data as FirecrawlDiscovery[];
}

// Update discovery status
export async function updateDiscoveryStatus(
  id: string,
  status: 'approved' | 'rejected',
  notionPageId?: string
) {
  const { error } = await supabase
    .from('firecrawl_discoveries')
    .update({ status, notion_page_id: notionPageId })
    .eq('id', id);

  if (error) throw error;
}

// Bulk approve discoveries
export async function bulkApproveDiscoveries(ids: string[]) {
  const { error } = await supabase
    .from('firecrawl_discoveries')
    .update({ status: 'approved' })
    .in('id', ids);

  if (error) throw error;
}
