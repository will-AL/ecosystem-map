'use client';

import { useMemo, useState } from 'react';
import { Partner } from '@/lib/types';
import { formatReach } from '@/lib/utils';
import { Copy, ExternalLink, Link2, Mail, Globe, Briefcase, X, Calendar, AlertCircle } from 'lucide-react';
import { getTagBadgeClasses, getTagColors } from '@/lib/presentation';

interface PartnerDrawerProps {
  partner: Partner | null;
  notionUrl?: string;
  onClose: () => void;
}

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // no-op fallback
  }
};

export default function PartnerDrawer({ partner, notionUrl, onClose }: PartnerDrawerProps) {
  if (!partner) return null;
  const [notes, setNotes] = useState('');

  const activationDate = useMemo(() => {
    const entries: { label: string; value: string }[] = [];
    Object.entries(partner.extraFields || {}).forEach(([key, value]) => {
      if (!value) return;
      const lowered = key.toLowerCase();
      if (lowered.includes('date') || lowered.includes('activated') || lowered.includes('created')) {
        entries.push({ label: key, value: String(value) });
      }
    });
    return entries[0]?.value;
  }, [partner.extraFields]);

  const impactItems = [
    { label: 'Reach', value: partner.reach ? formatReach(partner.reach) : null },
    { label: 'Status', value: partner.relationshipStatus || null },
  ];

  const contacts = [
    partner.email ? { label: 'Email', value: partner.email, icon: <Mail size={14} /> } : null,
    partner.website ? { label: 'Website', value: partner.website, icon: <Globe size={14} /> } : null,
    partner.linkedin ? { label: 'LinkedIn', value: partner.linkedin, icon: <Briefcase size={14} /> } : null,
    partner.moreLinks ? { label: 'Link', value: partner.moreLinks, icon: <Link2 size={14} /> } : null,
  ].filter(Boolean) as { label: string; value: string; icon: JSX.Element }[];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--surface)] shadow-2xl h-screen flex flex-col animate-in slide-in-from-right duration-300 border-l border-[var(--border)]">
        <div className="p-8 border-b border-[var(--border)] flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-[var(--muted)] mb-1">Partner Dossier</p>
            <h2 className="text-xl font-bold text-[var(--text)]">{partner.name}</h2>
            {partner.companyName && <p className="text-[var(--muted)] text-sm">{partner.companyName}</p>}
          </div>
          <button onClick={onClose} className="text-[var(--muted)] hover:text-[var(--text)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 flex-grow overflow-y-auto">
          {/* Impact */}
          <section>
            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Impact</h3>
            <div className="grid grid-cols-2 gap-4">
              {impactItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-[var(--border)] bg-[var(--surface2)] p-3">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{item.label}</div>
                  <div className="text-lg font-semibold text-[var(--text)]">
                    {item.value || <span className="inline-flex items-center gap-1 text-[var(--muted)] text-xs"><AlertCircle size={12} /> Missing</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Contact & Links */}
          <section>
            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Links & Contacts</h3>
            {contacts.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No contact info available</div>
            ) : (
              <div className="space-y-3">
                {contacts.map((c) => (
                  <div key={c.label} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3 bg-[var(--surface)]">
                    <div className="flex items-center gap-2 text-sm text-[var(--text)]">
                      {c.icon}
                      <span className="font-medium">{c.label}</span>
                      <a href={c.value.startsWith('http') ? c.value : undefined} className="text-[var(--accent)] hover:underline" target="_blank" rel="noreferrer">
                        {c.value}
                      </a>
                      {!c.value.startsWith('http') && <span>{c.value}</span>}
                    </div>
                    <button
                      onClick={() => copyToClipboard(c.value)}
                      className="p-2 rounded-md text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accentSoft)]"
                      aria-label={`Copy ${c.label}`}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Activation Date */}
          <section>
            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Activation Date</h3>
            {activationDate ? (
              <div className="flex items-center gap-2 text-sm text-[var(--text)]">
                <Calendar size={14} className="text-[var(--muted)]" />
                <span className="text-[var(--muted)]">{activationDate}</span>
              </div>
            ) : (
              <div className="text-sm text-[var(--muted)]">No activation date available</div>
            )}
          </section>

          {/* Context */}
          <section>
            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Context</h3>
            <div className="grid grid-cols-2 gap-6 text-sm text-[var(--text)]">
              <div>
                <div className="text-[var(--muted)]">Type</div>
                <div className="font-medium">
                  {partner.type ? (
                    (() => {
                      const { bg, text } = getTagColors(partner.type);
                      return (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: bg, color: text }}
                        >
                          {partner.type}
                        </span>
                      );
                    })()
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div>
                <div className="text-[var(--muted)]">Sub Type</div>
                <div className="font-medium">
                  <div className="flex flex-wrap gap-2">
                    {(partner.subTypes && partner.subTypes.length > 0) || partner.subType ? (
                      (partner.subTypes && partner.subTypes.length > 0 ? partner.subTypes : [partner.subType!]).map((sub) => {
                        const t = partner.type?.toLowerCase();
                        const color =
                          t === 'person'
                            ? { bg: '#ede9fe', text: '#7c3aed' }
                            : t === 'brand'
                            ? { bg: '#fce7f3', text: '#db2777' }
                            : t === 'place'
                            ? { bg: '#fef3c7', text: '#c2410c' }
                            : getTagColors(sub);
                        const { bg, text } = color;
                        return (
                          <span
                            key={sub}
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: bg, color: text }}
                          >
                            {sub}
                          </span>
                        );
                      })
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[var(--muted)]">Status</div>
                <div className="font-medium">{partner.relationshipStatus || '—'}</div>
              </div>
              <div>
                <div className="text-[var(--muted)]">Properties</div>
                <div className="flex flex-wrap gap-2">
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
                    <span className="text-[var(--muted)] text-sm">—</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Notes */}
          <section className="flex flex-col flex-grow">
            <h3 className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-widest mb-3">Local Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full flex-grow p-4 bg-[var(--surface2)] rounded-xl resize-none text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accentSoft)]"
              placeholder="Add local notes (not saved)..."
            />
          </section>
        </div>

        <div className="p-8 border-t border-[var(--border)] flex flex-col gap-3">
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
            Close Briefing
          </button>
        </div>
      </div>
    </div>
  );
}
