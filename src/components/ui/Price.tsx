import { formatPrice, formatDiscount, cn } from '@/utils';

interface PriceProps {
  price: number;
  oldPrice?: number;
  discount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { current: 'text-base', old: 'text-xs', badge: 'text-[10px] px-1.5 py-0.5' },
  md: { current: 'text-xl', old: 'text-sm', badge: 'text-xs px-2 py-0.5' },
  lg: { current: 'text-3xl', old: 'text-base', badge: 'text-sm px-2.5 py-1' },
};

export function Price({ price, oldPrice, discount, size = 'md', className }: PriceProps) {
  const showDiscount = discount && discount > 0;
  const showOldPrice = oldPrice && oldPrice > price;

  return (
    <div className={cn('inline-flex items-baseline gap-2', className)}>
      <span
        className={cn(
          'font-bold text-gray-900 dark:text-dark-text font-cairo',
          sizes[size].current
        )}
      >
        {formatPrice(price)}
      </span>
      {showOldPrice && (
        <span
          className={cn(
            'text-gray-400 dark:text-dark-muted line-through font-cairo',
            sizes[size].old
          )}
        >
          {formatPrice(oldPrice)}
        </span>
      )}
      {showDiscount && (
        <span
          className={cn(
            'bg-danger/10 text-danger font-semibold rounded-full font-cairo',
            sizes[size].badge
          )}
        >
          {formatDiscount(discount)}
        </span>
      )}
    </div>
  );
}
