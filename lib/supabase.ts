import { createClient } from '@supabase/supabase-js';
import { FirecrawlDiscovery } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Client-safe key (anon)
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Server-side service role key for writes
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log('Supabase not configured – running in demo mode');
}

// Use service role for all server-side inserts/updates; throw if missing on call
export const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

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

// Partner job persistence
export interface FirecrawlPartnerJobRow {
  id: string;
  client_name: string;
  seed_url: string;
  mode: string;
  status: 'running' | 'complete' | 'failed';
  config: any;
  trace: any;
  partner_count: number;
  termination_reason?: string | null;
  created_at: string;
}

export async function createPartnerJob(row: Omit<FirecrawlPartnerJobRow, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('firecrawl_partner_jobs')
    .insert([{ ...row, partner_count: row.partner_count ?? 0 }])
    .select()
    .single();
  if (error) throw error;
  return data as FirecrawlPartnerJobRow;
}

export async function updatePartnerJob(id: string, updates: Partial<FirecrawlPartnerJobRow>) {
  const { data, error } = await supabase
    .from('firecrawl_partner_jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FirecrawlPartnerJobRow;
}

export async function getLatestPartnerJob(clientName: string) {
  const { data, error } = await supabase
    .from('firecrawl_partner_jobs')
    .select('*')
    .eq('client_name', clientName)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data as FirecrawlPartnerJobRow;
}
