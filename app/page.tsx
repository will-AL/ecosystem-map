'use client';

import { useState, useEffect, useRef } from 'react';
import ClientSelector from '@/components/dashboard/ClientSelector';
import KPICards from '@/components/dashboard/KPICards';
import FilterPanel from '@/components/dashboard/FilterPanel';
import PartnerTable, { PartnerTableHandle } from '@/components/dashboard/PartnerTable';
import PartnerDrawer from '@/components/dashboard/PartnerDrawer';
import InsightsPanel from '@/components/dashboard/InsightsPanel';
import ViewSelector from '@/components/dashboard/ViewSelector';
import { Partner, DashboardMetrics, PartnerFilters, DashboardView } from '@/lib/types';
import { applyFilters } from '@/lib/utils';
import RunSummary from '@/components/dashboard/RunSummary';
import Link from 'next/link';

export default function DashboardPage() {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<PartnerFilters>({});
  const [showInsights, setShowInsights] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedPartnerNotionUrl, setSelectedPartnerNotionUrl] = useState<string>('');
  const [runSummary, setRunSummary] = useState<any>(null);
  const [runTrace, setRunTrace] = useState<any>(null);
  const DEFAULT_VIEW: DashboardView = { id: 'all-partners', name: 'All Partners', filters: {} };
  const [views, setViews] = useState<DashboardView[]>([DEFAULT_VIEW]);
  const [activeViewId, setActiveViewId] = useState<string>('all-partners');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<PartnerTableHandle>(null);

  useEffect(() => {
    if (selectedClient) {
      fetchPartners();
      fetchRunSummary();
    }
  }, [selectedClient]);

  // Load saved views
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('partnerDashboardViews');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setViews(parsed);
          setActiveViewId(parsed[0].id);
          setFilters(parsed[0].filters || {});
        }
      } catch (e) {
        console.error('Failed to parse saved views', e);
      }
    }
  }, []);

  // Persist views
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('partnerDashboardViews', JSON.stringify(views));
  }, [views]);

  // Global key handling: Esc closes drawer and returns focus to table row
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPartner) {
        e.preventDefault();
        setSelectedPartner(null);
        setSelectedPartnerNotionUrl('');
        requestAnimationFrame(() => tableRef.current?.focusActiveRow());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPartner]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/partners?client=${encodeURIComponent(selectedClient)}`);
      const data = await response.json();
      
      if (response.ok) {
        setAllPartners(data.partners);
        setMetrics(data.metrics);
      } else {
        console.error('Error fetching partners:', data.error);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerClick = async (partner: Partner) => {
    setSelectedPartner(partner);
    
    // Fetch full partner details
    try {
      const response = await fetch(`/api/partners/${partner.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedPartner(data.partner);
        setSelectedPartnerNotionUrl(data.partner.notionUrl);
      }
    } catch (error) {
      console.error('Error fetching partner details:', error);
    }
  };

  const filteredPartners = applyFilters(allPartners, filters);

  const fetchRunSummary = async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`/api/firecrawl/jobs?client=${encodeURIComponent(selectedClient)}`);
      const data = await res.json();
      if (res.ok && data.job) {
        const trace = data.job.trace || [];
        const summary = extractSummary(trace);
        setRunSummary(summary);
        setRunTrace(trace);
      } else {
        setRunSummary(null);
        setRunTrace(null);
      }
    } catch {
      setRunSummary(null);
      setRunTrace(null);
    }
  };

  const extractSummary = (trace: any[]) => {
    if (!Array.isArray(trace)) return null;
    const extractInfo = trace.find((t) => t.step === 'extract_summary')?.info || {};
    const mapInfo = trace.find((t) => t.step === 'map')?.info || {};
    return {
      terminationReason: extractInfo.terminationReason,
      finalPartnerCount: extractInfo.finalPartnerCount,
      shortlistedCount: (mapInfo.shortlistedDirectoryUrls || []).length,
      extractedCount: (extractInfo.extractedUrls || []).length,
      dedupeDroppedCount: extractInfo.dedupeDroppedCount,
      agenticRan: extractInfo.agenticRan,
    };
  };

  const updateActiveView = (updates: Partial<DashboardView>) => {
    setViews((prev) =>
      prev.map((v) => (v.id === activeViewId ? { ...v, ...updates, filters: filters } : v))
    );
  };

  const handleViewChange = (viewId: string) => {
    setActiveViewId(viewId);
    const target = views.find((v) => v.id === viewId);
    if (target?.filters) setFilters(target.filters);
  };

  const handleSaveAsNew = (name: string) => {
    const newView: DashboardView = {
      id: `${name.toLowerCase().replace(/\\s+/g, '-')}-${Date.now()}`,
      name,
      filters,
    };
    setViews((prev) => [...prev, newView]);
    setActiveViewId(newView.id);
  };

  const handleDeleteView = (viewId: string) => {
    setViews((prev) => {
      const remaining = prev.filter((v) => v.id !== viewId);
      if (!remaining.length) return [DEFAULT_VIEW];
      if (activeViewId === viewId) {
        setActiveViewId(remaining[0].id);
        setFilters(remaining[0].filters || {});
      }
      return remaining;
    });
  };

  const handleRenameView = (viewId: string, newName: string) => {
    setViews((prev) => prev.map((v) => (v.id === viewId ? { ...v, name: newName } : v)));
  };

  const handleDuplicateView = (viewId: string) => {
    const src = views.find((v) => v.id === viewId);
    if (!src) return;
    const dup: DashboardView = {
      ...src,
      id: `${src.id}-copy-${Date.now()}`,
      name: `${src.name} Copy`,
    };
    setViews((prev) => [...prev, dup]);
  };

  return (
    <div className="dashboardShell" data-theme="light">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--muted)] mb-2">
              Partner Intelligence
            </p>
            <h1 className="text-4xl font-bold text-[var(--text)] tracking-tight">Intelligence Briefing</h1>
            <p className="text-[var(--muted)] mt-2 font-medium">Global ecosystem mapping & partner performance</p>
          </div>
          <div className="flex items-center gap-3">
            <ViewSelector
              views={views}
              activeViewId={activeViewId}
              onViewChange={handleViewChange}
              onSaveView={updateActiveView}
              onSaveAsNew={handleSaveAsNew}
              onDeleteView={handleDeleteView}
              onRenameView={handleRenameView}
              onDuplicateView={handleDuplicateView}
            />
            <Link
              href={selectedClient ? `/briefing?client=${encodeURIComponent(selectedClient)}` : '#'}
              target={selectedClient ? '_blank' : undefined}
              aria-disabled={!selectedClient}
              className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                selectedClient
                  ? 'bg-[var(--surface)] text-[var(--accent)] border-[var(--accent)] hover:bg-[var(--accentSoft)]'
                  : 'bg-[var(--surface2)] text-[var(--muted)] border-[var(--border)] cursor-not-allowed'
              }`}
            >
              Client View
            </Link>
            <Link
              href="/discovery"
              className="px-5 py-2.5 bg-[var(--accent)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--accent2)] transition-all shadow-lg shadow-[var(--accentSoft)]"
            >
              Discover Partners
            </Link>
          </div>
        </div>

        <div className="mb-10">
          <ClientSelector
            selectedClient={selectedClient}
            onClientChange={setSelectedClient}
          />
        </div>

        {selectedClient && (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-4">
              <KPICards metrics={metrics} loading={loading} />
              {!loading && allPartners.length > 0 && (
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    showInsights
                      ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accentSoft)]'
                      : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]'
                  }`}
                >
                  {showInsights ? 'Hide Insights' : 'Show Insights'}
                </button>
              )}
            </div>

            {showInsights && <InsightsPanel partners={filteredPartners} />}

            <RunSummary summary={runSummary} trace={runTrace} />

            {!loading && allPartners.length > 0 && (
              <>
                <FilterPanel
                  partners={allPartners}
                  filters={filters}
                  onFiltersChange={setFilters}
                  searchInputRef={searchInputRef}
                />

                <div className="mb-4 text-sm text-[var(--muted)]">
                  Showing {filteredPartners.length} of {allPartners.length} partners
                </div>

                <PartnerTable
                  partners={filteredPartners}
                  onPartnerClick={handlePartnerClick}
                  searchInputRef={searchInputRef}
                  ref={tableRef}
                />
              </>
            )}

            {!loading && allPartners.length === 0 && (
              <div className="bg-[var(--surface)] p-8 rounded-lg shadow text-center text-[var(--muted)] border border-[var(--border)]">
                No partners found for this client. Add partners in Notion to get started.
              </div>
            )}
          </div>
        )}

        {!selectedClient && (
          <div className="bg-[var(--surface)] p-12 rounded-lg shadow text-center border border-[var(--border)]">
            <p className="text-[var(--muted)] text-lg">Select a client to view their partner dashboard</p>
          </div>
        )}

        <PartnerDrawer
          partner={selectedPartner}
          notionUrl={selectedPartnerNotionUrl}
          onClose={() => {
            setSelectedPartner(null);
            setSelectedPartnerNotionUrl('');
          }}
        />
      </div>
    </div>
  );
}
