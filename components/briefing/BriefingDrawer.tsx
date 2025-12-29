'use client';

import { Partner } from '@/lib/types';
import { formatReach } from '@/lib/utils';
import { ExternalLink, X } from 'lucide-react';
import { getTagColors } from '@/lib/presentation';
import { getTagBadgeClasses } from '@/lib/presentation';

interface BriefingDrawerProps {
  partner: Partner | null;
  notionUrl?: string;
  onClose: () => void;
}

export default function BriefingDrawer({ partner, notionUrl, onClose }: BriefingDrawerProps) {
  if (!partner) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--surface)] shadow-2xl h-screen flex flex-col animate-in slide-in-from-right duration-300 border-l border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)] flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)] mb-1">Partner Briefing</p>
            <h2 className="text-xl font-bold text-[var(--text)]">{partner.name}</h2>
            {partner.companyName && <p className="text-[var(--muted)] text-sm">{partner.companyName}</p>}
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-grow overflow-y-auto">
          <section>
            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[var(--muted)] text-xs uppercase">Reach</div>
                <div className="text-lg font-semibold text-[var(--text)]">{formatReach(partner.reach)}</div>
              </div>
              <div>
                <div className="text-[var(--muted)] text-xs uppercase">Status</div>
                <div className="text-lg font-semibold text-[var(--text)]">{partner.relationshipStatus || '—'}</div>
              </div>
              <div>
                <div className="text-[var(--muted)] text-xs uppercase">Type</div>
                <div className="text-lg font-semibold text-[var(--text)]">{partner.type || '—'}</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Context</h3>
            <div className="space-y-2 text-sm text-[var(--text)]">
              <div><span className="text-[var(--muted)]">Persona:</span> {partner.persona || '—'}</div>
              <div><span className="text-[var(--muted)]">Category:</span> {partner.category || '—'}</div>
              <div><span className="text-[var(--muted)]">Progress:</span> {partner.progressStage || '—'}</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[var(--muted)]">Properties:</span>
                {(partner.mediaProperties && partner.mediaProperties.length > 0) || partner.distroMediums.length > 0 ? (
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
            </div>
            {partner.relationshipDetail && (
              <p className="mt-3 text-sm text-[var(--text)] whitespace-pre-wrap">{partner.relationshipDetail}</p>
            )}
          </section>

          <section>
            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Notes</h3>
            <div className="text-sm text-[var(--muted)]">Internal notes not shared in client view.</div>
          </section>
        </div>

        <div className="p-6 border-t border-[var(--border)] flex flex-col gap-3">
          {notionUrl && (
            <a
              href={notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--surface2)]"
            >
              Open in Notion
              <ExternalLink size={16} />
            </a>
          )}
          <button onClick={onClose} className="w-full py-3 bg-[var(--accent)] text-white rounded-xl font-semibold hover:bg-[var(--accent2)]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
