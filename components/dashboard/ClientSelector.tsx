'use client';

import { CLIENTS } from '@/lib/config';

interface ClientSelectorProps {
  selectedClient: string;
  onClientChange: (client: string) => void;
}

export default function ClientSelector({ selectedClient, onClientChange }: ClientSelectorProps) {
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
      >
        <option value="">Choose a client...</option>
        {CLIENTS.map((client) => (
          <option key={client} value={client}>
            {client}
          </option>
        ))}
      </select>
    </div>
  );
}
