import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils';
import type { Category } from '@/types';
import { PAGES } from '@/constants';
import { FadeInView } from '@/components/ui';

interface CategoryCardProps {
  category: Category;
  index?: number;
}

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <FadeInView delay={index * 0.05} y={20} duration={0.4}>
      <Link
        to={`${PAGES.CATEGORY_PRODUCTS.replace(':slug', category.slug)}`}
        className="group relative block rounded-2xl overflow-hidden bg-gray-100 dark:bg-dark-border shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={category.image}
            alt={category.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={cn(
              'w-full h-full object-cover transition-all duration-500 group-hover:scale-110',
              imgLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
          <h3 className="text-base lg:text-lg font-bold font-cairo text-white mb-1">
            {category.name}
          </h3>
          <p className="text-sm text-white/80 font-cairo">
            {category.productsCount} منتج
          </p>
        </div>
      </Link>
    </FadeInView>
  );
}
