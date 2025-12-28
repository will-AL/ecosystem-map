'use client';

import { useState } from 'react';
import { PartnerFilters, Partner } from '@/lib/types';
import { getUniqueValues } from '@/lib/utils';
import { PARTNER_TYPES } from '@/lib/config';

interface FilterPanelProps {
  partners: Partner[];
  filters: PartnerFilters;
  onFiltersChange: (filters: PartnerFilters) => void;
}

export default function FilterPanel({ partners, filters, onFiltersChange }: FilterPanelProps) {
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
  const progressStages = getUniqueValues(partners, 'progressStage');
  const personas = getUniqueValues(partners, 'persona');
  const categories = getUniqueValues(partners, 'category');
  const tiers = getUniqueValues(partners, 'tier');
  const distroMediums = getUniqueValues(partners, 'distroMediums');

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

          {/* Progress Stage */}
          {progressStages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Progress Stage</label>
              <div className="max-h-32 overflow-y-auto">
                {progressStages.map((stage) => (
                  <label key={stage} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={filters.progressStage?.includes(stage) || false}
                      onChange={() => toggleMultiSelect('progressStage', stage)}
                      className="mr-2"
                    />
                    <span className="text-sm">{stage}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Persona */}
          {personas.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Persona</label>
              <div className="max-h-32 overflow-y-auto">
                {personas.map((persona) => (
                  <label key={persona} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={filters.persona?.includes(persona) || false}
                      onChange={() => toggleMultiSelect('persona', persona)}
                      className="mr-2"
                    />
                    <span className="text-sm">{persona}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="max-h-32 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={filters.category?.includes(category) || false}
                      onChange={() => toggleMultiSelect('category', category)}
                      className="mr-2"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Tier */}
          {tiers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
              <div className="max-h-32 overflow-y-auto">
                {tiers.map((tier) => (
                  <label key={tier} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={filters.tier?.includes(tier) || false}
                      onChange={() => toggleMultiSelect('tier', tier)}
                      className="mr-2"
                    />
                    <span className="text-sm">{tier}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Distro Mediums */}
          {distroMediums.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distro Mediums</label>
              <div className="max-h-32 overflow-y-auto">
                {distroMediums.map((medium) => (
                  <label key={medium} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      checked={filters.distroMediums?.includes(medium) || false}
                      onChange={() => toggleMultiSelect('distroMediums', medium)}
                      className="mr-2"
                    />
                    <span className="text-sm">{medium}</span>
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
