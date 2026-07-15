import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { categories, products } from '@/data';
import { ProductGrid } from '@/components/features/ProductGrid';
import { Button } from '@/components/ui';
import { PAGES } from '@/constants';

export function CategoryProductsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('common.notAvailable')}</h2>
        <Link to={PAGES.HOME}>
          <Button variant="primary">{t('common.back')}</Button>
        </Link>
      </div>
    );
  }

  if (category.id === 'cat-2') {
    return (
      <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-secondary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 mb-3">
            {category.name}
          </h1>
          <p className="text-lg text-gray-500 font-cairo mb-8">
            قريباً.. عالم الأنوثة في انتظارك
          </p>
          <Link to={PAGES.HOME}>
            <Button variant="primary" size="lg" rounded="xl">
              <ArrowLeft className="w-4 h-4 ml-2" />
              {t('common.back')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryProducts = products.filter((p) => p.category === category.id);

  return (
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900">
          {category.name}
        </h1>
      </div>
      <ProductGrid items={categoryProducts} loading={false} animated={false} />
    </div>
  );
}
