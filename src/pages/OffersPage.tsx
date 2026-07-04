import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useDiscountedProducts } from '@/api';
import { ProductGrid } from '@/components/features/ProductGrid';

export function OffersPage() {
  const { data: products, isLoading, error, refetch } = useDiscountedProducts();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir="rtl"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-rose-600 via-accent to-orange-500 p-8 lg:p-12 mb-8 lg:mb-12"
      >
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>
        <div className="relative z-10 flex items-center gap-4 lg:gap-6">
          <div className="flex items-center justify-center w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-sm">
            <Zap className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold font-cairo text-white mb-1">
              خصومات تصل إلى 50%
            </h1>
            <p className="text-sm lg:text-base text-white/80 font-cairo">
              عروض حصرية على منتجات مختارة بأسعار لا تقبل المنافسة
            </p>
          </div>
        </div>
      </motion.div>

      <ProductGrid
        items={products || []}
        loading={isLoading}
        error={error}
        onRetry={refetch}
      />
    </motion.div>
  );
}
