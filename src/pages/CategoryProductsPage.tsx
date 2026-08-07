import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useCategories, useProducts } from '@/api';
import { ProductGrid } from '@/components/features/ProductGrid';
import { Button, EmptyState, Spinner } from '@/components/ui';
import { PAGES } from '@/constants';

export function CategoryProductsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { data: categories } = useCategories();
  const category = (categories || []).find((c) => c.slug === slug);
  const { data: result, isLoading } = useProducts({ category: category ? [category.id] : [], page: 1, pageSize: 50 });

  if (!category) {
    if (!slug) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('common.notAvailable')}</h2>
          <Link to={PAGES.HOME}>
            <Button variant="primary">{t('common.back')}</Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const categoryProducts = result?.items || [];

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900">
          {category.name}
        </h1>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Spinner size="lg" />
        </div>
      ) : categoryProducts.length === 0 ? (
        <EmptyState
          icon={<ArrowLeft className="w-16 h-16" />}
          title={t('products.noProducts')}
          action={{ label: t('common.viewAll'), onClick: () => window.location.assign(PAGES.PRODUCTS) }}
        />
      ) : (
        <ProductGrid items={categoryProducts} loading={false} animated={false} />
      )}
    </div>
  );
}