import { Client } from '@notionhq/client';
import { NotionPartner, Partner, DashboardMetrics } from './types';
import { NOTION_PROPERTIES } from './config';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

// Helper: Extract plain text from rich text
function getPlainText(richText?: Array<{ plain_text: string }>): string {
  return richText?.map(t => t.plain_text).join('') || '';
}

// Helper: Extract title text
function getTitleText(title?: Array<{ plain_text: string }>): string {
  return title?.map(t => t.plain_text).join('') || '';
}

// Transform Notion page to Partner
export function transformNotionPartner(page: any): Partner {
  const props = page.properties;

  const linkedinFollowers = props[NOTION_PROPERTIES.LINKEDIN_FOLLOWERS]?.number || 0;
  const emailSubscribers = props[NOTION_PROPERTIES.EMAIL_SUBSCRIBERS]?.number || 0;
  const reachNormalized = props[NOTION_PROPERTIES.REACH_NORMALIZED]?.number;
  
  const reach = reachNormalized ?? (linkedinFollowers + emailSubscribers);

  const email = props[NOTION_PROPERTIES.EMAIL]?.email;
  const rate = getPlainText(props[NOTION_PROPERTIES.RATE]?.rich_text);
  const website = props[NOTION_PROPERTIES.WEBSITE]?.url;
  const moreLinks = props[NOTION_PROPERTIES.MORE_LINKS]?.url;

  return {
    id: page.id,
    name: getTitleText(props[NOTION_PROPERTIES.PARTNER_NAME]?.title),
    companyName: getPlainText(props[NOTION_PROPERTIES.COMPANY_NAME]?.rich_text),
    type: props[NOTION_PROPERTIES.PARTNER_TYPE]?.select?.name as any,
    clients: props[NOTION_PROPERTIES.CLIENT]?.multi_select?.map((s: any) => s.name) || [],
    website,
    linkedin: props[NOTION_PROPERTIES.LINKEDIN]?.url,
    email,
    moreLinks,
    reach,
    relationshipStatus: props[NOTION_PROPERTIES.RELATIONSHIP_STATUS]?.select?.name,
    relationshipDetail: getPlainText(props[NOTION_PROPERTIES.RELATIONSHIP_DETAIL]?.rich_text),
    progressStage: props[NOTION_PROPERTIES.PROGRESS_STAGE]?.select?.name,
    tier: props[NOTION_PROPERTIES.TIER]?.select?.name,
    category: props[NOTION_PROPERTIES.CATEGORY]?.select?.name,
    persona: props[NOTION_PROPERTIES.PERSONA]?.select?.name,
    distroMediums: props[NOTION_PROPERTIES.DISTRO_MEDIUMS]?.multi_select?.map((s: any) => s.name) || [],
    campaigns: props[NOTION_PROPERTIES.CAMPAIGNS]?.multi_select?.map((s: any) => s.name) || [],
    campaignDetail: getPlainText(props[NOTION_PROPERTIES.CAMPAIGN_DETAIL]?.rich_text),
    actionItems: getPlainText(props[NOTION_PROPERTIES.ACTION_ITEMS]?.rich_text),
    rate,
    hasEmail: !!email,
    hasRate: !!rate,
    hasLinks: !!(website || moreLinks),
    source: props[NOTION_PROPERTIES.SOURCE]?.select?.name,
  };
}

// Check if partner is engaged
function isEngaged(partner: Partner): boolean {
  return !!(partner.relationshipStatus || partner.progressStage);
}

// Compute metrics
function computeMetrics(partners: Partner[]): DashboardMetrics {
  return {
    totalPartners: partners.length,
    engagedPartners: partners.filter(isEngaged).length,
    totalReach: partners.reduce((sum, p) => sum + p.reach, 0),
    byType: {
      Person: partners.filter(p => p.type === 'Person').length,
      Brand: partners.filter(p => p.type === 'Brand').length,
      Place: partners.filter(p => p.type === 'Place').length,
    },
  };
}

// Query partners by client
export async function getPartnersByClient(clientName: string) {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: NOTION_PROPERTIES.CLIENT,
      multi_select: {
        contains: clientName,
      },
    },
  });

  const partners = response.results.map(transformNotionPartner);
  const metrics = computeMetrics(partners);

  return { partners, metrics };
}

// Get single partner by ID
export async function getPartnerById(pageId: string) {
  const page = await notion.pages.retrieve({ page_id: pageId });
  return transformNotionPartner(page);
}

// Create new partner in Notion
export async function createPartner(data: {
  partnerName: string;
  clientName: string;
  partnerType?: string;
  website?: string;
  category?: string;
  notes?: string;
  reach?: number;
  source?: string;
}) {
  const properties: any = {
    [NOTION_PROPERTIES.PARTNER_NAME]: {
      title: [{ text: { content: data.partnerName } }],
    },
    [NOTION_PROPERTIES.CLIENT]: {
      multi_select: [{ name: data.clientName }],
    },
  };

  if (data.partnerType) {
    properties[NOTION_PROPERTIES.PARTNER_TYPE] = {
      select: { name: data.partnerType },
    };
  }

  if (data.website) {
    properties[NOTION_PROPERTIES.WEBSITE] = { url: data.website };
  }

  if (data.category) {
    properties[NOTION_PROPERTIES.CATEGORY] = {
      select: { name: data.category },
    };
  }

  if (data.reach) {
    properties[NOTION_PROPERTIES.REACH_NORMALIZED] = { number: data.reach };
  }

  if (data.source) {
    properties[NOTION_PROPERTIES.SOURCE] = {
      select: { name: data.source },
    };
  }

  if (data.notes) {
    properties[NOTION_PROPERTIES.ACTION_ITEMS] = {
      rich_text: [{ text: { content: data.notes } }],
    };
  }

  const response = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties,
  });

  return response.id;
}

// Update partner (Milestone 4 - optional)
export async function updatePartner(pageId: string, updates: {
  relationshipStatus?: string;
  progressStage?: string;
  actionItems?: string;
  relationshipDetail?: string;
  campaignDetail?: string;
  tier?: string;
  category?: string;
}) {
  const properties: any = {};

  if (updates.relationshipStatus !== undefined) {
    properties[NOTION_PROPERTIES.RELATIONSHIP_STATUS] = {
      select: updates.relationshipStatus ? { name: updates.relationshipStatus } : null,
    };
  }

  if (updates.progressStage !== undefined) {
    properties[NOTION_PROPERTIES.PROGRESS_STAGE] = {
      select: updates.progressStage ? { name: updates.progressStage } : null,
    };
  }

  if (updates.tier !== undefined) {
    properties[NOTION_PROPERTIES.TIER] = {
      select: updates.tier ? { name: updates.tier } : null,
    };
  }

  if (updates.category !== undefined) {
    properties[NOTION_PROPERTIES.CATEGORY] = {
      select: updates.category ? { name: updates.category } : null,
    };
  }

  if (updates.actionItems !== undefined) {
    properties[NOTION_PROPERTIES.ACTION_ITEMS] = {
      rich_text: [{ text: { content: updates.actionItems } }],
    };
  }

  if (updates.relationshipDetail !== undefined) {
    properties[NOTION_PROPERTIES.RELATIONSHIP_DETAIL] = {
      rich_text: [{ text: { content: updates.relationshipDetail } }],
    };
  }

  if (updates.campaignDetail !== undefined) {
    properties[NOTION_PROPERTIES.CAMPAIGN_DETAIL] = {
      rich_text: [{ text: { content: updates.campaignDetail } }],
    };
  }

  await notion.pages.update({
    page_id: pageId,
    properties,
  });
}
