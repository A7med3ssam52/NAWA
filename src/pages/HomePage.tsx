import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategories, useTestimonials } from '@/api';
import { useNewProducts, useBestSellingProducts, useDiscountedProducts } from '@/api';
import { HeroSlider } from '@/components/features/HeroSlider';
import { NewsletterSection } from '@/components/features/NewsletterSection';
import { ProductGrid } from '@/components/features/ProductGrid';
import { CategoryCard } from '@/components/features/CategoryCard';
import { TestimonialCard } from '@/components/features/TestimonialCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { useRecentlyViewed } from '@/hooks';

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { data: categories } = useCategories();
  useEffect(() => { document.title = t('home.title'); }, [t]);

  const newProducts = useNewProducts();
  const bestSelling = useBestSellingProducts();
  const discounted = useDiscountedProducts();
  const testimonials = useTestimonials();
  const { items: recentlyViewed } = useRecentlyViewed();

  const allLoaded = newProducts.data && bestSelling.data && discounted.data;

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="ios-font-smooth min-h-screen ios-safe-area-inset pb-20">
      <HeroSlider />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        <section className="ios-card px-4 py-4">
          <h2 className="text-lg font-bold text-gray-700 mb-4">{t('home.categories')}</h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 scrollbar-hide -mx-3 px-3">
            {categories?.map((cat, i) => (
              <div key={cat.id} className="shrink-0 w-32 sm:w-36 md:w-40">
                <CategoryCard category={cat} index={i} />
              </div>
            ))}
          </div>
        </section>

        <section className="ios-card px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">{t('home.newProducts')}</h2>
          </div>
          {!allLoaded ? <SectionSkeleton /> : <ProductGrid items={newProducts.data!.slice(0, 12)} loading={false} animated={false} />}
        </section>

        <section className="ios-card px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">{t('home.bestSelling')}</h2>
          </div>
          {!allLoaded ? <SectionSkeleton /> : <ProductGrid items={bestSelling.data!} loading={false} animated={false} />}
        </section>

        {recentlyViewed.length > 0 && (
          <section className="ios-card px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-700">{t('home.recentlyViewed')}</h2>
            </div>
            <ProductGrid items={recentlyViewed} loading={false} animated={false} />
          </section>
        )}

        <section className="ios-card px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">{t('home.specialOffers')}</h2>
          </div>
          {!allLoaded ? <SectionSkeleton /> : <ProductGrid items={discounted.data!.slice(0, 12)} loading={false} animated={false} />}
        </section>

        <section className="ios-card px-4 py-4">
          <h2 className="text-lg font-bold text-gray-700 mb-4">{t('home.testimonials')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {(testimonials.data || []).map((test, i) => (
              <TestimonialCard key={test.id} testimonial={test} index={i} />
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

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}