// Shared presentation helpers to keep internal and client views consistent.

export const getTypeBadgeClasses = (type?: string) => {
  switch (type) {
    case 'Brand':
      return 'bg-[#fce7f3] text-[#db2777]';
    case 'Place':
      return 'bg-[#fef3c7] text-[#c2410c]';
    case 'Person':
      return 'bg-[#ede9fe] text-[#7c3aed]';
    default:
      return 'bg-[var(--accentSoft)] text-[var(--accent)]';
  }
};

export const getStatusPillClasses = (status?: string) => {
  switch (status) {
    case 'Prospect':
      return 'bg-[var(--accentSoft2)] text-[var(--info)] border-[var(--accentSoft2)]';
    case 'Engaged':
      return 'bg-[var(--accentSoft)] text-[var(--accent)] border-[var(--accentSoft)]';
    case 'Active':
      return 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20';
    case 'Disqualified':
      return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20';
    default:
      return 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--border)]';
  }
};

const fallbackPalette = [
  { bg: '#e0f2fe', text: '#075985' }, // blue
  { bg: '#fef3c7', text: '#92400e' }, // amber
  { bg: '#ede9fe', text: '#5b21b6' }, // purple
  { bg: '#ffe4e6', text: '#9f1239' }, // rose
  { bg: '#ecfccb', text: '#3f6212' }, // lime
  { bg: '#e0e7ff', text: '#4338ca' }, // indigo
];

const hashLabel = (label: string) =>
  label.split('').reduce((acc, ch) => (acc + ch.charCodeAt(0)) % fallbackPalette.length, 0);

export const getTagColors = (label?: string) => {
  switch (label) {
    case 'Brand':
      return { bg: '#fce7f3', text: '#db2777' };
    case 'Place':
      return { bg: '#fef3c7', text: '#c2410c' };
    case 'Person':
      return { bg: '#ede9fe', text: '#7c3aed' };
    // Subtype variants tied to Person (purple family)
    case 'Creator':
      return { bg: '#f3e8ff', text: '#6b21a8' };
    case 'Influencer':
      return { bg: '#ede9fe', text: '#5b21b6' };
    case 'Consultant':
      return { bg: '#e9d5ff', text: '#7c3aed' };
    case 'Coach':
      return { bg: '#f5e1ff', text: '#6d28d9' };
    // Subtype variants tied to Brand (pink/red family)
    case 'Publisher':
      return { bg: '#ffe4e6', text: '#be123c' };
    case 'Media':
      return { bg: '#ffe5f0', text: '#c026d3' };
    // Subtype variants tied to Place (orange/yellow family)
    case 'Venue':
      return { bg: '#fef3c7', text: '#9a3412' };
    // Media properties/platforms
    case 'LinkedIn':
      return { bg: '#e0f2fe', text: '#0a66c2' };
    case 'X':
    case 'Twitter':
      return { bg: '#0f172a', text: '#ffffff' };
    case 'YouTube':
      return { bg: '#fee2e2', text: '#b91c1c' };
    case 'Newsletter':
      return { bg: '#f3e8ff', text: '#6b21a8' };
    case 'Podcast':
      return { bg: '#ecfeff', text: '#0f766e' };
    case 'Events':
      return { bg: '#fef3c7', text: '#92400e' };
    default:
      if (!label) return { bg: 'var(--surface2)', text: 'var(--muted)' };
      const idx = hashLabel(label);
      const { bg, text } = fallbackPalette[idx];
      return { bg, text };
  }
};

export const getTagBadgeClasses = (label?: string) => {
  const { bg, text } = getTagColors(label);
  return `bg-[${bg}] text-[${text}]`;
};
