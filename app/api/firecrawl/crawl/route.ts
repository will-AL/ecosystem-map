import { NextRequest, NextResponse } from 'next/server';
import { discoverPartners, DISCOVERY_CONFIGS, PartnerDiscoveryMode } from '@/lib/firecrawl';
import { mockDiscoveries } from '@/lib/mockData';
import { createDiscoveries, createPartnerJob, updatePartnerJob, supabaseServiceRoleKey } from '@/lib/supabase';
import { addJobLog, updateJobLog } from '@/lib/firecrawlJobs';

// Supabase writes are optional; Firecrawl requires its API key.
const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost' &&
  !!supabaseServiceRoleKey;

const shouldMockStorage = () => !supabaseConfigured;

const canCallFirecrawl = () => !!process.env.FIRECRAWL_API_KEY;

export async function POST(request: NextRequest) {
  let supabaseJobId: string | null = null;
  let currentClient = '';
  let currentMode: PartnerDiscoveryMode = 'standard';
  try {
    const body = await request.json();
    const { clientName, seedUrls, mode: requestedMode } = body;
    currentClient = clientName;

    if (!clientName || !seedUrls || seedUrls.length === 0) {
      return NextResponse.json(
        { error: 'Client name and seed URLs are required' },
        { status: 400 }
      );
    }

    const mode: PartnerDiscoveryMode =
      requestedMode === 'aggressive' ? 'aggressive' : 'standard';
    currentMode = mode;
    const config = DISCOVERY_CONFIGS[mode];

    // Helper to stash results based on storage mode
    const storeResults = async (jobId: string, results: any[], allowSupabase: boolean, trace: any) => {
      if (results.length === 0) return 0;
      if (allowSupabase) {
        const toInsert = results.map((r) => ({
          client_name: clientName,
          partner_name: r.partnerName,
          website: r.website,
          category: r.category,
          partner_type: r.partnerType,
          notes: r.notes,
          inferred_reach: r.inferredReach,
        }));
        try {
          await createDiscoveries(toInsert as any);
          return results.length;
        } catch (err) {
          console.error('Failed to persist Firecrawl results to Supabase:', err);
        }
      }
      // fallback to in-memory mock (Demo or no Supabase)
      results.forEach((r, idx) => {
        mockDiscoveries.unshift({
          id: `${jobId}-${idx}`,
          client_name: clientName,
          partner_name: r.partnerName,
          website: r.website,
          category: r.category,
          partner_type: r.partnerType,
          notes: r.notes,
          inferred_reach: r.inferredReach,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      });
      return results.length;
    };

    // Prepare job persistence (non-demo)
    const shouldPersist = clientName !== 'Demo Client' && supabaseConfigured;
    let supabaseJobId: string | null = null;

    // Non-demo + Supabase: create running job row
    if (shouldPersist && canCallFirecrawl()) {
      if (!supabaseServiceRoleKey) {
        console.error('Supabase service role missing');
        return NextResponse.json({ error: 'Supabase insert failed' }, { status: 500 });
      }
      try {
        const job = await createPartnerJob({
          client_name: clientName,
          seed_url: seedUrls[0],
          mode,
          status: 'running',
          config,
          trace: {},
          partner_count: 0,
          termination_reason: null,
        });
        supabaseJobId = job.id;
      } catch (err) {
        console.error('Supabase insert failed:', err);
        return NextResponse.json({ error: 'Supabase insert failed' }, { status: 500 });
      }
    }

    if (!canCallFirecrawl()) {
      const jobId = `mock-job-${Date.now()}`;
      mockDiscoveries.unshift({
        id: jobId,
        client_name: clientName,
        partner_name: seedUrls[0] || 'New Discovery',
        website: seedUrls[0] || 'https://example.com',
        category: 'Generated',
        partner_type: 'Brand',
        notes: '',
        inferred_reach: 50000,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
      if (!supabaseConfigured) {
        console.log('Supabase not configured – running in demo/in-memory mode');
      }
      return NextResponse.json({ jobId, status: 'processing', mock: true });
    }

    const { jobId, results, trace } = await discoverPartners(seedUrls[0], mode);
    const stored = await storeResults(jobId, results, clientName !== 'Demo Client' && !shouldMockStorage(), trace);

    const terminationReason = trace.find((t: any) => t.step === 'extract_summary')?.info?.terminationReason;

    addJobLog({
      clientName,
      mode,
      config,
      trace,
      jobId,
      status: 'complete',
      partnerCount: results.length,
      terminationReason,
      createdAt: new Date().toISOString(),
    });

    if (supabaseJobId) {
      try {
        const summary = trace.find((t: any) => t.step === 'extract_summary')?.info;
        await updatePartnerJob(supabaseJobId, {
          status: 'complete',
          config,
          trace,
          partner_count: results.length,
          termination_reason: summary?.terminationReason || null,
        });
      } catch (err) {
        console.error('Failed to update partner job row:', err);
      }
    }

    return NextResponse.json({
      jobId,
      status: results.length > 0 ? 'completed' : 'processing',
      mock: clientName === 'Demo Client' || shouldMockStorage(),
      stored,
      mode,
      partnerCount: results.length,
      terminationReason,
    });
  } catch (error) {
    console.error('Error starting crawl:', error);
    // Attempt to mark job failed if it was created
    if (typeof supabaseJobId !== 'undefined' && supabaseJobId) {
      try {
        await updatePartnerJob(supabaseJobId, { status: 'failed', trace: [{ step: 'error', info: (error as Error)?.message }] });
      } catch (err) {
        console.error('Failed to update partner job row on error:', err);
      }
    }
    addJobLog({
      clientName: currentClient || 'unknown',
      mode: currentMode,
      config: {},
      trace: [{ step: 'error', info: (error as Error)?.message }],
      jobId: `error-${Date.now()}`,
      status: 'failed',
      partnerCount: 0,
      terminationReason: 'failed',
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to start crawl', detail: (error as Error)?.message },
      { status: 500 }
    );
  }
}
