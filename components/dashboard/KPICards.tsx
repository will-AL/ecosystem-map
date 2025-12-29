'use client';

import { DashboardMetrics } from '@/lib/types';
import { formatNumber, formatReach } from '@/lib/utils';

interface KPICardsProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

export default function KPICards({ metrics, loading }: KPICardsProps) {
  if (loading || !metrics) return null;

  return (
    <div className="flex flex-wrap gap-x-12 gap-y-6">
      <div>
        <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-1">Total Partners</h3>
        <p className="text-2xl font-semibold text-[var(--text)]">{formatNumber(metrics.totalPartners)}</p>
      </div>
      <div>
        <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-1">Engaged</h3>
        <p className="text-2xl font-semibold text-[var(--accent)]">{formatNumber(metrics.engagedPartners)}</p>
      </div>
      <div>
        <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-1">Total Reach</h3>
        <p className="text-2xl font-semibold text-[var(--text)]">{formatReach(metrics.totalReach)}</p>
      </div>
      <div className="flex gap-8">
        <div>
          <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-1">People</h3>
          <p className="text-lg font-medium text-[var(--text)]">{metrics.byType.Person}</p>
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-1">Brands</h3>
          <p className="text-lg font-medium text-[var(--text)]">{metrics.byType.Brand}</p>
        </div>
        <div>
          <h3 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-1">Places</h3>
          <p className="text-lg font-medium text-[var(--text)]">{metrics.byType.Place}</p>
        </div>
      </div>
    </div>
  );
}
