import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Grid3X3 } from 'lucide-react';
import { useCategories } from '@/api';
import { EmptyState } from '@/components/ui';
import { CategoryCard } from '@/components/features/CategoryCard';

export function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const { data: categories } = useCategories();
  const items = categories || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 mb-8">
        {t('categories.title')}
      </h1>
      {items.length === 0 ? (
        <EmptyState
          icon={<Grid3X3 className="w-16 h-16" />}
          title={t('categories.empty')}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-5">
          {items.map((cat, i) => (
            <CategoryCard key={cat.id} category={cat} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
