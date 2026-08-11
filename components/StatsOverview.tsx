import React from 'react';
import { Package, Cpu, Factory, Globe, AlertTriangle } from 'lucide-react';

interface StatsOverviewProps {
  counts: Record<string, number>;
  spofCount: number;
  loading?: boolean;
}

export function StatsOverview({ counts, spofCount, loading = false }: StatsOverviewProps) {
  const stats = [
    {
      label: 'Products',
      value: counts['product'] || 0,
      icon: Package,
      description: 'Catalog products',
    },
    {
      label: 'Components',
      value: counts['component'] || 0,
      icon: Cpu,
      description: 'Sub-assembly BOM nodes',
    },
    {
      label: 'Suppliers',
      value: counts['supplier'] || 0,
      icon: Factory,
      description: 'Manufacturing vendors',
    },
    {
      label: 'Regions',
      value: counts['region'] || 0,
      icon: Globe,
      description: 'Geographic zones',
    },
    {
      label: 'SPOF Bottlenecks',
      value: spofCount,
      icon: AlertTriangle,
      description: 'Single-source risks',
      isWarning: spofCount > 0,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3.5 rounded-md bg-zinc-900/60 border border-zinc-800 animate-pulse space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
            <div className="h-6 bg-zinc-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-md bg-zinc-900/80 border ${
              stat.isWarning ? 'border-amber-900/50 bg-amber-950/10' : 'border-zinc-800'
            } flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                {stat.label}
              </span>
              <Icon className={`w-3.5 h-3.5 ${stat.isWarning ? 'text-amber-400' : 'text-zinc-400'}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-zinc-100 font-mono tracking-tight">
                {stat.value}
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-sans truncate">
                {stat.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
