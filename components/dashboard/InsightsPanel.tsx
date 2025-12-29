'use client';

import { Partner } from '@/lib/types';
import { formatReach } from '@/lib/utils';

function topCounts(values: string[]) {
  const counts: Record<string, number> = {};
  values.filter(Boolean).forEach((v) => {
    counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

export default function InsightsPanel({ partners }: { partners: Partner[] }) {
  if (!partners.length) return null;

  const activePartners = partners.filter((p) => p.relationshipStatus === 'Active');
  const reachTotal = activePartners.reduce((sum, p) => sum + (p.reach || 0), 0);
  const topCategories = topCounts(partners.map((p) => p.category || ''));
  const topPersonas = topCounts(partners.map((p) => p.persona || ''));
  const topTypes = topCounts(partners.map((p) => p.type || ''));
  const statusCounts = (() => {
    const map: Record<string, number> = {};
    partners.forEach((p) => {
      const s = p.relationshipStatus || 'Unspecified';
      map[s] = (map[s] || 0) + 1;
    });
    return map;
  })();

  const reachValues = activePartners.map((p) => p.reach || 0).filter((n) => n > 0);
  const hasTrend = reachValues.length > 1;
  const topReachShare = (() => {
    if (!reachValues.length || !reachTotal) return 0;
    const top3 = [...reachValues].sort((a, b) => b - a).slice(0, 3);
    return Math.round((top3.reduce((s, n) => s + n, 0) / reachTotal) * 100);
  })();

  const sparkPoints = (() => {
    if (!hasTrend) return '';
    const w = 120;
    const h = 40;
    const max = Math.max(...reachValues);
    return reachValues
      .map((v, i) => {
        const x = (i / Math.max(reachValues.length - 1, 1)) * w;
        const y = h - (v / max) * h;
        return `${x},${y}`;
      })
      .join(' ');
  })();

  const statusPalette: Record<string, string> = {
    Prospect: 'var(--info)',
    Engaged: 'var(--accent)',
    Active: 'var(--success)',
    Disqualified: 'var(--danger)',
  };

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-xl border border-[var(--border)] p-4 shadow-sm bg-[var(--surface)] space-y-3">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">Status Mix</p>
        <div className="h-2 rounded-full overflow-hidden bg-[var(--surface2)] border border-[var(--border)]">
          <div className="flex h-full">
            {Object.entries(statusCounts).map(([label, count]) => (
              <div
                key={label}
                style={{ width: `${(count / partners.length) * 100}%`, background: statusPalette[label] || 'var(--accentSoft)' }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-[var(--muted)]">
          {Object.entries(statusCounts).map(([label, count]) => (
            <span key={label} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--surface2)] border border-[var(--border)]">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: statusPalette[label] || 'var(--accentSoft)' }}
              />
              {label} · {count}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] p-4 shadow-sm bg-[var(--surface)] space-y-3">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">Reach Concentration</p>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-semibold text-[var(--text)]">{formatReach(reachTotal)}</div>
          <div className="text-sm text-[var(--muted)]">Top 3: {topReachShare || 0}%</div>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--surface2)] border border-[var(--border)] overflow-hidden">
          <div
            className="h-full bg-[var(--accent)]"
            style={{ width: `${Math.min(topReachShare || 0, 100)}%`, opacity: 0.9 }}
          />
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] p-4 shadow-sm bg-[var(--surface)] space-y-3">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)]">Reach Trend</p>
        {hasTrend ? (
          <svg width="120" height="40" viewBox="0 0 120 40" fill="none">
            <polyline points={sparkPoints} stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {sparkPoints.split(' ').map((pt, idx) => {
              const [x, y] = pt.split(',').map(Number);
              return <circle key={idx} cx={x} cy={y} r={2} fill="var(--accent2)" />;
            })}
          </svg>
        ) : (
          <div className="text-sm text-[var(--muted)]">No trend data available</div>
        )}
      </div>
    </div>
  );
}
