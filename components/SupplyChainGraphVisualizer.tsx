'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Move,
  ShieldAlert,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Zap,
  Info,
  X,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  Activity,
  Crosshair,
  Maximize2,
  Filter,
} from 'lucide-react';

interface VisualNode {
  id: string;
  name: string;
  type: 'Product' | 'Component' | 'Supplier' | 'Region';
  x: number;
  y: number;
  color: string;
  detail: string;
  riskScore?: number;
  riskTier?: 'HIGH' | 'MED' | 'LOW';
  isSpof?: boolean;
  leadTime?: string;
  price?: string;
}

interface VisualLink {
  id: string;
  source: string;
  target: string;
  label: 'REQUIRES' | 'DEPENDS_ON' | 'SUPPLIED_BY' | 'LOCATED_IN';
}

const DEFAULT_NODES: VisualNode[] = [
  // Products (Top Tier)
  { id: 'prod_phone', name: 'Quantum Smartphone', type: 'Product', x: 140, y: 70, color: '#3b82f6', detail: '$1,299 | High Priority', price: '$1,299', riskTier: 'HIGH' },
  { id: 'prod_ev', name: 'Aegis EV Sedan', type: 'Product', x: 425, y: 70, color: '#3b82f6', detail: '$68,000 | Critical Priority', price: '$68,000', riskTier: 'HIGH' },
  { id: 'prod_laptop', name: 'Apex Studio Laptop', type: 'Product', x: 710, y: 70, color: '#3b82f6', detail: '$2,899 | High Priority', price: '$2,899', riskTier: 'MED' },

  // Components (Tier 1)
  { id: 'comp_soc_3nm', name: '3nm SoC Chip', type: 'Component', x: 110, y: 200, color: '#6366f1', detail: 'Semiconductor | Lead Time: 120d', leadTime: '120d', isSpof: true, riskTier: 'HIGH' },
  { id: 'comp_ram_16gb', name: '16GB LPDDR5 RAM', type: 'Component', x: 265, y: 200, color: '#6366f1', detail: 'Memory | Lead Time: 45d', leadTime: '45d', isSpof: true, riskTier: 'MED' },
  { id: 'comp_li_battery', name: 'Lithium Battery Pack', type: 'Component', x: 425, y: 200, color: '#6366f1', detail: 'Energy | Lead Time: 75d', leadTime: '75d', isSpof: true, riskTier: 'HIGH' },
  { id: 'comp_mcu_auto', name: 'Auto MCU Chip', type: 'Component', x: 585, y: 200, color: '#6366f1', detail: 'Automotive | Lead Time: 90d', leadTime: '90d', isSpof: true, riskTier: 'LOW' },
  { id: 'comp_5g_modem', name: '5G Modem', type: 'Component', x: 740, y: 200, color: '#6366f1', detail: 'Telecom | Lead Time: 60d', leadTime: '60d', isSpof: true, riskTier: 'LOW' },

  // Sub-components (Tier 2)
  { id: 'comp_wafer_3nm', name: '3nm Silicon Wafer', type: 'Component', x: 110, y: 330, color: '#818cf8', detail: 'Sub-assembly | Lead Time: 90d', leadTime: '90d', isSpof: true, riskTier: 'HIGH' },
  { id: 'comp_li_cell', name: 'NMC Lithium Cell', type: 'Component', x: 425, y: 330, color: '#818cf8', detail: 'Sub-assembly | Lead Time: 60d', leadTime: '60d', isSpof: true, riskTier: 'HIGH' },

  // Suppliers
  { id: 'sup_tsmc', name: 'TSMC Foundry', type: 'Supplier', x: 110, y: 450, color: '#14b8a6', detail: 'Risk Score: 88/100 (HIGH)', riskScore: 88, riskTier: 'HIGH' },
  { id: 'sup_samsung_mem', name: 'Samsung Memory', type: 'Supplier', x: 265, y: 450, color: '#14b8a6', detail: 'Risk Score: 64/100 (MED)', riskScore: 64, riskTier: 'MED' },
  { id: 'sup_lg_chem', name: 'LG Energy Solution', type: 'Supplier', x: 425, y: 450, color: '#14b8a6', detail: 'Risk Score: 72/100 (HIGH)', riskScore: 72, riskTier: 'HIGH' },
  { id: 'sup_infineon', name: 'Infineon Power', type: 'Supplier', x: 585, y: 450, color: '#14b8a6', detail: 'Risk Score: 30/100 (LOW)', riskScore: 30, riskTier: 'LOW' },
  { id: 'sup_intel', name: 'Intel Foundry', type: 'Supplier', x: 740, y: 450, color: '#14b8a6', detail: 'Risk Score: 18/100 (LOW)', riskScore: 18, riskTier: 'LOW' },

  // Regions
  { id: 'reg_east_asia', name: 'East Asia', type: 'Region', x: 265, y: 550, color: '#10b981', detail: 'Risk Tier: HIGH', riskTier: 'HIGH' },
  { id: 'reg_west_europe', name: 'Western Europe', type: 'Region', x: 585, y: 550, color: '#10b981', detail: 'Risk Tier: LOW', riskTier: 'LOW' },
  { id: 'reg_north_america', name: 'North America', type: 'Region', x: 740, y: 550, color: '#10b981', detail: 'Risk Tier: LOW', riskTier: 'LOW' },
];

