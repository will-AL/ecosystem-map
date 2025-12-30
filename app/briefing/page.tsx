'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import KPICards from '@/components/dashboard/KPICards';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import PartnerTable from '@/components/dashboard/PartnerTable';
import type { PartnerTableHandle } from '@/components/dashboard/PartnerTable';
import PartnerDrawer from '@/components/dashboard/PartnerDrawer';
import { Partner, DashboardMetrics } from '@/lib/types';
import RunSummary from '@/components/dashboard/RunSummary';
import { applyFilters } from '@/lib/utils';
import Link from 'next/link';

export default function BriefingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const client = searchParams.get('client');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedPartnerNotionUrl, setSelectedPartnerNotionUrl] = useState<string>('');
  const tableRef = useRef<PartnerTableHandle>(null);
  const [runSummary, setRunSummary] = useState<any>(null);
  const [runTrace, setRunTrace] = useState<any>(null);

  useEffect(() => {
    if (!client) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/partners?client=${encodeURIComponent(client)}`);
        const data = await res.json();
        if (res.ok) {
          setPartners(data.partners);
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    fetchRunSummary(client);
  }, [client]);

  const handlePartnerClick = async (partner: Partner) => {
    setSelectedPartner(partner);
    try {
      const response = await fetch(`/api/partners/${partner.id}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedPartner(data.partner);
        setSelectedPartnerNotionUrl(data.partner.notionUrl);
      }
    } catch (error) {
      console.error('Error fetching partner details:', error);
    }
  };

  if (!client) {
    return (
      <div className="dashboardShell" data-theme="light">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text)]">Partner Intelligence Briefing</h1>
              <p className="text-[var(--muted)]">Select a client to view a briefing.</p>
            </div>
            <Link href="/" className="text-[var(--accent)] text-sm font-semibold hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filtered = applyFilters(partners, {});

  const fetchRunSummary = async (clientName: string) => {
    try {
      const res = await fetch(`/api/firecrawl/jobs?client=${encodeURIComponent(clientName)}`);
      const data = await res.json();
      if (res.ok && data.job) {
        const trace = data.job.trace || [];
        const summary = extractSummary(trace);
        setRunSummary(summary);
        setRunTrace(trace);
      } else {
        setRunSummary(null);
        setRunTrace(null);
      }
    } catch {
      setRunSummary(null);
      setRunTrace(null);
    }
  };

  const extractSummary = (trace: any[]) => {
    if (!Array.isArray(trace)) return null;
    const extractInfo = trace.find((t) => t.step === 'extract_summary')?.info || {};
    const mapInfo = trace.find((t) => t.step === 'map')?.info || {};
    return {
      terminationReason: extractInfo.terminationReason,
      finalPartnerCount: extractInfo.finalPartnerCount,
      shortlistedCount: (mapInfo.shortlistedDirectoryUrls || []).length,
      extractedCount: (extractInfo.extractedUrls || []).length,
      dedupeDroppedCount: extractInfo.dedupeDroppedCount,
      agenticRan: extractInfo.agenticRan,
    };
  };

  return (
    <div className="dashboardShell" data-theme="light">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--muted)]">Read-only</p>
            <h1 className="text-3xl font-bold text-[var(--text)]">Partner Intelligence Briefing</h1>
            <p className="text-[var(--muted)]">Prepared for {client}</p>
            <p className="text-[var(--muted)] text-sm mt-1">Generated {new Date().toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[var(--accent)] text-sm font-semibold hover:underline">
              Back to Dashboard
            </Link>
            <a
              href="mailto:hello@audienceled.com"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent2)]"
            >
              Contact AudienceLed
            </a>
          </div>
        </div>

        {!loading && metrics && <KPICards metrics={metrics} loading={false} />}
        {!loading && filtered.length > 0 && <InsightsPanel partners={filtered} />}

        <RunSummary summary={runSummary} trace={runTrace} />

        {loading ? (
          <div className="text-[var(--muted)]">Loading briefing...</div>
        ) : (
          <PartnerTable
            partners={filtered}
            onPartnerClick={handlePartnerClick}
            ref={tableRef}
            searchInputRef={null}
          />
        )}
      </div>

      <PartnerDrawer
        partner={selectedPartner}
        notionUrl={selectedPartnerNotionUrl}
        onClose={() => {
          setSelectedPartner(null);
          setSelectedPartnerNotionUrl('');
        }}
      />
    </div>
  );
}
