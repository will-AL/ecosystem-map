import { Partner, FirecrawlDiscovery, DashboardMetrics } from './types';

const basePartners: Partner[] = [
  {
    id: 'demo-1',
    name: 'Demo Creator',
    companyName: 'Demo Co',
    type: 'Person',
    clients: ['Demo Client'],
    website: 'https://example.com',
    linkedin: 'https://www.linkedin.com/in/demo',
    email: 'demo@example.com',
    moreLinks: 'https://linktr.ee/demo',
    reach: 120000,
    relationshipStatus: 'Active',
    relationshipDetail: 'Monthly newsletter swaps in place.',
    progressStage: 'In discussion',
    tier: 'A',
    category: 'Marketing',
    persona: 'Creator',
    distroMediums: ['Newsletter', 'LinkedIn'],
    campaigns: ['Q1 Launch'],
    campaignDetail: 'Sponsored segment + webinar co-host',
    actionItems: 'Send revised brief',
    rate: '$2.5k per slot',
    hasEmail: true,
    hasRate: true,
    hasLinks: true,
    source: 'Manual',
    mediaProperties: ['LinkedIn', 'Newsletter'],
    subTypes: ['Creator', 'Influencer'],
    subType: 'Creator',
    extraFields: {},
  },
  {
    id: 'demo-2',
    name: 'Acme Media',
    companyName: 'Acme Media Group',
    type: 'Brand',
    clients: ['Demo Client'],
    website: 'https://acmemedia.example.com',
    linkedin: 'https://www.linkedin.com/company/acme',
    reach: 450000,
    relationshipStatus: 'Prospect',
    relationshipDetail: 'Initial outreach sent.',
    progressStage: 'Contacted',
    tier: 'B',
    category: 'Media',
    persona: 'Publisher',
    distroMediums: ['Podcast', 'YouTube'],
    campaigns: [],
    campaignDetail: '',
    actionItems: 'Awaiting reply',
    rate: '',
    hasEmail: false,
    hasRate: false,
    hasLinks: true,
    source: 'Firecrawl',
    mediaProperties: ['Podcast', 'YouTube'],
    subTypes: ['Publisher'],
    subType: 'Publisher',
    extraFields: {},
  },
  {
    id: 'demo-3',
    name: 'Beta Hub',
    companyName: 'Beta Hub Spaces',
    type: 'Place',
    clients: ['Demo Client'],
    website: 'https://betahub.example.com',
    linkedin: '',
    reach: 80000,
    relationshipStatus: 'Disqualified',
    relationshipDetail: '',
    progressStage: 'Not started',
    tier: 'C',
    category: 'Community',
    persona: 'Venue',
    distroMediums: ['Events'],
    campaigns: ['Community Series'],
    campaignDetail: 'Venue partner for meetup series',
    actionItems: '',
    rate: '',
    hasEmail: false,
    hasRate: false,
    hasLinks: true,
    source: 'Manual',
    mediaProperties: ['Events'],
    subTypes: ['Venue'],
    subType: 'Venue',
    extraFields: {},
  },
];

function computeMetrics(partners: Partner[]): DashboardMetrics {
  return {
    totalPartners: partners.length,
    engagedPartners: partners.filter(p => !!(p.relationshipStatus || p.progressStage)).length,
    totalReach: partners
      .filter(p => p.relationshipStatus === 'Active')
      .reduce((sum, p) => sum + p.reach, 0),
    byType: {
      Person: partners.filter(p => p.type === 'Person').length,
      Brand: partners.filter(p => p.type === 'Brand').length,
      Place: partners.filter(p => p.type === 'Place').length,
    },
  };
}

export function getMockPartnersByClient(clientName: string) {
  const partners = basePartners.filter(p => p.clients.includes(clientName));
  const metrics = computeMetrics(partners);
  return { partners, metrics };
}

export function getMockPartnerById(id: string) {
  return basePartners.find(p => p.id === id) || null;
}

export function getMockClients() {
  const clients = new Set<string>();
  basePartners.forEach(p => p.clients.forEach(c => clients.add(c)));
  return Array.from(clients);
}

export const mockDiscoveries: FirecrawlDiscovery[] = [
  {
    id: 'disc-1',
    client_name: 'Demo Client',
    partner_name: 'Fresh Finds Weekly',
    website: 'https://freshfinds.example.com',
    category: 'Media',
    partner_type: 'Brand',
    notes: 'Newsletter + podcast; tech audience',
    inferred_reach: 150000,
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'disc-2',
    client_name: 'Demo Client',
    partner_name: 'Growth Garden',
    website: 'https://growthgarden.example.com',
    category: 'Community',
    partner_type: 'Place',
    notes: 'Hosts monthly founder meetups',
    inferred_reach: 60000,
    status: 'approved',
    created_at: new Date().toISOString(),
    notion_page_id: 'demo-2',
  },
];