const DEFAULT_LINKS: VisualLink[] = [
  { id: 'l1', source: 'prod_phone', target: 'comp_soc_3nm', label: 'REQUIRES' },
  { id: 'l2', source: 'prod_phone', target: 'comp_ram_16gb', label: 'REQUIRES' },
  { id: 'l3', source: 'prod_phone', target: 'comp_li_battery', label: 'REQUIRES' },
  { id: 'l4', source: 'prod_ev', target: 'comp_li_battery', label: 'REQUIRES' },
  { id: 'l5', source: 'prod_ev', target: 'comp_mcu_auto', label: 'REQUIRES' },
  { id: 'l6', source: 'prod_laptop', target: 'comp_soc_3nm', label: 'REQUIRES' },
  { id: 'l7', source: 'prod_laptop', target: 'comp_ram_16gb', label: 'REQUIRES' },
  { id: 'l8', source: 'comp_soc_3nm', target: 'comp_wafer_3nm', label: 'DEPENDS_ON' },
  { id: 'l9', source: 'comp_li_battery', target: 'comp_li_cell', label: 'DEPENDS_ON' },
  { id: 'l10', source: 'comp_soc_3nm', target: 'sup_tsmc', label: 'SUPPLIED_BY' },
  { id: 'l11', source: 'comp_wafer_3nm', target: 'sup_tsmc', label: 'SUPPLIED_BY' },
  { id: 'l12', source: 'comp_ram_16gb', target: 'sup_samsung_mem', label: 'SUPPLIED_BY' },
  { id: 'l13', source: 'comp_li_battery', target: 'sup_lg_chem', label: 'SUPPLIED_BY' },
  { id: 'l14', source: 'comp_li_cell', target: 'sup_lg_chem', label: 'SUPPLIED_BY' },
  { id: 'l15', source: 'comp_mcu_auto', target: 'sup_infineon', label: 'SUPPLIED_BY' },
  { id: 'l16', source: 'comp_5g_modem', target: 'sup_intel', label: 'SUPPLIED_BY' },
  { id: 'l17', source: 'sup_tsmc', target: 'reg_east_asia', label: 'LOCATED_IN' },
  { id: 'l18', source: 'sup_samsung_mem', target: 'reg_east_asia', label: 'LOCATED_IN' },
  { id: 'l19', source: 'sup_lg_chem', target: 'reg_east_asia', label: 'LOCATED_IN' },
  { id: 'l20', source: 'sup_infineon', target: 'reg_west_europe', label: 'LOCATED_IN' },
  { id: 'l21', source: 'sup_intel', target: 'reg_north_america', label: 'LOCATED_IN' },
];

