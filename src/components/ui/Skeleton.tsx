import { cn } from '@/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-200 dark:bg-dark-border',
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/5 before:to-transparent before:bg-[length:200%_100%] before:animate-shimmer',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded-lg h-4',
        variant === 'rectangular' && 'rounded-xl',
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton variant="rectangular" className="w-full aspect-square" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton variant="text" className="w-1/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} variant="text" className="flex-1 h-8" />
          ))}
        </div>
      ))}
    </div>
  );
}
