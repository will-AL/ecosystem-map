'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import KPICards from '@/components/dashboard/KPICards';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import BriefingTable from '@/components/briefing/BriefingTable';
import BriefingDrawer from '@/components/briefing/BriefingDrawer';
import { Partner, DashboardMetrics } from '@/lib/types';
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

        {loading ? (
          <div className="text-[var(--muted)]">Loading briefing...</div>
        ) : (
          <BriefingTable partners={filtered} onSelect={handlePartnerClick} />
        )}
      </div>

      <BriefingDrawer
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
