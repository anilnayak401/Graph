'use client';

import React, { useState, useEffect } from 'react';
import { Globe, AlertTriangle, RefreshCw, Factory, Package, DollarSign } from 'lucide-react';
import { CypherQueryInspector } from './CypherQueryInspector';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorAlert } from './ErrorAlert';
import { EmptyState } from './EmptyState';

interface Region {
  id: string;
  name: string;
  code: string;
  riskTier: string;
  country: string;
  vulnerabilityReason?: string;
}

export function RegionOutageSimulator({ regions }: { regions: Region[] }) {
  const [selectedRegionId, setSelectedRegionId] = useState<string>(
    regions[0]?.id || 'reg_east_asia'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outageData, setOutageData] = useState<any>(null);
  const [queryInfo, setQueryInfo] = useState<any>(null);

  const fetchOutageImpact = async (regionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/risk-analysis/region-outage?regionId=${regionId}`);
      const data = await res.json();

      if (data.success) {
        setOutageData(data.data);
        setQueryInfo(data.queryInfo);
      } else {
        setError(data.error || 'Failed to execute outage query.');
      }
    } catch (e) {
      setError('Network error performing multi-hop Cypher traversal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRegionId) {
      fetchOutageImpact(selectedRegionId);
    }
  }, [selectedRegionId]);

  const selectedRegion = regions.find((r) => r.id === selectedRegionId);

  return (
    <div className="space-y-4">
      {/* Selector Control Panel */}
      <div className="p-4 rounded-md bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Regional Outage Blast Radius Simulator
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Multi-Hop Cypher Traversal (<code className="text-zinc-300 font-mono">Region &larr; Supplier &larr; Component &larr; Product</code>)
          </p>
        </div>

        {/* Region Dropdown & Run Button */}
        <div className="flex items-center gap-2">
          <select
            value={selectedRegionId}
            onChange={(e) => setSelectedRegionId(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} [{r.riskTier} RISK]
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchOutageImpact(selectedRegionId)}
            disabled={loading}
            className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
            Simulate
          </button>
        </div>
      </div>

      {/* Main Results Grid */}
      {loading ? (
        <LoadingSkeleton cards={3} />
      ) : error ? (
        <ErrorAlert message={error} onRetry={() => fetchOutageImpact(selectedRegionId)} />
      ) : !outageData ? (
        <EmptyState title="No Data" description="Select a region to simulate blast radius." />
      ) : (
        <div className="space-y-4">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-md bg-zinc-900 border border-zinc-800">
              <div className="flex justify-between items-center text-zinc-400 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold">Impacted Products</span>
                <Package className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {outageData.impactedProductCount}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Finished goods blocked downstream</p>
            </div>

            <div className="p-3.5 rounded-md bg-zinc-900 border border-zinc-800">
              <div className="flex justify-between items-center text-zinc-400 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold">Catalog Revenue at Risk</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                ${outageData.totalRevenueRisk.toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Aggregate catalog unit prices</p>
            </div>

            <div className="p-3.5 rounded-md bg-zinc-900 border border-zinc-800">
              <div className="flex justify-between items-center text-zinc-400 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold">Offline Nodes</span>
                <Factory className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {outageData.suppliers.length} Suppliers / {outageData.components.length} Components
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Directly affected supply nodes</p>
            </div>
          </div>

          {/* Structured Data Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Impacted Products Table */}
            <div className="rounded-md bg-zinc-900 border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Downstream Impacted Products ({outageData.products.length})
                </h3>
              </div>

              {outageData.products.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center font-mono">No downstream products impacted.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400">
                        <th className="py-2 px-2">Product Name</th>
                        <th className="py-2 px-2">SKU</th>
                        <th className="py-2 px-2 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {outageData.products.map((p: any) => (
                        <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-2 px-2 font-sans font-medium text-zinc-200">{p.name}</td>
                          <td className="py-2 px-2 text-zinc-400 text-[11px]">{p.sku}</td>
                          <td className="py-2 px-2 text-right font-bold text-amber-400">
                            ${p.price?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Offline Suppliers Table */}
            <div className="rounded-md bg-zinc-900 border border-zinc-800 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Disabled Suppliers in Region ({outageData.suppliers.length})
                </h3>
              </div>

              {outageData.suppliers.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center font-mono">No suppliers located in region.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400">
                        <th className="py-2 px-2">Supplier Name</th>
                        <th className="py-2 px-2">Code</th>
                        <th className="py-2 px-2 text-right">Risk Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {outageData.suppliers.map((s: any) => (
                        <tr key={s.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-2 px-2 font-sans font-medium text-zinc-200">{s.name}</td>
                          <td className="py-2 px-2 text-zinc-400 text-[11px]">{s.code}</td>
                          <td className="py-2 px-2 text-right font-bold">
                            <span className="px-1.5 py-0.5 rounded text-[11px] bg-red-950/80 border border-red-900/80 text-red-300">
                              {s.riskScore}/100
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <CypherQueryInspector queryInfo={queryInfo} />
        </div>
      )}
    </div>
  );
}
