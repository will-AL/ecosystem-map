'use client';

import { useState } from 'react';

interface RunSummaryProps {
  summary: {
    terminationReason?: string;
    finalPartnerCount?: number;
    shortlistedCount?: number;
    extractedCount?: number;
    dedupeDroppedCount?: number;
    agenticRan?: boolean;
  } | null;
  trace?: any;
}

export default function RunSummary({ summary, trace }: RunSummaryProps) {
  const [showTrace, setShowTrace] = useState(false);

  if (!summary) return null;

  return (
    <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)]">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Run Summary</div>
        <button
          onClick={() => setShowTrace((v) => !v)}
          className="text-[var(--accent)] text-xs font-semibold hover:underline"
        >
          {showTrace ? 'Hide Trace JSON' : 'View Trace JSON'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        <div>Termination: {summary.terminationReason || '—'}</div>
        <div>Final Partners: {summary.finalPartnerCount ?? '—'}</div>
        <div>Shortlisted URLs: {summary.shortlistedCount ?? '—'}</div>
        <div>Extracted URLs: {summary.extractedCount ?? '—'}</div>
        <div>Dedupe Dropped: {summary.dedupeDroppedCount ?? '—'}</div>
        <div>Agentic Ran: {summary.agenticRan ? 'Yes' : 'No'}</div>
      </div>
      {showTrace && (
        <pre className="mt-3 max-h-64 overflow-auto rounded bg-[var(--surface2)] p-2 text-xs text-[var(--text)]">
          {JSON.stringify(trace, null, 2)}
        </pre>
      )}
    </div>
  );
}
