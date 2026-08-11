import React from 'react';

export function LoadingSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="w-full space-y-3 animate-pulse">
      <div className="h-6 bg-zinc-900 border border-zinc-800 rounded-md w-1/4 mb-4"></div>
      <div className={`grid grid-cols-1 md:grid-cols-${cards} gap-3`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="p-4 rounded-md bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-1/3"></div>
            <div className="h-6 bg-zinc-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>
      <div className="h-48 bg-zinc-900 rounded-md border border-zinc-800 p-4 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-1/5"></div>
        <div className="h-8 bg-zinc-800/80 rounded w-full"></div>
        <div className="h-8 bg-zinc-800/80 rounded w-full"></div>
      </div>
    </div>
  );
}
