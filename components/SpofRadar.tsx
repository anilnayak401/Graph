'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle, Cpu, Factory } from 'lucide-react';
import { CypherQueryInspector } from './CypherQueryInspector';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorAlert } from './ErrorAlert';
import { EmptyState } from './EmptyState';

export function SpofRadar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spofData, setSpofData] = useState<any[]>([]);
  const [queryInfo, setQueryInfo] = useState<any>(null);

  const fetchSpofs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/risk-analysis/spof');
      const data = await res.json();

      if (data.success) {
        setSpofData(data.spofComponents || []);
        setQueryInfo(data.queryInfo);
      } else {
        setError(data.error || 'Failed to execute SPOF detection query.');
      }
    } catch (e) {
      setError('Network error running SPOF Cypher detection query.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpofs();
  }, []);

  return (
    <div className="space-y-4">
      {/* Control Panel Header */}
      <div className="p-4 rounded-md bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Single Point of Failure (SPOF) Risk Matrix
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Identifies single-sourced components and high-risk supplier concentrations
          </p>
        </div>
        <button
          onClick={fetchSpofs}
          disabled={loading}
          className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          Run Scan
        </button>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <LoadingSkeleton cards={2} />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchSpofs} />
      ) : spofData.length === 0 ? (
        <EmptyState title="Zero Bottlenecks" description="All components are multi-sourced." />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Identified Risk Bottlenecks ({spofData.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400">
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Component Node</th>
                    <th className="py-2.5 px-3">Primary Supplier</th>
                    <th className="py-2.5 px-3">Supplier Region</th>
                    <th className="py-2.5 px-3">Supplier Risk</th>
                    <th className="py-2.5 px-3 text-right">Affected Products</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {spofData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-3">
                        {item.isSingleSourced ? (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-red-950/80 border border-red-900/80 text-red-300">
                            SPOF Bottleneck
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-950/80 border border-amber-900/80 text-amber-300">
                            High Risk Supplier
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-sans font-medium text-zinc-200">{item.component.name}</div>
                        <div className="text-zinc-500 text-[10px]">{item.component.sku}</div>
                      </td>
                      <td className="py-3 px-3 font-sans text-zinc-300">
                        {item.primarySupplier?.name}
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-sans">
                        {item.supplierRegion?.name || 'Global'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-red-400">
                          {item.primarySupplier?.riskScore}/100
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-300">
                        {item.affectedProductCount} products
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <CypherQueryInspector queryInfo={queryInfo} />
        </div>
      )}
    </div>
  );
}
