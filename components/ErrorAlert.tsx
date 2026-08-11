import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({
  title = 'CognoDB Execution Error',
  message,
  onRetry,
}: ErrorAlertProps) {
  return (
    <div className="p-4 rounded-md bg-red-950/30 border border-red-900/60 space-y-3 my-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-red-200 uppercase tracking-wider">{title}</h4>
          <p className="text-xs text-red-300/90 mt-1 leading-relaxed">{message}</p>
          
          <div className="mt-3 p-2.5 rounded bg-zinc-950 border border-red-900/40 text-[11px] font-mono text-zinc-300 space-y-1">
            <p className="font-semibold text-red-400">Troubleshooting:</p>
            <p>1. Check CognoDB / Neo4j database service status.</p>
            <p>2. Verify credentials in <code className="text-amber-300">.env.local</code> (NEO4J_URI, NEO4J_USERNAME=&quot;cognodb&quot;).</p>
            <p>3. Run <code className="text-amber-300">npm run seed</code> in terminal to clear and re-seed graph.</p>
          </div>
        </div>
      </div>

      {onRetry && (
        <div className="flex justify-end">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded bg-red-900/80 hover:bg-red-800 border border-red-700 text-white transition-colors focus:ring-1 focus:ring-red-500 focus:outline-none"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Query
          </button>
        </div>
      )}
    </div>
  );
}
