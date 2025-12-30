import { Client } from '@notionhq/client';
import { NotionPartner, Partner, DashboardMetrics } from './types';
import { NOTION_PROPERTIES } from './config';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

// Aliases for tolerant mapping (add common variants here)
const ALIASES = {
  PARTNER_NAME: [NOTION_PROPERTIES.PARTNER_NAME, 'Name', 'Partner', 'Title'],
  COMPANY_NAME: [NOTION_PROPERTIES.COMPANY_NAME, 'Company', 'Organization'],
  PARTNER_TYPE: [NOTION_PROPERTIES.PARTNER_TYPE, 'Type', 'Partner type'],
  CLIENT: [NOTION_PROPERTIES.CLIENT, 'Clients'],
  WEBSITE: [NOTION_PROPERTIES.WEBSITE, 'Site', 'URL'],
  LINKEDIN: [NOTION_PROPERTIES.LINKEDIN, 'LinkedIn URL', 'LI'],
  EMAIL: [NOTION_PROPERTIES.EMAIL, 'Contact', 'Email Address'],
  MORE_LINKS: [NOTION_PROPERTIES.MORE_LINKS, 'Links', 'More'],
  LINKEDIN_FOLLOWERS: [NOTION_PROPERTIES.LINKEDIN_FOLLOWERS, 'LinkedIn Followers', 'Followers'],
  EMAIL_SUBSCRIBERS: [NOTION_PROPERTIES.EMAIL_SUBSCRIBERS, 'Email Subscribers', 'Subscribers'],
  REACH_NORMALIZED: [NOTION_PROPERTIES.REACH_NORMALIZED, 'Reach', 'Reach Normalized', 'Reach (Normalized)'],
  RELATIONSHIP_STATUS: [NOTION_PROPERTIES.RELATIONSHIP_STATUS, 'Status', 'status', 'Relationship status'],
  RELATIONSHIP_DETAIL: [NOTION_PROPERTIES.RELATIONSHIP_DETAIL, 'Relationship Detail', 'Notes'],
  PROGRESS_STAGE: [NOTION_PROPERTIES.PROGRESS_STAGE, 'Progress', 'Stage'],
  TIER: [NOTION_PROPERTIES.TIER, 'Priority', 'Tiering'],
  CAMPAIGNS: [NOTION_PROPERTIES.CAMPAIGNS, 'Campaigns'],
  CAMPAIGN_DETAIL: [NOTION_PROPERTIES.CAMPAIGN_DETAIL, 'Campaign Detail', 'Campaign Notes'],
  PERSONA: [NOTION_PROPERTIES.PERSONA, 'Persona'],
  CATEGORY: [NOTION_PROPERTIES.CATEGORY, 'Category', 'Vertical'],
  DISTRO_MEDIUMS: [NOTION_PROPERTIES.DISTRO_MEDIUMS, 'Distro', 'Channels'],
  ACTION_ITEMS: [NOTION_PROPERTIES.ACTION_ITEMS, 'Action Items', 'Actions', 'Next Steps'],
  RATE: [NOTION_PROPERTIES.RATE, 'Rate', 'Pricing'],
  SOURCE: [NOTION_PROPERTIES.SOURCE, 'Source'],
  SUB_TYPE: ['Sub Type', 'Subtype', 'SubType', 'Sub-Type'],
  MEDIA_PROPERTIES: ['Properties', 'Media Properties', 'Channels'],
} as const;

const firstProp = (props: any, candidates: readonly string[]) =>
  candidates.map((name) => props?.[name]).find((v) => v !== undefined);

const getPlainText = (richText?: Array<{ plain_text: string }>): string =>
  richText?.map((t) => t.plain_text).join('') || '';

const getTitleText = (title?: Array<{ plain_text: string }>): string =>
  title?.map((t) => t.plain_text).join('') || '';

const getNumberProp = (props: any, names: readonly string[]): number | undefined => {
  for (const name of names) {
    const val = props?.[name]?.number;
    if (typeof val === 'number') return val;
  }
  return undefined;
};

const getSelectName = (props: any, names: readonly string[]) => {
  const prop = firstProp(props, names);
  return prop?.select?.name;
};

// Normalize relationship status values coming from Notion (tolerant to casing/whitespace)
const normalizeStatus = (status?: string) => {
  if (!status) return status;
  const lower = status.trim().toLowerCase();
  if (lower === 'done' || lower === 'engaged' || lower === 'active') return 'Active';
  if (lower === 'in progress' || lower === 'prospect' || lower === 'working') return 'Prospect';
  if (lower === 'not started' || lower === 'todo' || lower === 'backlog') return undefined; // hide
  if (lower === 'disqualified' || lower === 'dormant') return 'Disqualified';
  return status;
};

const getSelectOrFirstMultiName = (props: any, names: readonly string[]) => {
  const prop = firstProp(props, names);
  return prop?.select?.name || prop?.multi_select?.[0]?.name;
};

const normalizeType = (type?: string) => {
  if (!type) return type;
  const lower = type.toLowerCase();
  if (lower === 'people' || lower === 'person') return 'Person';
  if (lower === 'brand') return 'Brand';
  if (lower === 'place') return 'Place';
  return type;
};

const getMultiNames = (props: any, names: readonly string[]) => {
  const prop = firstProp(props, names);
  return prop?.multi_select?.map((s: any) => s.name) || [];
};

