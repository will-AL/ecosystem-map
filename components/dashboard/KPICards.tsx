'use client';

import { DashboardMetrics } from '@/lib/types';
import { formatNumber, formatReach } from '@/lib/utils';

interface KPICardsProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

export default function KPICards({ metrics, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Total Partners</h3>
        <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.totalPartners)}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Engaged Partners</h3>
        <p className="text-3xl font-bold text-blue-600">{formatNumber(metrics.engagedPartners)}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Total Reach</h3>
        <p className="text-3xl font-bold text-green-600">{formatReach(metrics.totalReach)}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500 mb-2">By Type</h3>
        <div className="text-sm text-gray-700">
          <div>People: {metrics.byType.Person}</div>
          <div>Brands: {metrics.byType.Brand}</div>
          <div>Places: {metrics.byType.Place}</div>
        </div>
      </div>
    </div>
  );
}
