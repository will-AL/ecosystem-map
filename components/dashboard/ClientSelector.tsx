'use client';

import { useEffect, useState } from 'react';

interface ClientSelectorProps {
  selectedClient: string;
  onClientChange: (client: string) => void;
}

export default function ClientSelector({ selectedClient, onClientChange }: ClientSelectorProps) {
  const fallbackClients = ['Demo Client'];
  const [clients, setClients] = useState<string[]>(fallbackClients);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch('/api/clients');
        const data = await res.json();
        if (res.ok && Array.isArray(data.clients)) {
          setClients(data.clients);
        }
      } catch (error) {
        console.error('Failed to load clients, falling back to defaults:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  return (
    <div className="mb-6">
      <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select Client
      </label>
      <select
        id="client-select"
        value={selectedClient}
        onChange={(e) => onClientChange(e.target.value)}
        className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        disabled={loading}
      >
        <option value="">{loading ? 'Loading clients...' : 'Choose a client...'}</option>
        {clients.map((client) => (
          <option key={client} value={client}>
            {client}
          </option>
        ))}
      </select>
    </div>
  );
}