const getUrl = (props: any, names: readonly string[]) => {
  const prop = firstProp(props, names);
  return prop?.url;
};

const getEmail = (props: any, names: readonly string[]) => {
  const prop = firstProp(props, names);
  return prop?.email;
};

const getRichText = (props: any, names: readonly string[]) => {
  const prop = firstProp(props, names);
  return getPlainText(prop?.rich_text);
};

// Generic serializer for any Notion property into displayable value
function serializeProperty(prop: any): string | number | boolean | null {
  if (!prop) return null;
  if (Array.isArray(prop.title)) return getTitleText(prop.title);
  if (Array.isArray(prop.rich_text)) return getPlainText(prop.rich_text);
  if (prop.select?.name) return prop.select.name;
  if (Array.isArray(prop.multi_select)) return prop.multi_select.map((s: any) => s.name).join(', ');
  if (typeof prop.number === 'number') return prop.number;
  if (typeof prop.checkbox === 'boolean') return prop.checkbox;
  if (prop.url) return prop.url;
  if (prop.email) return prop.email;
  if (prop.date?.start) return prop.date.start;
  return null;
}

// Transform Notion page to Partner
export function transformNotionPartner(page: any): Partner {
  const props = page.properties;
  const extraFields: Record<string, string | number | boolean | null> = {};

  // Capture all properties as displayable values
  Object.entries(props).forEach(([key, value]) => {
    extraFields[key] = serializeProperty(value);
  });

  const linkedinFollowers = getNumberProp(props, ALIASES.LINKEDIN_FOLLOWERS) || 0;
  const emailSubscribers = getNumberProp(props, ALIASES.EMAIL_SUBSCRIBERS) || 0;
  const reachNormalized = getNumberProp(props, ALIASES.REACH_NORMALIZED);
  
  const reach = reachNormalized ?? (linkedinFollowers + emailSubscribers);

  const email = getEmail(props, ALIASES.EMAIL);
  const rate = getRichText(props, ALIASES.RATE);
  const website = getUrl(props, ALIASES.WEBSITE);
  const moreLinks = getUrl(props, ALIASES.MORE_LINKS);
  const subTypes = getMultiNames(props, ALIASES.SUB_TYPE);
  const subType = getSelectOrFirstMultiName(props, ALIASES.SUB_TYPE);
  const mediaProperties = getMultiNames(props, ALIASES.MEDIA_PROPERTIES);
  // Relationship status: try select/multi-select, then fall back to captured extra field strings
  const rawStatus =
    getSelectOrFirstMultiName(props, ALIASES.RELATIONSHIP_STATUS) ||
    ALIASES.RELATIONSHIP_STATUS.map((name) => extraFields[name])
      .find((val) => typeof val === 'string') as string | undefined;
  const normalizedStatus = normalizeStatus(rawStatus);

  return {
    id: page.id,
    name: getTitleText(firstProp(props, ALIASES.PARTNER_NAME)?.title),
    companyName: getPlainText(firstProp(props, ALIASES.COMPANY_NAME)?.rich_text),
    type: normalizeType(getSelectOrFirstMultiName(props, ALIASES.PARTNER_TYPE)) as any,
    clients: getMultiNames(props, ALIASES.CLIENT),
    website,
    linkedin: getUrl(props, ALIASES.LINKEDIN),
    email,
    moreLinks,
    reach,
    relationshipStatus: normalizedStatus,
    relationshipDetail: getRichText(props, ALIASES.RELATIONSHIP_DETAIL),
    progressStage: getSelectName(props, ALIASES.PROGRESS_STAGE),
    tier: getSelectName(props, ALIASES.TIER),
    category: getSelectName(props, ALIASES.CATEGORY),
    persona: getSelectName(props, ALIASES.PERSONA),
    distroMediums: getMultiNames(props, ALIASES.DISTRO_MEDIUMS),
    mediaProperties: mediaProperties.length ? mediaProperties : undefined,
    subTypes: subTypes.length ? subTypes : subType ? [subType] : undefined,
    subType: subType || (subTypes.length ? subTypes[0] : undefined),
    campaigns: getMultiNames(props, ALIASES.CAMPAIGNS),
    campaignDetail: getRichText(props, ALIASES.CAMPAIGN_DETAIL),
    actionItems: getRichText(props, ALIASES.ACTION_ITEMS),
    rate,
    hasEmail: !!email,
    hasRate: !!rate,
    hasLinks: !!(website || moreLinks),
    source: getSelectName(props, ALIASES.SOURCE),
    extraFields,
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
    // Engaged = status explicitly Active
    engagedPartners: partners.filter((p) => p.relationshipStatus === 'Active').length,
    totalReach: partners
      .filter((p) => p.relationshipStatus === 'Active')
      .reduce((sum, p) => sum + p.reach, 0),
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

// List unique client names from Notion
export async function getClientList(): Promise<string[]> {
  const clients = new Set<string>();
  let cursor: string | undefined;

  do {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
    });

    response.results.forEach((page: any) => {
      const clientProps = page.properties[NOTION_PROPERTIES.CLIENT]?.multi_select || [];
      clientProps.forEach((c: any) => {
        if (c?.name) clients.add(c.name);
      });
    });

    cursor = response.has_more ? response.next_cursor || undefined : undefined;
  } while (cursor);

  return Array.from(clients).sort();
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
