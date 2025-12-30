'use client';

import { useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef, type RefObject } from 'react';
import { Partner } from '@/lib/types';
import { formatReach } from '@/lib/utils';
import { getTypeBadgeClasses, getStatusPillClasses, getTagBadgeClasses, getTagColors } from '@/lib/presentation';

interface PartnerTableProps {
  partners: Partner[];
  onPartnerClick: (partner: Partner) => void;
  searchInputRef?: RefObject<HTMLInputElement>;
}

export interface PartnerTableHandle {
  focusActiveRow: () => void;
}

const PartnerTable = forwardRef<PartnerTableHandle, PartnerTableProps>(function PartnerTable(
  { partners, onPartnerClick, searchInputRef },
  ref
) {
  const [sortField, setSortField] = useState<keyof Partner>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const baseColumns: Array<{ key: string; label: string; sortable?: keyof Partner }> = [
    { key: 'type', label: 'Type', sortable: 'type' },
    { key: 'subType', label: 'Sub Type' },
    { key: 'reach', label: 'Reach', sortable: 'reach' },
    { key: 'relationshipStatus', label: 'Status', sortable: 'relationshipStatus' },
    { key: 'tier', label: 'Tier', sortable: 'tier' },
    { key: 'contact', label: 'Contact' },
    { key: 'properties', label: 'Properties' },
  ];
  const rowRefs = useRef<HTMLTableRowElement[]>([]);

  const extraColumns = useMemo(() => {
    const keys = new Set<string>();
    partners.forEach((p) => {
      Object.keys(p.extraFields || {}).forEach((k) => keys.add(k));
    });
    // omit redundant name properties
    ['Partner Name', 'Name'].forEach((k) => keys.delete(k));
    return Array.from(keys).sort();
  }, [partners]);

  const [columns, setColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    baseColumns.forEach((c) => {
      if (c.key === 'contact' || c.key === 'tier') {
        initial[c.key] = false;
      } else {
        initial[c.key] = true;
      }
    });
    return initial;
  });
  const [columnOrder, setColumnOrder] = useState<string[]>(baseColumns.map((c) => c.key));
  useEffect(() => {
    setActiveIndex((prev) => {
      if (!partners.length) return -1;
      if (prev === -1) return -1;
      return Math.min(prev, partners.length - 1);
    });
  }, [partners.length]);

  useImperativeHandle(ref, () => ({
    focusActiveRow: () => {
      const targetIndex = activeIndex >= 0 ? activeIndex : 0;
      const row = rowRefs.current[targetIndex];
      row?.focus();
    },
  }));

  useEffect(() => {
    setColumns((prev) => {
      const next = { ...prev };
      let changed = false;
      extraColumns.forEach((key) => {
        if (next[key] === undefined) {
          next[key] = false; // default extra columns off
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [extraColumns]);

  const handleSort = (field: keyof Partner) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

const sortedPartners = [...partners].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
    } else {
      return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
    }
  });

  if (partners.length === 0) {
    return (
      <div className="bg-[var(--surface)] p-8 rounded-lg shadow text-center text-[var(--muted)] border border-[var(--border)]">
        No partners found matching the current filters.
      </div>
    );
  }

  const StatusPill = ({ status }: { status: string }) => {
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusPillClasses(status)}`}>
        {status || '—'}
      </span>
    );
  };

  const renderCell = (key: string, partner: Partner) => {
    const subTypeColors = (sub: string) => {
      const t = partner.type?.toLowerCase();
      if (t === 'person') return { bg: '#ede9fe', text: '#7c3aed' };
      if (t === 'brand') return { bg: '#fce7f3', text: '#db2777' };
      if (t === 'place') return { bg: '#fef3c7', text: '#c2410c' };
      return getTagColors(sub);
    };

    switch (key) {
      case 'type':
        return (
          <td className="px-6 py-4 whitespace-nowrap">
            {partner.type ? (
              (() => {
                const { bg, text } = getTagColors(partner.type);
                return (
                  <span
                    className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                    style={{ backgroundColor: bg, color: text }}
                  >
                    {partner.type}
                  </span>
                );
              })()
            ) : (
              <span className="text-[var(--muted)]">N/A</span>
            )}
          </td>
        );
      case 'reach':
        return (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text)]">
            {formatReach(partner.reach)}
          </td>
        );
      case 'relationshipStatus':
        return (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
            {partner.relationshipStatus ? <StatusPill status={partner.relationshipStatus} /> : '—'}
          </td>
        );
      case 'tier':
        return (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
            {partner.tier || '—'}
          </td>
        );
      case 'contact':
        return (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)]">
            <div className="flex gap-2 text-[var(--text)]">
              {partner.hasEmail && <span>📧</span>}
              {partner.website && <span>🌐</span>}
              {partner.linkedin && <span>💼</span>}
            </div>
          </td>
        );
      case 'properties':
        return (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text)]">
            <div className="flex flex-wrap gap-2">
              {((partner.mediaProperties || partner.distroMediums).length > 0) ? (
                (partner.mediaProperties || partner.distroMediums).map((medium) => {
                  const { bg, text } = getTagColors(medium);
                  return (
                    <span
                      key={medium}
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: bg, color: text }}
                    >
                      {medium}
                    </span>
                  );
                })
              ) : (
                <span className="text-[var(--muted)]">—</span>
              )}
            </div>
          </td>
        );
      case 'subType':
        return (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text)]">
            <div className="flex flex-wrap gap-2">
              {(partner.subTypes && partner.subTypes.length > 0) || partner.subType || partner.progressStage ? (
                (partner.subTypes && partner.subTypes.length > 0
                  ? partner.subTypes
                  : partner.subType
                  ? [partner.subType]
                  : partner.progressStage
                  ? [partner.progressStage]
                  : []
                ).map((sub) => {
                  const { bg, text } = subTypeColors(sub);
                  return (
                    <span
                      key={sub}
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: bg, color: text }}
                    >
                      {sub}
                    </span>
                  );
                })
              ) : (
                <span className="text-[var(--muted)]">—</span>
              )}
            </div>
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="bg-[var(--surface)] rounded-lg shadow overflow-hidden border border-[var(--border)] outline-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === '/' && searchInputRef?.current) {
          e.preventDefault();
          searchInputRef.current.focus();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveIndex((i) => {
            const base = i === -1 ? 0 : i + 1;
            const next = Math.min(base, sortedPartners.length - 1);
            requestAnimationFrame(() => rowRefs.current[next]?.focus());
            return next;
          });
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveIndex((i) => {
            const base = i === -1 ? 0 : i - 1;
            const next = Math.max(base, 0);
            requestAnimationFrame(() => rowRefs.current[next]?.focus());
            return next;
          });
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const idx = activeIndex === -1 ? 0 : activeIndex;
          const p = sortedPartners[idx];
          if (p) onPartnerClick(p);
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          rowRefs.current[activeIndex]?.blur();
        }
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] text-sm">
        <div className="font-semibold text-[var(--text)]">Partners</div>
        <button
          onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
          className="px-3 py-1.5 rounded-md text-xs font-semibold border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface2)]"
        >
          {isPropertiesOpen ? 'Hide Properties' : 'Properties'}
        </button>
      </div>
      {isPropertiesOpen && (
        <div className="flex flex-col gap-3 px-4 py-3 border-b border-[var(--border)] text-sm bg-[var(--surface2)]">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="font-semibold text-[var(--text)]">Show/Hide Columns:</span>
            {baseColumns.map(({ key, label }) => (
              <label key={key} className="inline-flex items-center gap-1 text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={columns[key]}
                  onChange={() => setColumns({ ...columns, [key]: !columns[key] })}
                  className="rounded border-[var(--border)] focus:ring-[var(--accentSoft)]"
                />
                {label}
              </label>
            ))}
            {extraColumns.map((key) => (
              <label key={key} className="inline-flex items-center gap-1 text-[var(--text)]">
                <input
                  type="checkbox"
                  checked={!!columns[key]}
                  onChange={() => setColumns({ ...columns, [key]: !columns[key] })}
                  className="rounded border-[var(--border)] focus:ring-[var(--accentSoft)]"
                />
                {key}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center text-xs text-[var(--muted)]">
            <span className="font-semibold text-[var(--text)]">Reorder:</span>
            {columnOrder.map((key, idx) => {
              const meta = baseColumns.find((c) => c.key === key);
              if (!meta) return null;
              return (
                <div key={key} className="flex items-center gap-1 px-2 py-1 bg-[var(--surface)] border border-[var(--border)] rounded">
                  <span className="text-[var(--text)]">{meta.label}</span>
                  <button
                    type="button"
                    disabled={idx === 0}
                    className={`px-1 text-[var(--muted)] ${idx === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-[var(--accent)]'}`}
                    onClick={() => {
                      if (idx === 0) return;
                      const next = [...columnOrder];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      setColumnOrder(next);
                    }}
                    aria-label={`Move ${meta.label} left`}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={idx === columnOrder.length - 1}
                    className={`px-1 text-[var(--muted)] ${idx === columnOrder.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:text-[var(--accent)]'}`}
                    onClick={() => {
                      if (idx === columnOrder.length - 1) return;
                      const next = [...columnOrder];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      setColumnOrder(next);
                    }}
                    aria-label={`Move ${meta.label} right`}
                  >
                    →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)]">
          <thead className="bg-[var(--surface2)]">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider cursor-pointer hover:bg-[var(--accentSoft)]"
              >
                Partner Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              {columnOrder.map((key) => {
                const meta = baseColumns.find((c) => c.key === key);
                if (!meta || !columns[key]) return null;
                return (
                  <th
                    key={key}
                    onClick={() => meta.sortable && handleSort(meta.sortable)}
                    className={`px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider ${meta.sortable ? 'cursor-pointer hover:bg-[var(--accentSoft)]' : ''}`}
                  >
                    {meta.label} {meta.sortable && sortField === meta.sortable && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                );
              })}
              {extraColumns.map(
                (key) =>
                  columns[key] && (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                      {key}
                    </th>
                  )
              )}
            </tr>
          </thead>
          <tbody className="bg-[var(--surface)] divide-y divide-[var(--border)]">
            {sortedPartners.map((partner, index) => (
              <tr
                key={partner.id}
                ref={(el) => {
                  if (el) rowRefs.current[index] = el;
                }}
                tabIndex={-1}
                onClick={() => onPartnerClick(partner)}
                className={`cursor-pointer ${activeIndex === index ? 'bg-[var(--accentSoft)]' : 'hover:bg-[var(--surface2)]'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-[var(--text)]">{partner.name}</div>
                  {partner.companyName && (
                    <div className="text-sm text-[var(--muted)]">{partner.companyName}</div>
                  )}
                </td>
                {columnOrder.map((key) => columns[key] && renderCell(key, partner))}
                {extraColumns.map(
                  (key) =>
                    columns[key] && (
                      <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text)]">
                        {partner.extraFields?.[key] ?? '—'}
                      </td>
                    )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default PartnerTable;
