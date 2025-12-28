'use client';

import { useEffect, useMemo, useState } from 'react';
import { Partner } from '@/lib/types';
import { formatReach } from '@/lib/utils';

interface PartnerTableProps {
  partners: Partner[];
  onPartnerClick: (partner: Partner) => void;
}

export default function PartnerTable({ partners, onPartnerClick }: PartnerTableProps) {
  const [sortField, setSortField] = useState<keyof Partner>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const baseColumns: Array<{ key: string; label: string; sortable?: keyof Partner }> = [
    { key: 'type', label: 'Type', sortable: 'type' },
    { key: 'reach', label: 'Reach', sortable: 'reach' },
    { key: 'relationshipStatus', label: 'Status', sortable: 'relationshipStatus' },
    { key: 'tier', label: 'Tier', sortable: 'tier' },
    { key: 'contact', label: 'Contact' },
  ];

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
    baseColumns.forEach((c) => (initial[c.key] = true));
    return initial;
  });

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
      <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
        No partners found matching the current filters.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex flex-wrap gap-3 items-center px-4 py-3 border-b border-gray-200 text-sm">
        <span className="font-semibold text-gray-700">Show/Hide Columns:</span>
        {baseColumns.map(({ key, label }) => (
          <label key={key} className="inline-flex items-center gap-1 text-gray-700">
            <input
              type="checkbox"
              checked={columns[key]}
              onChange={() => setColumns({ ...columns, [key]: !columns[key] })}
              className="rounded border-gray-300"
            />
            {label}
          </label>
        ))}
        {extraColumns.map((key) => (
          <label key={key} className="inline-flex items-center gap-1 text-gray-700">
            <input
              type="checkbox"
              checked={!!columns[key]}
              onChange={() => setColumns({ ...columns, [key]: !columns[key] })}
              className="rounded border-gray-300"
            />
            {key}
          </label>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                Partner Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              {baseColumns.map(({ key, label, sortable }) =>
                columns[key] ? (
                  <th
                    key={key}
                    onClick={() => sortable && handleSort(sortable)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  >
                    {label} {sortable && sortField === sortable && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                ) : null
              )}
              {extraColumns.map(
                (key) =>
                  columns[key] && (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {key}
                    </th>
                  )
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedPartners.map((partner) => (
              <tr
                key={partner.id}
                onClick={() => onPartnerClick(partner)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                  {partner.companyName && (
                    <div className="text-sm text-gray-500">{partner.companyName}</div>
                  )}
                </td>
                {columns.type && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {partner.type || 'N/A'}
                    </span>
                  </td>
                )}
                {columns.reach && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatReach(partner.reach)}
                  </td>
                )}
                {columns.relationshipStatus && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {partner.relationshipStatus || '—'}
                  </td>
                )}
                {columns.tier && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {partner.tier || '—'}
                  </td>
                )}
                {columns.contact && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      {partner.hasEmail && <span>📧</span>}
                      {partner.website && <span>🌐</span>}
                      {partner.linkedin && <span>💼</span>}
                    </div>
                  </td>
                )}
                {extraColumns.map(
                  (key) =>
                    columns[key] && (
                      <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
}
