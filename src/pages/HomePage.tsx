import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getNewProducts, getBestSellingProducts, getDiscountedProducts, categories, brands, testimonials } from '@/data';
import { HeroSlider } from '@/components/features/HeroSlider';
import { NewsletterSection } from '@/components/features/NewsletterSection';
import { ProductGrid } from '@/components/features/ProductGrid';
import { CategoryCard } from '@/components/features/CategoryCard';
import { BrandCard } from '@/components/features/BrandCard';
import { TestimonialCard } from '@/components/features/TestimonialCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useRecentlyViewed } from '@/hooks';

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

function useHomeProducts() {
  return useQuery({
    queryKey: ['home-products'],
    queryFn: () => ({
      newProducts: getNewProducts(),
      bestSelling: getBestSellingProducts(),
      discounted: getDiscountedProducts(),
    }),
    staleTime: 60000,
  });
}

export function HomePage() {
  useEffect(() => { document.title = 'زاهي - أناقة تزهو بك'; }, []);

  const { data, isLoading } = useHomeProducts();
  const { items: recentlyViewed } = useRecentlyViewed();

  const allLoaded = !isLoading && data;

  return (
    <div dir="rtl" className="ios-font-smooth min-h-screen ios-safe-area-inset pb-20">
      <HeroSlider />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <section className="ios-card px-4 py-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-4">الأقسام</h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide -mx-3 px-3">
            {categories.map((cat, i) => (
              <div key={cat.id} className="shrink-0 w-32 sm:w-36 md:w-40">
                <CategoryCard category={cat} index={i} />
              </div>
            ))}
          </div>
        </section>

        <section className="ios-card px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">أحدث المنتجات</h2>
          </div>
          {!allLoaded ? <SectionSkeleton /> : <ProductGrid items={data.newProducts} loading={false} animated={false} />}
        </section>

        <section className="ios-card px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">الأكثر مبيعاً</h2>
          </div>
          {!allLoaded ? <SectionSkeleton /> : <ProductGrid items={data.bestSelling} loading={false} animated={false} />}
        </section>

        {recentlyViewed.length > 0 && (
          <section className="ios-card px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">شوهد مؤخراً</h2>
            </div>
            <ProductGrid items={recentlyViewed} loading={false} animated={false} />
          </section>
        )}

        <section className="ios-card px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text">عروض مميزة</h2>
          </div>
          {!allLoaded ? <SectionSkeleton /> : <ProductGrid items={data.discounted} loading={false} animated={false} />}
        </section>

        <section className="ios-group">
          <h2 className="ios-section-header">الماركات</h2>
          <div className="px-4 py-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
              {brands.map((brand, i) => (
                <BrandCard key={brand.id} brand={brand} index={i} />
              ))}
            </div>
          </div>
        </section>

        <section className="ios-card px-4 py-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-4">ماذا يقول عملاؤنا</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.id} testimonial={t} index={i} />
            ))}
          </div>
        </section>

        <section className="ios-card px-4 py-4">
          <NewsletterSection />
        </section>
      </div>
    </div>
  );
}
