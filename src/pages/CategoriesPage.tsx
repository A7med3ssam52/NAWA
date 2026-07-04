import { motion } from 'framer-motion';
import { categories } from '@/data';
import { CategoryCard } from '@/components/features/CategoryCard';

export function CategoriesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 dark:text-dark-text mb-8">
        الأقسام
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-5">
        {categories.map((cat, i) => (
          <CategoryCard key={cat.id} category={cat} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
