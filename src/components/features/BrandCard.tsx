import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils';
import type { Brand } from '@/types';
import { FadeInView } from '@/components/ui';

interface BrandCardProps {
  brand: Brand;
  index?: number;
}

export function BrandCard({ brand, index = 0 }: BrandCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <FadeInView delay={index * 0.05} y={0} duration={0.3}>
      <Link
        to={`/brands/${brand.slug}`}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300'
        )}
      >
        {!imgError ? (
          <div className="w-20 h-14 flex items-center justify-center">
            <img
              src={brand.logo}
              alt={brand.name}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={cn(
                'max-w-full max-h-full object-contain transition-opacity duration-300',
                imgLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          </div>
        ) : (
          <div className="w-20 h-14 flex items-center justify-center">
            <span className="text-lg font-bold font-cairo text-gray-400 dark:text-dark-muted">
              {brand.name.charAt(0)}
            </span>
          </div>
        )}
        <span className="text-sm font-semibold font-cairo text-gray-900 dark:text-dark-text text-center">
          {brand.name}
        </span>
        <span className="text-xs text-gray-400 dark:text-dark-muted font-cairo">
          {brand.productsCount} منتج
        </span>
      </Link>
    </FadeInView>
  );
}
