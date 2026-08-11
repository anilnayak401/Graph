'use client';

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface CypherQueryInspectorProps {
  queryInfo?: {
    cypher: string;
    params: Record<string, any>;
    executionTimeMs: number;
  };
}

export function CypherQueryInspector({ queryInfo }: CypherQueryInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!queryInfo) return null;

  const handleCopy = () => {
    const textToCopy = `// Cypher Query\n${queryInfo.cypher}\n\n// Parameters\n${JSON.stringify(queryInfo.params, null, 2)}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 rounded-md border border-zinc-800 bg-zinc-950 overflow-hidden">
      {/* Drawer Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between bg-zinc-900/90 hover:bg-zinc-900 transition-colors text-left focus:ring-1 focus:ring-indigo-500 focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-300 font-mono">
            CYPHER QUERY INSPECTOR
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-zinc-800 text-zinc-300">
            {queryInfo.executionTimeMs}ms
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-zinc-800/80 text-zinc-400">
            Parameterized
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
          <span className="text-[11px] font-mono">{isOpen ? 'Hide Query' : 'View Query'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Drawer Body */}
      {isOpen && (
        <div className="p-4 border-t border-zinc-800 space-y-3 bg-zinc-950 font-mono text-xs">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Cypher Statement
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-colors focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="p-3 rounded bg-zinc-900 border border-zinc-800/80 text-indigo-300 overflow-x-auto">
            <pre className="whitespace-pre-wrap leading-relaxed">{queryInfo.cypher}</pre>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400 block mb-1.5">
              Query Parameters JSON
            </span>
            <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800/80 text-zinc-300 overflow-x-auto">
              <pre>{JSON.stringify(queryInfo.params, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
