import React from 'react';
import { SearchX, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionText?: string;
}

export function EmptyState({
  title = 'No Data Available',
  description = 'No nodes or matching relationships were returned for this query.',
  onAction,
  actionText = 'Refresh',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900 rounded-md border border-zinc-800 my-4">
      <SearchX className="w-6 h-6 text-zinc-500 mb-2" />
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <RefreshCw className="w-3 h-3 text-zinc-400" />
          {actionText}
        </button>
      )}
    </div>
  );
}
