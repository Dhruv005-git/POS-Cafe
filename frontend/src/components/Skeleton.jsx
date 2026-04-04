// frontend/src/components/Skeleton.jsx
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-700/40 rounded-lg ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }, (_, j) => (
            <Skeleton key={j} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonProductGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="card p-3 space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonFloorView() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-6">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="card p-4 space-y-3 aspect-square flex flex-col justify-between">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-8 rounded-lg mx-auto" />
          <Skeleton className="h-3 w-2/3 mx-auto" />
        </div>
      ))}
    </div>
  );
}