import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/utils';

interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

const sizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function Rating({ value, count, size = 'md', showCount = true, className }: RatingProps) {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.3 && value - fullStars < 0.7;
  const adjustedFull = value - fullStars >= 0.7 ? fullStars + 1 : fullStars;
  const emptyStars = 5 - adjustedFull - (hasHalf ? 1 : 0);

  return (
    <div className={cn('inline-flex items-center gap-1', className)} role="img" aria-label={`التقييم ${value} من 5`}>
      <div className="inline-flex items-center gap-0.5" dir="ltr">
        {Array.from({ length: adjustedFull }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizes[size], 'fill-accent text-accent')}
            aria-hidden="true"
          />
        ))}
        {hasHalf && (
          <StarHalf
            className={cn(sizes[size], 'fill-accent text-accent')}
            aria-hidden="true"
          />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizes[size], 'text-gray-300 dark:text-gray-600')}
            aria-hidden="true"
          />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-gray-500 dark:text-dark-muted font-cairo">
          ({count})
        </span>
      )}
    </div>
  );
}
