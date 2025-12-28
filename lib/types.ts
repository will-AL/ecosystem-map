// Notion raw property types
export interface NotionPartner {
  id: string;
  properties: {
    'Partner Name': { title: Array<{ plain_text: string }> };
    'Company Name'?: { rich_text: Array<{ plain_text: string }> };
    'Partner Type'?: { select: { name: string } | null };
    'Client'?: { multi_select: Array<{ name: string }> };
    'Website'?: { url: string | null };
    'LinkedIn'?: { url: string | null };
    'Email'?: { email: string | null };
    'More Links'?: { url: string | null };
    'LinkedIn Followers'?: { number: number | null };
    'Email Subscribers'?: { number: number | null };
    'Reach (Normalized)'?: { number: number | null };
    'Relationship Status'?: { select: { name: string } | null };
    'Relationship Detail'?: { rich_text: Array<{ plain_text: string }> };
    'Progress stage'?: { select: { name: string } | null };
    'Tier'?: { select: { name: string } | null };
    'Campaigns'?: { multi_select: Array<{ name: string }> };
    'Campaign Detail'?: { rich_text: Array<{ plain_text: string }> };
    'Persona'?: { select: { name: string } | null };
    'Category'?: { select: { name: string } | null };
    'Distro Mediums'?: { multi_select: Array<{ name: string }> };
    'Action Items'?: { rich_text: Array<{ plain_text: string }> };
    'Rate'?: { rich_text: Array<{ plain_text: string }> };
    'Source'?: { select: { name: string } | null };
  };
}

// App-level partner model
export interface Partner {
  id: string;
  name: string;
  companyName?: string;
  type?: 'Person' | 'Brand' | 'Place';
  clients: string[];
  website?: string;
  linkedin?: string;
  email?: string;
  moreLinks?: string;
  reach: number;
  relationshipStatus?: string;
  relationshipDetail?: string;
  progressStage?: string;
  tier?: string;
  category?: string;
  persona?: string;
  distroMediums: string[];
  campaigns: string[];
  campaignDetail?: string;
  actionItems?: string;
  rate?: string;
  hasEmail: boolean;
  hasRate: boolean;
  hasLinks: boolean;
  source?: string;
}

export interface DashboardMetrics {
  totalPartners: number;
  engagedPartners: number;
  totalReach: number;
  byType: {
    Person: number;
    Brand: number;
    Place: number;
  };
}

export interface FirecrawlDiscovery {
  id: string;
  client_name: string;
  partner_name: string;
  website?: string;
  category?: string;
  partner_type?: string;
  notes?: string;
  inferred_reach?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  notion_page_id?: string;
}

export interface PartnerFilters {
  partnerType?: string[];
  relationshipStatus?: string[];
  progressStage?: string[];
  persona?: string[];
  category?: string[];
  tier?: string[];
  distroMediums?: string[];
  minReach?: number;
  hasEmail?: boolean;
  hasRate?: boolean;
  hasLinks?: boolean;
  search?: string;
}
