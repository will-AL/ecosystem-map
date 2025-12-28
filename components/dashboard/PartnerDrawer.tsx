'use client';

import { Partner } from '@/lib/types';
import { formatNumber } from '@/lib/utils';
import { X, ExternalLink } from 'lucide-react';

interface PartnerDrawerProps {
  partner: Partner | null;
  notionUrl?: string;
  onClose: () => void;
}

export default function PartnerDrawer({ partner, notionUrl, onClose }: PartnerDrawerProps) {
  if (!partner) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{partner.name}</h2>
              {partner.companyName && (
                <p className="text-gray-600">{partner.companyName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Type</div>
              <div className="text-lg font-semibold">{partner.type || 'N/A'}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Reach</div>
              <div className="text-lg font-semibold">{formatNumber(partner.reach)}</div>
            </div>
          </div>

          {/* Contact Information */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Contact</h3>
            <div className="space-y-2">
              {partner.email && (
                <div>
                  <span className="text-sm text-gray-600">Email: </span>
                  <a href={`mailto:${partner.email}`} className="text-blue-600 hover:underline">
                    {partner.email}
                  </a>
                </div>
              )}
              {partner.website && (
                <div>
                  <span className="text-sm text-gray-600">Website: </span>
                  <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {partner.website}
                  </a>
                </div>
              )}
              {partner.linkedin && (
                <div>
                  <span className="text-sm text-gray-600">LinkedIn: </span>
                  <a href={partner.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Profile
                  </a>
                </div>
              )}
              {partner.moreLinks && (
                <div>
                  <span className="text-sm text-gray-600">More Links: </span>
                  <a href={partner.moreLinks} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Relationship */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Relationship</h3>
            <div className="space-y-2">
              {partner.relationshipStatus && (
                <div>
                  <span className="text-sm text-gray-600">Status: </span>
                  <span className="font-medium">{partner.relationshipStatus}</span>
                </div>
              )}
              {partner.progressStage && (
                <div>
                  <span className="text-sm text-gray-600">Progress: </span>
                  <span className="font-medium">{partner.progressStage}</span>
                </div>
              )}
              {partner.tier && (
                <div>
                  <span className="text-sm text-gray-600">Tier: </span>
                  <span className="font-medium">{partner.tier}</span>
                </div>
              )}
              {partner.relationshipDetail && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Details:</span>
                  <p className="text-sm whitespace-pre-wrap">{partner.relationshipDetail}</p>
                </div>
              )}
            </div>
          </section>

          {/* Classification */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Classification</h3>
            <div className="space-y-2">
              {partner.persona && (
                <div>
                  <span className="text-sm text-gray-600">Persona: </span>
                  <span className="font-medium">{partner.persona}</span>
                </div>
              )}
              {partner.category && (
                <div>
                  <span className="text-sm text-gray-600">Category: </span>
                  <span className="font-medium">{partner.category}</span>
                </div>
              )}
              {partner.distroMediums.length > 0 && (
                <div>
                  <span className="text-sm text-gray-600 block mb-1">Distribution:</span>
                  <div className="flex flex-wrap gap-2">
                    {partner.distroMediums.map((medium) => (
                      <span key={medium} className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {medium}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Campaigns */}
          {partner.campaigns.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Campaigns</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {partner.campaigns.map((campaign) => (
                  <span key={campaign} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {campaign}
                  </span>
                ))}
              </div>
              {partner.campaignDetail && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{partner.campaignDetail}</p>
              )}
            </section>
          )}

          {/* Action Items */}
          {partner.actionItems && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Action Items</h3>
              <p className="text-sm whitespace-pre-wrap bg-yellow-50 p-3 rounded">{partner.actionItems}</p>
            </section>
          )}

          {/* Rate */}
          {partner.rate && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Rate</h3>
              <p className="text-sm">{partner.rate}</p>
            </section>
          )}

          {/* Open in Notion */}
          {notionUrl && (
            <div className="mt-8 pt-6 border-t">
              
                href={notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
              >
                Open in Notion
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
