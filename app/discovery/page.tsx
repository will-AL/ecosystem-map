'use client';

import { useState, useEffect } from 'react';
import { CLIENTS } from '@/lib/config';
import { FirecrawlDiscovery } from '@/lib/types';
import Link from 'next/link';

export default function DiscoveryPage() {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [seedUrls, setSeedUrls] = useState<string>('');
  const [competitorDomains, setCompetitorDomains] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [crawling, setCrawling] = useState(false);
  const [discoveries, setDiscoveries] = useState<FirecrawlDiscovery[]>([]);
  const [selectedDiscoveries, setSelectedDiscoveries] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedClient) {
      fetchDiscoveries();
    }
  }, [selectedClient]);

  const fetchDiscoveries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/firecrawl/discoveries?client=${encodeURIComponent(selectedClient)}`);
      const data = await response.json();
      
      if (response.ok) {
        setDiscoveries(data.discoveries);
      }
    } catch (error) {
      console.error('Error fetching discoveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !seedUrls.trim()) {
      alert('Please select a client and provide at least one seed URL');
      return;
    }

    setCrawling(true);
    try {
      const response = await fetch('/api/firecrawl/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: selectedClient,
          seedUrls: seedUrls.split('\n').map(u => u.trim()).filter(Boolean),
          competitorDomains: competitorDomains.split('\n').map(d => d.trim()).filter(Boolean),
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Crawl started! Job ID: ${data.jobId}`);
        // In production, you'd poll for results or use webhooks
        setTimeout(fetchDiscoveries, 5000); // Refresh after 5 seconds
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error starting crawl:', error);
      alert('Failed to start crawl');
    } finally {
      setCrawling(false);
    }
  };

  const toggleDiscovery = (id: string) => {
    const newSelected = new Set(selectedDiscoveries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDiscoveries(newSelected);
  };

  const handleApprove = async () => {
    if (selectedDiscoveries.size === 0) {
      alert('Please select at least one discovery to approve');
      return;
    }

    const confirmed = confirm(`Approve ${selectedDiscoveries.size} discoveries and add them to Notion?`);
    if (!confirmed) return;

    try {
      const response = await fetch('/api/firecrawl/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discoveryIds: Array.from(selectedDiscoveries),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Successfully created ${data.created.length} partners in Notion!`);
        setSelectedDiscoveries(new Set());
        fetchDiscoveries();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error approving discoveries:', error);
      alert('Failed to approve discoveries');
    }
  };

  const pendingDiscoveries = discoveries.filter(d => d.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Discovery</h1>
            <p className="text-gray-600 mt-2">Use Firecrawl to discover new partners</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Client Selector */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Client
          </label>
          <select
            id="client-select"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a client...</option>
            {CLIENTS.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </div>

        {selectedClient && (
          <>
            {/* Crawl Form */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold mb-4">Start New Crawl</h2>
              <form onSubmit={handleCrawl}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seed URLs (one per line) *
                  </label>
                  <textarea
                    value={seedUrls}
                    onChange={(e) => setSeedUrls(e.target.value)}
                    rows={4}
                    placeholder="https://example.com&#10;https://another-example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competitor Domains (one per line)
                  </label>
                  <textarea
                    value={competitorDomains}
                    onChange={(e) => setCompetitorDomains(e.target.value)}
                    rows={3}
                    placeholder="competitor1.com&#10;competitor2.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="marketing, SaaS, influencer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={crawling}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {crawling ? 'Crawling...' : 'Start Crawl'}
                </button>
              </form>
            </div>

            {/* Discoveries */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Pending Discoveries ({pendingDiscoveries.length})
                </h2>
                {selectedDiscoveries.size > 0 && (
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Approve Selected ({selectedDiscoveries.size})
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : pendingDiscoveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending discoveries. Start a crawl to discover new partners.
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDiscoveries.map((discovery) => (
                    <div
                      key={discovery.id}
                      className="border border-gray-200 rounded p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDiscoveries.has(discovery.id)}
                          onChange={() => toggleDiscovery(discovery.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{discovery.partner_name}</h3>
                          {discovery.website && (
                            
                              href={discovery.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {discovery.website}
                            </a>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            {discovery.partner_type && (
                              <span>Type: {discovery.partner_type}</span>
                            )}
                            {discovery.category && (
                              <span>Category: {discovery.category}</span>
                            )}
                            {discovery.inferred_reach && (
                              <span>Reach: ~{discovery.inferred_reach.toLocaleString()}</span>
                            )}
                          </div>
                          {discovery.notes && (
                            <p className="mt-2 text-sm text-gray-700">{discovery.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!selectedClient && (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500 text-lg">Select a client to start discovering partners</p>
          </div>
        )}
      </div>
    </div>
  );
}
