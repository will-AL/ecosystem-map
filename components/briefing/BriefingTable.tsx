'use client';

import { useMemo, useState } from 'react';
import { Partner } from '@/lib/types';
import { formatReach } from '@/lib/utils';
import { getStatusPillClasses, getTypeBadgeClasses } from '@/lib/presentation';

interface BriefingTableProps {
  partners: Partner[];
  onSelect: (partner: Partner) => void;
}

export default function BriefingTable({ partners, onSelect }: BriefingTableProps) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const filtered = useMemo(() => {
    if (!statusFilter) return partners;
    return partners.filter((p) => p.relationshipStatus === statusFilter);
  }, [partners, statusFilter]);

  if (!partners.length) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-lg text-center text-[var(--muted)]">
        No partners available for this client.
      </div>
    );
  }

  const statuses = Array.from(new Set(partners.map((p) => p.relationshipStatus).filter(Boolean) as string[]));

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] text-sm">
        <div className="text-[var(--text)] font-semibold">Partner Directory</div>
        {statuses.length > 0 && (
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="px-2 py-1 text-sm border border-[var(--border)] rounded-md bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accentSoft)]"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)]">
          <thead className="bg-[var(--surface2)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Partner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Reach</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Tier</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--surface)] divide-y divide-[var(--border)]">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--accentSoft)] cursor-pointer" onClick={() => onSelect(p)}>
                <td className="px-6 py-3 text-sm text-[var(--text)]">
                  <div className="font-semibold">{p.name}</div>
                  {p.companyName && <div className="text-[var(--muted)] text-xs">{p.companyName}</div>}
                </td>
                <td className="px-6 py-3 text-sm text-[var(--text)]">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClasses(p.type)}`}
                  >
                    {p.type || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-[var(--text)]">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusPillClasses(p.relationshipStatus || '')}`}>
                    {p.relationshipStatus || '—'}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-[var(--text)]">{formatReach(p.reach)}</td>
                <td className="px-6 py-3 text-sm text-[var(--text)]">{p.tier || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