export function SupplyChainGraphVisualizer({
  regions,
  products,
}: {
  regions: any[];
  products: any[];
}) {
  // Canvas State
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [filter, setFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [outageNodeId, setOutageNodeId] = useState<string | null>(null);
  const [spofOnly, setSpofOnly] = useState<boolean>(false);
  const [animateFlow, setAnimateFlow] = useState<boolean>(true);
  const [showEdgeLabels, setShowEdgeLabels] = useState<boolean>(true);
  const [layoutPreset, setLayoutPreset] = useState<'cad' | 'radial' | 'grid'>('cad');
  const [copiedCypher, setCopiedCypher] = useState<boolean>(false);

  // Pan & Zoom State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Positions (Dynamic & Draggable)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    DEFAULT_NODES.forEach((n) => {
      pos[n.id] = { x: n.x, y: n.y };
    });
    return pos;
  });

  // Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isNodePinned, setIsNodePinned] = useState<Record<string, boolean>>({});

  // Reset/Zoom Functions
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Convert Screen Coordinates to SVG Canvas Coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * 850;
    const svgY = ((clientY - rect.top) / rect.height) * 610;
    return {
      x: (svgX - pan.x) / zoom,
      y: (svgY - pan.y) / zoom,
    };
  };

  // Node Dragging Handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const currentPos = nodePositions[nodeId] || { x: 0, y: 0 };
    setDragOffset({
      x: coords.x - currentPos.x,
      y: coords.y - currentPos.y,
    });
  };

  const handleNodeTouchStart = (e: React.TouchEvent, nodeId: string) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      setSelectedNodeId(nodeId);
      setDraggingNodeId(nodeId);
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      const currentPos = nodePositions[nodeId] || { x: 0, y: 0 };
      setDragOffset({
        x: coords.x - currentPos.x,
        y: coords.y - currentPos.y,
      });
    }
  };

  // Canvas Pan Mouse Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const newX = Math.max(40, Math.min(810, coords.x - dragOffset.x));
      const newY = Math.max(30, Math.min(580, coords.y - dragOffset.y));
      setNodePositions((prev) => ({
        ...prev,
        [draggingNodeId]: { x: newX, y: newY },
      }));
      setIsNodePinned((prev) => ({ ...prev, [draggingNodeId]: true }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingNodeId && e.touches.length === 1) {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      const newX = Math.max(40, Math.min(810, coords.x - dragOffset.x));
      const newY = Math.max(30, Math.min(580, coords.y - dragOffset.y));
      setNodePositions((prev) => ({
        ...prev,
        [draggingNodeId]: { x: newX, y: newY },
      }));
      setIsNodePinned((prev) => ({ ...prev, [draggingNodeId]: true }));
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.max(0.5, Math.min(2.5, prev * zoomFactor)));
  };

  // Layout Preset Switcher
  const applyLayoutPreset = (preset: 'cad' | 'radial' | 'grid') => {
    setLayoutPreset(preset);
    const newPos: Record<string, { x: number; y: number }> = {};

    if (preset === 'cad') {
      DEFAULT_NODES.forEach((n) => {
        newPos[n.id] = { x: n.x, y: n.y };
      });
    } else if (preset === 'radial') {
      const cx = 425;
      const cy = 310;
      const radiusMap: Record<string, number> = {
        Product: 110,
        Component: 210,
        Supplier: 310,
        Region: 380,
      };

      const groups: Record<string, VisualNode[]> = {
        Product: [],
        Component: [],
        Supplier: [],
        Region: [],
      };

      DEFAULT_NODES.forEach((n) => groups[n.type].push(n));

      Object.entries(groups).forEach(([type, nodesGroup]) => {
        const radius = radiusMap[type] || 200;
        const total = nodesGroup.length;
        nodesGroup.forEach((n, idx) => {
          const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
          newPos[n.id] = {
            x: Math.round(cx + radius * Math.cos(angle)),
            y: Math.round(cy + radius * Math.sin(angle)),
          };
        });
      });
    } else if (preset === 'grid') {
      const cols = 5;
      const startX = 100;
      const startY = 80;
      const stepX = 160;
      const stepY = 120;

      DEFAULT_NODES.forEach((n, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        newPos[n.id] = {
          x: startX + col * stepX,
          y: startY + row * stepY,
        };
      });
    }

    setNodePositions(newPos);
    setIsNodePinned({});
  };

  // Calculate Outage Cascading Disruption
  const impactedNodeIds = useMemo(() => {
    if (!outageNodeId) return new Set<string>();
    const impacted = new Set<string>([outageNodeId]);
    let changed = true;

    while (changed) {
      changed = false;
      DEFAULT_LINKS.forEach((link) => {
        // Upstream or supplier outage impacts downstream component/product
        if (impacted.has(link.target) && !impacted.has(link.source)) {
          impacted.add(link.source);
          changed = true;
        }
        if (impacted.has(link.source) && !impacted.has(link.target)) {
          impacted.add(link.target);
          changed = true;
        }
      });
    }
    return impacted;
  }, [outageNodeId]);

  // Compute Connected Nodes & Links for Selection/Hover
  const activeFocusId = selectedNodeId || hoveredNodeId;

  const connectedInfo = useMemo(() => {
    if (!activeFocusId) return { nodeIds: new Set<string>(), linkIds: new Set<string>() };

    const nodeIds = new Set<string>([activeFocusId]);
    const linkIds = new Set<string>();

    DEFAULT_LINKS.forEach((link) => {
      if (link.source === activeFocusId) {
        nodeIds.add(link.target);
        linkIds.add(link.id);
      }
      if (link.target === activeFocusId) {
        nodeIds.add(link.source);
        linkIds.add(link.id);
      }
    });

    return { nodeIds, linkIds };
  }, [activeFocusId]);

  // Nodes Filtering
  const filteredNodes = useMemo(() => {
    return DEFAULT_NODES.filter((n) => {
      if (filter !== 'ALL' && n.type !== filter) return false;
      if (riskFilter !== 'ALL' && n.riskTier !== riskFilter) return false;
      if (spofOnly && !n.isSpof) return false;
      if (
        searchQuery.trim() !== '' &&
        !n.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !n.type.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !n.id.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [filter, riskFilter, spofOnly, searchQuery]);

  const selectedNode = useMemo(() => {
    return DEFAULT_NODES.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId]);

  // Cypher Generator for Selected Node
  const selectedCypher = useMemo(() => {
    if (!selectedNode) return '';
    return `MATCH (n:${selectedNode.type} {id: '${selectedNode.id}'})\nOPTIONAL MATCH (n)-[r]-(m)\nRETURN n, r, m;`;
  }, [selectedNode]);

  const handleCopyCypher = () => {
    if (!selectedCypher) return;
    navigator.clipboard.writeText(selectedCypher);
    setCopiedCypher(true);
    setTimeout(() => setCopiedCypher(false), 2000);
  };

  // Upstream & Downstream Lists for Selected Node
  const nodeConnections = useMemo(() => {
    if (!selectedNodeId) return { upstream: [], downstream: [] };
    const upstream: VisualNode[] = [];
    const downstream: VisualNode[] = [];

    DEFAULT_LINKS.forEach((link) => {
      if (link.source === selectedNodeId) {
        const target = DEFAULT_NODES.find((n) => n.id === link.target);
        if (target) downstream.push(target);
      }
      if (link.target === selectedNodeId) {
        const source = DEFAULT_NODES.find((n) => n.id === link.source);
        if (source) upstream.push(source);
      }
    });

    return { upstream, downstream };
  }, [selectedNodeId]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Dynamic Keyframes for Flow Animation */}
      <style>{`
        @keyframes dashFlow {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>

      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Network className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">
                  Technical Graph Blueprint Visualizer
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Interactive CAD
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Drag nodes, pan/zoom canvas, simulate regional outages, and inspect Cypher relationships in real-time.
              </p>
            </div>
          </div>

          {/* Preset Layout Buttons & Quick Toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center p-1 rounded-lg bg-zinc-950 border border-zinc-800">
              <button
                onClick={() => applyLayoutPreset('cad')}
                className={`px-2.5 py-1 text-xs font-mono rounded font-medium transition-all ${
                  layoutPreset === 'cad'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Blueprint
              </button>
              <button
                onClick={() => applyLayoutPreset('radial')}
                className={`px-2.5 py-1 text-xs font-mono rounded font-medium transition-all ${
                  layoutPreset === 'radial'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Radial
              </button>
              <button
                onClick={() => applyLayoutPreset('grid')}
                className={`px-2.5 py-1 text-xs font-mono rounded font-medium transition-all ${
                  layoutPreset === 'grid'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Grid
              </button>
            </div>

            <button
              onClick={() => setAnimateFlow(!animateFlow)}
              title="Toggle animated edge flow particles"
              className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                animateFlow
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${animateFlow ? 'text-indigo-400 fill-indigo-400/20' : ''}`} />
              <span className="hidden sm:inline">Edge Flow</span>
            </button>

            <button
              onClick={() => setSpofOnly(!spofOnly)}
              title="Filter to Single Point of Failure (SPOF) bottleneck nodes"
              className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
                spofOnly
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>SPOF Radar</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-zinc-800/80">
          {/* Node Category Filters */}
          <div className="flex items-center gap-1 overflow-x-auto touch-scroll no-scrollbar py-0.5">
            {['ALL', 'Product', 'Component', 'Supplier', 'Region'].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-all shrink-0 border ${
                  filter === t
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                    : 'bg-zinc-950 hover:bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes or components..."
              className="w-full pl-8 pr-7 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Outage Active Banner Notice */}
      {outageNodeId && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-between gap-3 text-xs text-red-200 animate-pulse font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              Simulating Disruption on <strong>{DEFAULT_NODES.find((n) => n.id === outageNodeId)?.name}</strong> —{' '}
              <strong>{impactedNodeIds.size}</strong> nodes affected downstream!
            </span>
          </div>
          <button
            onClick={() => setOutageNodeId(null)}
            className="px-2.5 py-1 rounded bg-red-900/50 hover:bg-red-900 border border-red-700 text-red-100 text-[11px] shrink-0"
          >
            Clear Outage
          </button>
        </div>
      )}

      {/* Main CAD Interactive Canvas Container */}
      <div
        ref={containerRef}
        className="p-1 rounded-xl bg-zinc-950 border border-zinc-800 relative overflow-hidden shadow-2xl"
      >
        {/* Floating Zoom & Canvas Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg p-1.5 backdrop-blur-md z-20 shadow-xl">
          <button
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="p-1.5 hover:bg-zinc-800 text-zinc-300 rounded active:scale-95 transition-transform"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="p-1.5 hover:bg-zinc-800 text-zinc-300 rounded active:scale-95 transition-transform"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Canvas View"
            className="p-1.5 hover:bg-zinc-800 text-zinc-300 rounded active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-zinc-800 mx-0.5" />
          <span className="text-[11px] font-mono text-zinc-400 px-1 font-semibold">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Floating Canvas Legend */}
        <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 backdrop-blur-md z-20 text-[11px] font-mono text-zinc-400 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Product</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Component</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span>Supplier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Region</span>
          </div>
        </div>

        {/* Interactive SVG Viewport */}
        <div className="overflow-hidden rounded-lg bg-zinc-950 cursor-grab active:cursor-grabbing">
          <svg
            ref={svgRef}
            viewBox="0 0 850 610"
            className="w-full h-auto min-h-[480px] bg-zinc-950 font-mono select-none"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* SVG Markers & CAD Grid Defs */}
            <defs>
              <pattern id="cadGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#18181b" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="0.8" fill="#27272a" />
              </pattern>

              {/* Glowing Line Markers for Directed Graph Edges */}
              <marker
                id="arrowDefault"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3f3f46" />
              </marker>

              <marker
                id="arrowActive"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
              </marker>

              <marker
                id="arrowOutage"
                viewBox="0 0 10 10"
                refX="18"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Transform Group for Pan & Zoom */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Grid Background */}
              <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#cadGrid)" />

              {/* Relationship Links / Edges */}
              {DEFAULT_LINKS.map((link) => {
                const sourcePos = nodePositions[link.source];
                const targetPos = nodePositions[link.target];

                if (!sourcePos || !targetPos) return null;

                const isConnectedToFocus = connectedInfo.linkIds.has(link.id);
                const isHoveredEdge = hoveredEdgeId === link.id;
                const isOutageEdge =
                  impactedNodeIds.has(link.source) && impactedNodeIds.has(link.target);

                const sourceNode = DEFAULT_NODES.find((n) => n.id === link.source);
                const targetNode = DEFAULT_NODES.find((n) => n.id === link.target);

                // Calculate edge midpoints for relationship text label badge
                const midX = (sourcePos.x + targetPos.x) / 2;
                const midY = (sourcePos.y + targetPos.y) / 2;

                let strokeColor = '#27272a';
                let strokeWidth = 1.2;

                if (isOutageEdge) {
                  strokeColor = '#ef4444';
                  strokeWidth = 2.2;
                } else if (isConnectedToFocus || isHoveredEdge) {
                  strokeColor = '#6366f1';
                  strokeWidth = 2.5;
                }

                return (
                  <g
                    key={link.id}
                    onMouseEnter={() => setHoveredEdgeId(link.id)}
                    onMouseLeave={() => setHoveredEdgeId(null)}
                    className="cursor-pointer"
                  >
                    {/* Invisible Wide Touch Target for Hover */}
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke="transparent"
                      strokeWidth="14"
                    />

                    {/* Base Relationship Line */}
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={link.label === 'DEPENDS_ON' ? '4 4' : 'none'}
                      markerEnd={
                        isOutageEdge
                          ? 'url(#arrowOutage)'
                          : isConnectedToFocus
                          ? 'url(#arrowActive)'
                          : 'url(#arrowDefault)'
                      }
                      className="transition-all duration-200"
                    />

                    {/* Animated Flow Pulse Line */}
                    {(animateFlow || isConnectedToFocus) && !isOutageEdge && (
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={isConnectedToFocus ? '#818cf8' : '#3f3f46'}
                        strokeWidth={isConnectedToFocus ? 2 : 1}
                        strokeDasharray="6 8"
                        style={{
                          animation: 'dashFlow 1.2s linear infinite',
                          opacity: isConnectedToFocus ? 0.9 : 0.4,
                        }}
                      />
                    )}

                    {/* Interactive Relationship Badge on Edge */}
                    {(showEdgeLabels || isHoveredEdge || isConnectedToFocus) && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-28"
                          y="-7"
                          width="56"
                          height="14"
                          rx="3"
                          fill="#09090b"
                          stroke={isConnectedToFocus || isHoveredEdge ? '#6366f1' : '#27272a'}
                          strokeWidth="1"
                        />
                        <text
                          y="3"
                          textAnchor="middle"
                          fill={isConnectedToFocus || isHoveredEdge ? '#a5b4fc' : '#71717a'}
                          fontSize="7"
                          fontWeight="700"
                          letterSpacing="0.5"
                        >
                          {link.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Visual Graph Nodes */}
              {filteredNodes.map((node) => {
                const pos = nodePositions[node.id] || { x: node.x, y: node.y };
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isConnected = connectedInfo.nodeIds.has(node.id);
                const isImpactedByOutage = impactedNodeIds.has(node.id);
                const isDraggingThis = draggingNodeId === node.id;

                // Dim non-connected nodes when hovering/selecting
                const isDimmed = activeFocusId && !isConnected;

                let nodeStroke = '#27272a';
                let nodeFill = '#121215';

                if (isImpactedByOutage) {
                  nodeStroke = '#ef4444';
                  nodeFill = '#2a0a0a';
                } else if (isSelected) {
                  nodeStroke = '#6366f1';
                  nodeFill = '#1e1b4b';
                } else if (isHovered) {
                  nodeStroke = '#818cf8';
                  nodeFill = '#18181b';
                } else if (node.isSpof && spofOnly) {
                  nodeStroke = '#f59e0b';
                  nodeFill = '#261a06';
                }

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    onTouchStart={(e) => handleNodeTouchStart(e, node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className={`cursor-grab active:cursor-grabbing transition-opacity duration-200 ${
                      isDimmed ? 'opacity-30' : 'opacity-100'
                    }`}
                  >
                    {/* Glowing Selection Aura Ring */}
                    {(isSelected || isHovered || isImpactedByOutage) && (
                      <rect
                        x="-54"
                        y="-19"
                        width="108"
                        height="38"
                        rx="8"
                        fill="none"
                        stroke={isImpactedByOutage ? '#ef4444' : '#6366f1'}
                        strokeWidth="2"
                        strokeOpacity="0.4"
                        className="animate-pulse"
                      />
                    )}

                    {/* SPOF Alert Outer Pulse Ring */}
                    {node.isSpof && (
                      <circle
                        cx="42"
                        cy="-12"
                        r="5"
                        fill="#f59e0b"
                        className="animate-ping opacity-75"
                      />
                    )}

                    {/* Node Rectangle Box */}
                    <rect
                      x="-48"
                      y="-15"
                      width="96"
                      height="30"
                      rx="6"
                      fill={nodeFill}
                      stroke={nodeStroke}
                      strokeWidth={isSelected || isHovered ? '2' : '1'}
                      className="transition-colors duration-150 shadow-lg"
                    />

                    {/* Node Type Indicator Tag */}
                    <rect x="-44" y="-11" width="14" height="22" rx="3" fill={node.color} />
                    <text
                      x="-37"
                      y="4"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="800"
                    >
                      {node.type.charAt(0)}
                    </text>

                    {/* Node Label Text */}
                    <text
                      x="2"
                      y="4"
                      textAnchor="middle"
                      fill={isImpactedByOutage ? '#fca5a5' : '#f4f4f5'}
                      fontSize="8.5"
                      fontWeight="600"
                    >
                      {node.name.length > 13 ? `${node.name.substring(0, 11)}..` : node.name}
                    </text>

                    {/* SPOF Warning Icon Badge */}
                    {node.isSpof && (
                      <circle cx="42" cy="-12" r="4" fill="#f59e0b" stroke="#09090b" strokeWidth="1" />
                    )}

                    {/* Outage Warning Badge */}
                    {isImpactedByOutage && (
                      <circle cx="-42" cy="-12" r="4" fill="#ef4444" stroke="#09090b" strokeWidth="1" />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Selected Node Technical Details & Cypher Inspector Drawer */}
      {selectedNode ? (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedNode.color }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-100">{selectedNode.name}</span>
                  <span className="px-2 py-0.5 text-[10px] rounded bg-zinc-800 text-zinc-300 font-mono">
                    :{selectedNode.type}
                  </span>
                  {selectedNode.isSpof && (
                    <span className="px-2 py-0.5 text-[10px] rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                      SPOF Bottleneck
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">{selectedNode.detail}</p>
              </div>
            </div>

            {/* Outage Simulation & Close Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setOutageNodeId(outageNodeId === selectedNode.id ? null : selectedNode.id)
                }
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                  outageNodeId === selectedNode.id
                    ? 'bg-red-600 text-white border-red-500 shadow-sm'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-red-400 border-red-900/50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {outageNodeId === selectedNode.id ? 'Active Outage' : 'Simulate Outage'}
                </span>
              </button>

              <button
                onClick={() => setSelectedNodeId(null)}
                className="p-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upstream & Downstream Dependencies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Upstream Inputs */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-indigo-400 rotate-180" />
                Upstream Dependencies ({nodeConnections.upstream.length})
              </span>
              {nodeConnections.upstream.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic">No incoming dependency edges</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {nodeConnections.upstream.map((dep) => (
                    <button
                      key={dep.id}
                      onClick={() => setSelectedNodeId(dep.id)}
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1.5 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dep.color }} />
                      <span>{dep.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Downstream Dependents */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-emerald-400" />
                Downstream Dependents ({nodeConnections.downstream.length})
              </span>
              {nodeConnections.downstream.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic">No downstream dependents</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {nodeConnections.downstream.map((dep) => (
                    <button
                      key={dep.id}
                      onClick={() => setSelectedNodeId(dep.id)}
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] flex items-center gap-1.5 transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dep.color }} />
                      <span>{dep.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generated Cypher Query Card */}
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Cypher Traversal Query
              </span>
              <button
                onClick={handleCopyCypher}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 transition-colors"
              >
                {copiedCypher ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-400" />
                    <span>Copy Query</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-2.5 rounded bg-zinc-900 text-indigo-300 text-[11px] overflow-x-auto whitespace-pre">
              {selectedCypher}
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-500 shrink-0" />
            <span>Click any node to inspect relationship edges, simulate outage impact, or generate Cypher queries.</span>
          </div>
        </div>
      )}
    </div>
  );
}

