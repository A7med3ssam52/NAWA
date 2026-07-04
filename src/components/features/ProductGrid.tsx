import { Package } from 'lucide-react';
import { cn } from '@/utils';
import type { Product } from '@/types';
import { ProductCardSkeleton, FadeInView } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/ui';
import { ProductCardWithContext } from './ProductCardWithContext';

interface ProductGridProps {
  items: Product[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
  animated?: boolean;
}

export function ProductGrid({ items, loading, error, onRetry, className, animated = true }: ProductGridProps) {
  if (error) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden"
          >
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-16 h-16" />}
        title="لا توجد منتجات"
        description="عذراً، لا توجد منتجات تطابق معايير البحث. حاول تغيير الفلاتر أو البحث بكلمة مختلفة."
      />
    );
  }

  if (!animated) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5', className)}>
        {items.map((product) => (
          <ProductCardWithContext key={product.id} product={product} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5', className)}>
      {items.map((product, index) => (
        <FadeInView key={product.id} delay={Math.min(index * 0.03, 0.3)} y={20} duration={0.3}>
          <ProductCardWithContext product={product} />
        </FadeInView>
      ))}
    </div>
  );
}
