import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="mb-4 h-11 w-11 rounded-xl" />
      <Skeleton className="mb-2 h-7 w-24" />
      <Skeleton className="h-3.5 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 6 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-white/5 px-4 py-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === 0 ? 'w-24' : 'flex-1')} />
      ))}
    </div>
  );
}
