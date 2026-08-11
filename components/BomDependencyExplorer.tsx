'use client';

import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw, Cpu, Factory } from 'lucide-react';
import { CypherQueryInspector } from './CypherQueryInspector';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorAlert } from './ErrorAlert';
import { EmptyState } from './EmptyState';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  importance: string;
}

export function BomDependencyExplorer({ products }: { products: Product[] }) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || 'prod_phone'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bomData, setBomData] = useState<any>(null);
  const [queryInfo, setQueryInfo] = useState<any>(null);

  const fetchBomTree = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/risk-analysis/bom-tree?productId=${productId}`);
      const data = await res.json();

      if (data.success) {
        setBomData(data.data);
        setQueryInfo(data.queryInfo);
      } else {
        setError(data.error || 'Failed to fetch BOM tree.');
      }
    } catch (e) {
      setError('Network error running variable-length path Cypher query.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProductId) {
      fetchBomTree(selectedProductId);
    }
  }, [selectedProductId]);

  return (
    <div className="space-y-4">
      {/* Selector Control Panel */}
      <div className="p-4 rounded-md bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Multi-Tier Bill of Materials (BOM) Tree
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Variable-Length Path Query (<code className="text-zinc-300 font-mono">Product &minus;[:REQUIRES|DEPENDS_ON*1..8]&rarr; Component</code>)
          </p>
        </div>

        {/* Product Selector Dropdown & Button */}
        <div className="flex items-center gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (${p.price?.toLocaleString()})
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchBomTree(selectedProductId)}
            disabled={loading}
            className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
            Fetch Tree
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <LoadingSkeleton cards={3} />
      ) : error ? (
        <ErrorAlert message={error} onRetry={() => fetchBomTree(selectedProductId)} />
      ) : !bomData ? (
        <EmptyState title="No BOM Data" description="Select a product to inspect BOM hierarchy." />
      ) : (
        <div className="space-y-4">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-md bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block mb-1">
                Total BOM Nodes
              </span>
              <div className="text-2xl font-bold font-mono text-zinc-100">
                {bomData.totalComponentsCount}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Sub-assembly &amp; component nodes</p>
            </div>

            <div className="p-3.5 rounded-md bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block mb-1">
                Max Graph Traversal Depth
              </span>
              <div className="text-2xl font-bold font-mono text-indigo-400">
                Level {bomData.maxDepthReached}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">Recursive path depth</p>
            </div>

            <div className="p-3.5 rounded-md bg-zinc-900 border border-zinc-800">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 block mb-1">
                Max Supplier Risk Score
              </span>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {bomData.maxSupplierRisk} / 100
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Highest supplier risk along path</p>
            </div>
          </div>

          {/* Indented Structural Tree Table */}
          <div className="rounded-md bg-zinc-900 border border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Bill of Materials Hierarchy ({bomData.product?.name})
              </h3>
              <span className="text-xs font-mono text-zinc-400">
                {bomData.components.length} nodes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-400">
                    <th className="py-2 px-2">Depth Level</th>
                    <th className="py-2 px-2">Component Name &amp; SKU</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Lead Time</th>
                    <th className="py-2 px-2">Primary Supplier</th>
                    <th className="py-2 px-2 text-right">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {bomData.components.map((comp: any) => {
                    const depthIndent = (comp.depth - 1) * 16;
                    const primarySup = comp.suppliers && comp.suppliers[0];

                    return (
                      <tr key={comp.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300">
                            L{comp.depth}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <div style={{ paddingLeft: `${depthIndent}px` }} className="flex items-center gap-1.5">
                            {comp.depth > 1 && <span className="text-zinc-600 font-sans">&rdsh;</span>}
                            <div>
                              <span className="font-sans font-medium text-zinc-200">{comp.name}</span>
                              <span className="text-zinc-500 ml-2 text-[10px]">{comp.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-zinc-400 text-[11px]">{comp.type}</td>
                        <td className="py-2 px-2 text-zinc-400 text-[11px]">{comp.leadTimeDays}d</td>
                        <td className="py-2 px-2">
                          {primarySup ? (
                            <span className="text-zinc-300 font-sans text-xs">
                              {primarySup.name}{' '}
                              <span className="text-zinc-500 font-mono text-[10px]">
                                ({primarySup.region?.name || 'Global'})
                              </span>
                            </span>
                          ) : (
                            <span className="text-zinc-600 italic">Unmapped</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right text-zinc-200 font-mono">
                          ${comp.cost?.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
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
