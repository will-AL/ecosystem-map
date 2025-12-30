'use client';

import { useMemo, useState, RefObject } from 'react';
import { PartnerFilters, Partner } from '@/lib/types';
import { getUniqueValues } from '@/lib/utils';
import { PARTNER_TYPES } from '@/lib/config';

interface FilterPanelProps {
  partners: Partner[];
  filters: PartnerFilters;
  onFiltersChange: (filters: PartnerFilters) => void;
  searchInputRef?: RefObject<HTMLInputElement>;
}

export default function FilterPanel({ partners, filters, onFiltersChange, searchInputRef }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof PartnerFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleMultiSelect = (key: keyof PartnerFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, updated.length > 0 ? updated : undefined);
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const relationshipStatuses = getUniqueValues(partners, 'relationshipStatus');
  const mediaProperties = getUniqueValues(partners, 'mediaProperties');

  const activeChips = useMemo(() => {
    const chips: string[] = [];
    const pushValues = (label: string, vals?: string[]) => {
      vals?.forEach((v) => chips.push(`${label}: ${v}`));
    };
    pushValues('Type', filters.partnerType);
    pushValues('Status', filters.relationshipStatus);
    pushValues('Properties', filters.mediaProperties);
    if (filters.minReach) chips.push(`Reach ≥ ${filters.minReach}`);
    if (filters.hasEmail) chips.push('Has Email');
    if (filters.hasRate) chips.push('Has Rate');
    if (filters.hasLinks) chips.push('Has Links');
    if (filters.search) chips.push(`Search: ${filters.search}`);
    return chips;
  }, [filters]);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-xl shadow-sm mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[var(--text)]">Filters</h2>
          <div className="flex flex-wrap gap-2">
            {activeChips.length === 0 && (
              <span className="text-xs text-[var(--muted)]">No filters applied</span>
            )}
            {activeChips.map((chip) => (
              <span
                key={chip}
                className="px-2 py-1 text-xs font-medium bg-[var(--accentSoft)] text-[var(--text)] rounded-full border border-[var(--border)]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--accent)] rounded-lg"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 text-xs font-semibold border border-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--surface2)] focus:ring-2 focus:ring-[var(--accentSoft)] focus:ring-offset-0"
          >
            {isExpanded ? 'Hide Properties' : 'Show Properties'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search partners..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value || undefined)}
          ref={searchInputRef}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-[var(--accentSoft)] focus:border-[var(--accent)] bg-[var(--surface)] text-[var(--text)]"
        />
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Partner Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Partner Type</label>
            {PARTNER_TYPES.map((type) => (
              <label key={type} className="flex items-center mb-1">
                <input
                  type="checkbox"
                  checked={filters.partnerType?.includes(type) || false}
                  onChange={() => toggleMultiSelect('partnerType', type)}
                  className="mr-2"
                />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>

          {/* Relationship Status */}
          {relationshipStatuses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relationship Status</label>
              <div className="max-h-32 overflow-y-auto">
                {relationshipStatuses.map((status) => (
                  <label key={status} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={filters.relationshipStatus?.includes(status) || false}
                      onChange={() => toggleMultiSelect('relationshipStatus', status)}
                      className="mr-2"
                    />
                    <span className="text-sm">{status}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Media Properties */}
          {mediaProperties.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Properties</label>
              <div className="max-h-32 overflow-y-auto">
                {mediaProperties.map((prop) => (
                  <label key={prop} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={filters.mediaProperties?.includes(prop) || false}
                      onChange={() => toggleMultiSelect('mediaProperties', prop)}
                      className="mr-2"
                    />
                    <span className="text-sm">{prop}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Min Reach */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Reach</label>
            <input
              type="number"
              placeholder="e.g. 10000"
              value={filters.minReach || ''}
              onChange={(e) => updateFilter('minReach', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Boolean filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Filters</label>
            <label className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={filters.hasEmail || false}
                onChange={(e) => updateFilter('hasEmail', e.target.checked || undefined)}
                className="mr-2"
              />
              <span className="text-sm">Has Email</span>
            </label>
            <label className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={filters.hasRate || false}
                onChange={(e) => updateFilter('hasRate', e.target.checked || undefined)}
                className="mr-2"
              />
              <span className="text-sm">Has Rate</span>
            </label>
            <label className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={filters.hasLinks || false}
                onChange={(e) => updateFilter('hasLinks', e.target.checked || undefined)}
                className="mr-2"
              />
              <span className="text-sm">Has Links</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
