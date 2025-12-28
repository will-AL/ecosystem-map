'use client';

import { useState, useEffect } from 'react';
import ClientSelector from '@/components/dashboard/ClientSelector';
import KPICards from '@/components/dashboard/KPICards';
import FilterPanel from '@/components/dashboard/FilterPanel';
import PartnerTable from '@/components/dashboard/PartnerTable';
import PartnerDrawer from '@/components/dashboard/PartnerDrawer';
import { Partner, DashboardMetrics, PartnerFilters } from '@/lib/types';
import { applyFilters } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<PartnerFilters>({});
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedPartnerNotionUrl, setSelectedPartnerNotionUrl] = useState<string>('');

  useEffect(() => {
    if (selectedClient) {
      fetchPartners();
    }
  }, [selectedClient]);

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
        alert('Failed to load partners');
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      alert('Failed to load partners');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Intelligence Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and track partner relationships</p>
          </div>
          <Link
            href="/discovery"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Partner Discovery
          </Link>
        </div>

        <ClientSelector
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
        />

        {selectedClient && (
          <>
            <KPICards metrics={metrics} loading={loading} />

            {!loading && allPartners.length > 0 && (
              <>
                <FilterPanel
                  partners={allPartners}
                  filters={filters}
                  onFiltersChange={setFilters}
                />

                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredPartners.length} of {allPartners.length} partners
                </div>

                <PartnerTable
                  partners={filteredPartners}
                  onPartnerClick={handlePartnerClick}
                />
              </>
            )}

            {!loading && allPartners.length === 0 && (
              <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                No partners found for this client. Add partners in Notion to get started.
              </div>
            )}
          </>
        )}

        {!selectedClient && (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500 text-lg">Select a client to view their partner dashboard</p>
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
