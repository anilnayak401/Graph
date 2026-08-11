'use client';

import React, { useState } from 'react';
import { Network } from 'lucide-react';

interface VisualNode {
  id: string;
  name: string;
  type: 'Product' | 'Component' | 'Supplier' | 'Region';
  x: number;
  y: number;
  color: string;
  detail: string;
}

interface VisualLink {
  source: string;
  target: string;
  label: string;
}

export function SupplyChainGraphVisualizer({
  regions,
  products,
}: {
  regions: any[];
  products: any[];
}) {
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedNode, setSelectedNode] = useState<VisualNode | null>(null);

  const nodes: VisualNode[] = [
    // Products
    { id: 'prod_phone', name: 'Quantum Smartphone', type: 'Product', x: 120, y: 70, color: '#3b82f6', detail: '$1,299 | High Priority' },
    { id: 'prod_ev', name: 'Aegis EV Sedan', type: 'Product', x: 380, y: 70, color: '#3b82f6', detail: '$68,000 | Critical Priority' },
    { id: 'prod_laptop', name: 'Apex Studio Laptop', type: 'Product', x: 640, y: 70, color: '#3b82f6', detail: '$2,899 | High Priority' },

    // Components (Tier 1)
    { id: 'comp_soc_3nm', name: '3nm SoC Chip', type: 'Component', x: 100, y: 200, color: '#6366f1', detail: 'Semiconductor | Lead Time: 120d' },
    { id: 'comp_ram_16gb', name: '16GB LPDDR5 RAM', type: 'Component', x: 260, y: 200, color: '#6366f1', detail: 'Memory | Lead Time: 45d' },
    { id: 'comp_li_battery', name: 'Lithium Battery Pack', type: 'Component', x: 420, y: 200, color: '#6366f1', detail: 'Energy | Lead Time: 75d' },
    { id: 'comp_mcu_auto', name: 'Auto MCU Chip', type: 'Component', x: 580, y: 200, color: '#6366f1', detail: 'Automotive | Lead Time: 90d' },
    { id: 'comp_5g_modem', name: '5G Modem', type: 'Component', x: 740, y: 200, color: '#6366f1', detail: 'Telecom | Lead Time: 60d' },

    // Sub-components (Tier 2)
    { id: 'comp_wafer_3nm', name: '3nm Silicon Wafer', type: 'Component', x: 100, y: 320, color: '#818cf8', detail: 'Sub-assembly | Lead Time: 90d' },
    { id: 'comp_li_cell', name: 'NMC Lithium Cell', type: 'Component', x: 420, y: 320, color: '#818cf8', detail: 'Sub-assembly | Lead Time: 60d' },

    // Suppliers
    { id: 'sup_tsmc', name: 'TSMC Foundry', type: 'Supplier', x: 100, y: 440, color: '#14b8a6', detail: 'Risk Score: 88/100 (HIGH)' },
    { id: 'sup_samsung_mem', name: 'Samsung Memory', type: 'Supplier', x: 260, y: 440, color: '#14b8a6', detail: 'Risk Score: 64/100 (MED)' },
    { id: 'sup_lg_chem', name: 'LG Energy Solution', type: 'Supplier', x: 420, y: 440, color: '#14b8a6', detail: 'Risk Score: 72/100 (HIGH)' },
    { id: 'sup_infineon', name: 'Infineon Power', type: 'Supplier', x: 580, y: 440, color: '#14b8a6', detail: 'Risk Score: 30/100 (LOW)' },
    { id: 'sup_intel', name: 'Intel Foundry', type: 'Supplier', x: 740, y: 440, color: '#14b8a6', detail: 'Risk Score: 18/100 (LOW)' },

    // Regions
    { id: 'reg_east_asia', name: 'East Asia', type: 'Region', x: 220, y: 550, color: '#10b981', detail: 'Risk Tier: HIGH' },
    { id: 'reg_west_europe', name: 'Western Europe', type: 'Region', x: 580, y: 550, color: '#10b981', detail: 'Risk Tier: LOW' },
    { id: 'reg_north_america', name: 'North America', type: 'Region', x: 740, y: 550, color: '#10b981', detail: 'Risk Tier: LOW' },
  ];

  const links: VisualLink[] = [
    { source: 'prod_phone', target: 'comp_soc_3nm', label: 'REQUIRES' },
    { source: 'prod_phone', target: 'comp_ram_16gb', label: 'REQUIRES' },
    { source: 'prod_phone', target: 'comp_li_battery', label: 'REQUIRES' },
    { source: 'prod_ev', target: 'comp_li_battery', label: 'REQUIRES' },
    { source: 'prod_ev', target: 'comp_mcu_auto', label: 'REQUIRES' },
    { source: 'prod_laptop', target: 'comp_soc_3nm', label: 'REQUIRES' },
    { source: 'prod_laptop', target: 'comp_ram_16gb', label: 'REQUIRES' },
    { source: 'comp_soc_3nm', target: 'comp_wafer_3nm', label: 'DEPENDS_ON' },
    { source: 'comp_li_battery', target: 'comp_li_cell', label: 'DEPENDS_ON' },
    { source: 'comp_soc_3nm', target: 'sup_tsmc', label: 'SUPPLIED_BY' },
    { source: 'comp_wafer_3nm', target: 'sup_tsmc', label: 'SUPPLIED_BY' },
    { source: 'comp_ram_16gb', target: 'sup_samsung_mem', label: 'SUPPLIED_BY' },
    { source: 'comp_li_battery', target: 'sup_lg_chem', label: 'SUPPLIED_BY' },
    { source: 'comp_li_cell', target: 'sup_lg_chem', label: 'SUPPLIED_BY' },
    { source: 'comp_mcu_auto', target: 'sup_infineon', label: 'SUPPLIED_BY' },
    { source: 'comp_5g_modem', target: 'sup_intel', label: 'SUPPLIED_BY' },
    { source: 'sup_tsmc', target: 'reg_east_asia', label: 'LOCATED_IN' },
    { source: 'sup_samsung_mem', target: 'reg_east_asia', label: 'LOCATED_IN' },
    { source: 'sup_lg_chem', target: 'reg_east_asia', label: 'LOCATED_IN' },
    { source: 'sup_infineon', target: 'reg_west_europe', label: 'LOCATED_IN' },
    { source: 'sup_intel', target: 'reg_north_america', label: 'LOCATED_IN' },
  ];

  const filteredNodes = filter === 'ALL' ? nodes : nodes.filter((n) => n.type === filter);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="p-4 rounded-md bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-zinc-300" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Technical Graph Blueprint Visualizer
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            CAD-style network canvas mapping nodes and Cypher relationship edges
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5">
          {['ALL', 'Product', 'Component', 'Supplier', 'Region'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                filter === t
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-100'
                  : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Engineering CAD SVG Canvas */}
      <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800 relative">
        <svg viewBox="0 0 850 610" className="w-full h-auto bg-zinc-950 rounded border border-zinc-900 font-mono">
          {/* Subtle Technical Grid Background */}
          <defs>
            <pattern id="cadGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#18181b" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cadGrid)" />

          {/* Links */}
          {links.map((link, idx) => {
            const sourceNode = nodes.find((n) => n.id === link.source);
            const targetNode = nodes.find((n) => n.id === link.target);

            if (!sourceNode || !targetNode) return null;

            const isHighlighted =
              selectedNode &&
              (selectedNode.id === sourceNode.id || selectedNode.id === targetNode.id);

            return (
              <g key={idx}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isHighlighted ? '#6366f1' : '#27272a'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray={link.label === 'DEPENDS_ON' ? '3 3' : 'none'}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {filteredNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(isSelected ? null : node)}
                className="cursor-pointer"
              >
                {/* Node Box */}
                <rect
                  x="-45"
                  y="-14"
                  width="90"
                  height="28"
                  rx="4"
                  fill="#121215"
                  stroke={isSelected ? '#6366f1' : '#27272a'}
                  strokeWidth={isSelected ? '2' : '1'}
                />
                <text
                  y="4"
                  textAnchor="middle"
                  fill="#f4f4f5"
                  fontSize="9"
                  fontWeight="600"
                >
                  {node.name.length > 14 ? `${node.name.substring(0, 12)}..` : node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Node Technical Drawer */}
        {selectedNode && (
          <div className="mt-3 p-3 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="font-semibold text-zinc-200">{selectedNode.name}</span>
              <span className="text-zinc-500 ml-2">(:{selectedNode.type})</span>
              <p className="text-zinc-400 mt-0.5 text-[11px] font-sans">{selectedNode.detail}</p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-zinc-500 hover:text-zinc-300 text-[11px] px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
