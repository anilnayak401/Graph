'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Server, Sparkles, Check, AlertCircle } from 'lucide-react';

export function Header({ onRefresh }: { onRefresh?: () => void }) {
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    nodes: number;
    relationships: number;
    message: string;
    loading: boolean;
  }>({
    connected: false,
    nodes: 0,
    relationships: 0,
    message: 'Initializing connection...',
    loading: true,
  });

  const [seeding, setSeeding] = useState(false);
  const [seedNotification, setSeedNotification] = useState<string | null>(null);

  const checkHealth = async () => {
    setDbStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/health');
      const data = await res.json();

      if (data.connected) {
        setDbStatus({
          connected: true,
          nodes: data.counts?.nodes || 0,
          relationships: data.counts?.relationships || 0,
          message: 'Connected',
          loading: false,
        });
      } else {
        setDbStatus({
          connected: false,
          nodes: 0,
          relationships: 0,
          message: data.message || 'Disconnected',
          loading: false,
        });
      }
    } catch (error) {
      setDbStatus({
        connected: false,
        nodes: 0,
        relationships: 0,
        message: 'Network Unreachable',
        loading: false,
      });
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedNotification('Executing Cypher graph seed transaction...');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSeedNotification('Database graph re-seeded successfully.');
        await checkHealth();
        if (onRefresh) onRefresh();
      } else {
        setSeedNotification(`Seed failed: ${data.error}`);
      }
    } catch (e) {
      setSeedNotification('Error executing graph seed script.');
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedNotification(null), 4000);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Organization & Project Title */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-300 shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
              <span className="hidden sm:inline text-xs font-semibold text-zinc-400 tracking-tight">Enterprise Risk</span>
              <span className="hidden sm:inline text-zinc-600">/</span>
              <h1 className="text-xs sm:text-sm font-semibold text-zinc-100 tracking-tight truncate">
                Supply Chain Analyzer
              </h1>
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono font-medium rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                CognoDB
              </span>
            </div>
          </div>
        </div>

        {/* Right: DB Health Status & Seed Action */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] sm:text-xs">
            {dbStatus.loading ? (
              <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
            ) : dbStatus.connected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="font-medium text-zinc-300">Connected</span>
                <span className="text-zinc-700">|</span>
                <span className="text-zinc-400 font-mono text-[10px] sm:text-[11px]">
                  {dbStatus.nodes} nodes &bull; {dbStatus.relationships} rels
                </span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                <span className="font-medium text-red-400">Offline</span>
              </>
            )}
          </div>

          {/* Seed Button */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 text-xs font-medium rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition-colors focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 active:scale-95 touch-manipulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-3 sm:h-3 text-zinc-400 ${seeding ? 'animate-spin' : ''}`} />
            <span className="text-xs">{seeding ? 'Seeding...' : 'Re-seed'}</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {seedNotification && (
        <div className="max-w-7xl mx-auto mt-2">
          <div className="p-2 px-3 text-xs rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-between">
            <span className="font-mono text-[11px] truncate">{seedNotification}</span>
            <button onClick={() => setSeedNotification(null)} className="text-zinc-500 hover:text-zinc-300 ml-2 p-1">
              ✕
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
