import { Partner, PartnerFilters } from './types';

// Apply filters to partners
export function applyFilters(partners: Partner[], filters: PartnerFilters): Partner[] {
  let filtered = partners;

  // Search
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.companyName?.toLowerCase().includes(search)
    );
  }

  // Partner Type
  if (filters.partnerType && filters.partnerType.length > 0) {
    filtered = filtered.filter(p => p.type && filters.partnerType!.includes(p.type));
  }

  // Relationship Status
  if (filters.relationshipStatus && filters.relationshipStatus.length > 0) {
    filtered = filtered.filter(p =>
      p.relationshipStatus && filters.relationshipStatus!.includes(p.relationshipStatus)
    );
  }

  // Progress Stage
  if (filters.progressStage && filters.progressStage.length > 0) {
    filtered = filtered.filter(p =>
      p.progressStage && filters.progressStage!.includes(p.progressStage)
    );
  }

  // Persona
  if (filters.persona && filters.persona.length > 0) {
    filtered = filtered.filter(p => p.persona && filters.persona!.includes(p.persona));
  }

  // Category
  if (filters.category && filters.category.length > 0) {
    filtered = filtered.filter(p => p.category && filters.category!.includes(p.category));
  }

  // Tier
  if (filters.tier && filters.tier.length > 0) {
    filtered = filtered.filter(p => p.tier && filters.tier!.includes(p.tier));
  }

  // Distro Mediums
  if (filters.distroMediums && filters.distroMediums.length > 0) {
    filtered = filtered.filter(p =>
      p.distroMediums.some(dm => filters.distroMediums!.includes(dm))
    );
  }

  // Media Properties (falls back to distroMediums)
  if (filters.mediaProperties && filters.mediaProperties.length > 0) {
    filtered = filtered.filter(p => {
      const props = p.mediaProperties && p.mediaProperties.length > 0 ? p.mediaProperties : p.distroMediums;
      return props.some((prop) => filters.mediaProperties!.includes(prop));
    });
  }

  // Min Reach
  if (filters.minReach) {
    filtered = filtered.filter(p => p.reach >= filters.minReach!);
  }

  // Boolean filters
  if (filters.hasEmail) {
    filtered = filtered.filter(p => p.hasEmail);
  }

  if (filters.hasRate) {
    filtered = filtered.filter(p => p.hasRate);
  }

  if (filters.hasLinks) {
    filtered = filtered.filter(p => p.hasLinks);
  }

  return filtered;
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Format reach (abbreviate large numbers)
export function formatReach(reach: number): string {
  if (reach >= 1000000) {
    return `${(reach / 1000000).toFixed(1)}M`;
  }
  if (reach >= 1000) {
    return `${(reach / 1000).toFixed(1)}K`;
  }
  return reach.toString();
}

// Get unique values from partners for filter options
export function getUniqueValues(partners: Partner[], key: keyof Partner): string[] {
  const values = new Set<string>();
  partners.forEach(p => {
    const value = p[key];
    if (typeof value === 'string' && value) {
      values.add(value);
    } else if (Array.isArray(value)) {
      value.forEach(v => values.add(v));
    }
  });
  return Array.from(values).sort();
}
