'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Layers, ShieldAlert, Network } from 'lucide-react';
import { Header } from '@/components/Header';
import { StatsOverview } from '@/components/StatsOverview';
import { RegionOutageSimulator } from '@/components/RegionOutageSimulator';
import { BomDependencyExplorer } from '@/components/BomDependencyExplorer';
import { SpofRadar } from '@/components/SpofRadar';
import { SupplyChainGraphVisualizer } from '@/components/SupplyChainGraphVisualizer';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'outage' | 'bom' | 'spof' | 'graph'>('outage');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<{
    counts: Record<string, number>;
    spofCount: number;
    regions: any[];
    products: any[];
  }>({
    counts: {},
    spofCount: 0,
    regions: [],
    products: [],
  });

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/overview');
      const data = await res.json();

      if (data.success) {
        setOverviewData({
          counts: data.counts || {},
          spofCount: data.spofCount || 0,
          regions: data.regions || [],
          products: data.products || [],
        });
      } else {
        setError(data.error || 'Unable to fetch graph overview data.');
      }
    } catch (e) {
      setError('Network error connecting to CognoDB backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-600 selection:text-white">
      {/* SaaS Top Header Bar */}
      <Header onRefresh={fetchOverview} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* High Density Metric Cards */}
        <StatsOverview
          counts={overviewData.counts}
          spofCount={overviewData.spofCount}
          loading={loading}
        />

        {/* Enterprise Segmented Control / Tab Switcher */}
        <div className="p-1 rounded-md bg-zinc-900 border border-zinc-800 flex items-center gap-1 w-full overflow-x-auto touch-scroll no-scrollbar">
          <button
            onClick={() => setActiveTab('outage')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded text-xs font-medium transition-colors shrink-0 focus:ring-1 focus:ring-indigo-500 focus:outline-none touch-manipulation ${
              activeTab === 'outage'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="sm:hidden">Outage Simulator</span>
            <span className="hidden sm:inline">Region Outage (Multi-Hop)</span>
          </button>

          <button
            onClick={() => setActiveTab('bom')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded text-xs font-medium transition-colors shrink-0 focus:ring-1 focus:ring-indigo-500 focus:outline-none touch-manipulation ${
              activeTab === 'bom'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="sm:hidden">BOM Tree</span>
            <span className="hidden sm:inline">Deep BOM Explorer (Variable-Length)</span>
          </button>

          <button
            onClick={() => setActiveTab('spof')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded text-xs font-medium transition-colors shrink-0 focus:ring-1 focus:ring-indigo-500 focus:outline-none touch-manipulation ${
              activeTab === 'spof'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="sm:hidden">SPOF Matrix</span>
            <span className="hidden sm:inline">SPOF Bottleneck Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded text-xs font-medium transition-colors shrink-0 focus:ring-1 focus:ring-indigo-500 focus:outline-none touch-manipulation ${
              activeTab === 'graph'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="sm:hidden">Graph Canvas</span>
            <span className="hidden sm:inline">Technical Graph Canvas</span>
          </button>
        </div>

        {/* Tab View Panels */}
        {loading ? (
          <LoadingSkeleton cards={3} />
        ) : error ? (
          <ErrorAlert message={error} onRetry={fetchOverview} />
        ) : (
          <div className="pt-1 sm:pt-2">
            {activeTab === 'outage' && (
              <RegionOutageSimulator regions={overviewData.regions} />
            )}
            {activeTab === 'bom' && (
              <BomDependencyExplorer products={overviewData.products} />
            )}
            {activeTab === 'spof' && <SpofRadar />}
            {activeTab === 'graph' && (
              <SupplyChainGraphVisualizer
                regions={overviewData.regions}
                products={overviewData.products}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
