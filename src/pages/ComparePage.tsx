import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, ShoppingCart, BarChart3 } from 'lucide-react';
import { useCompare } from '@/contexts/CompareContext';
import { useCart } from '@/contexts';
import { formatPrice, cn } from '@/utils';
import { PAGES } from '@/constants';
import { Button, Card, EmptyState, Rating } from '@/components/ui';
import toast from 'react-hot-toast';

export function ComparePage() {
  const { t, i18n } = useTranslation();
  const { items, removeItem, clearAll } = useCompare();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <EmptyState
          icon={<BarChart3 className="w-16 h-16" />}
          title={t('compare.emptyTitle')}
          description={t('compare.emptyDesc')}
          action={{ label: t('nav.home'), onClick: () => window.location.href = PAGES.PRODUCTS }}
        />
      </motion.div>
    );
  }

  const allSpecs = Array.from(new Set(items.flatMap((p) => p.specifications.map((s) => s.label))));
  const allTags = Array.from(new Set(items.flatMap((p) => p.tags)));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">
          {t('compare.title')} <span className="text-base font-medium text-gray-400">({items.length})</span>
        </h1>
        <Button variant="ghost" size="sm" rounded="xl" onClick={clearAll}>{t('compare.clearAll')}</Button>
      </div>

      <div className="hidden lg:block overflow-x-auto pb-4 overscroll-x-contain">
        <table className="w-full min-w-[540px] border-collapse">
          <thead>
            <tr>
              <th className="text-right p-3 w-32 sm:w-40" />
              {items.map((product) => (
                <th key={product.id} className="p-3 text-center min-w-[160px]">
                  <div className="relative">
                    <button onClick={() => removeItem(product.id)} className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-danger hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden bg-gray-50 mb-2">
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <Link to={PAGES.PRODUCT_DETAILS.replace(':slug', product.slug)} className="text-sm font-bold font-cairo text-gray-900 hover:text-secondary line-clamp-2">
                      {product.name}
                    </Link>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Rating value={product.rating} size="sm" />
                    </div>
                    <div className="mt-2">
                      <span className="text-lg font-bold font-cairo text-gray-900">{formatPrice(product.price)}</span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className="text-xs text-gray-400 line-through font-cairo mr-1">{formatPrice(product.oldPrice)}</span>
                      )}
                    </div>
                    <Button variant="secondary" size="sm" rounded="xl" className="mt-2 w-full" onClick={() => { addItem(product, 1); toast.success(t('products.addedToCart')); }}>
                      <ShoppingCart className="w-3 h-3" /> {t('products.addToCart')}
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">{t('compare.price')}</td>
              {items.map((p) => (
                <td key={p.id} className="p-3 text-center text-sm font-cairo text-gray-900">{formatPrice(p.price)}</td>
              ))}
            </tr>
            <tr className="border-t border-gray-100">
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">{t('compare.rating')}</td>
              {items.map((p) => (
                <td key={p.id} className="p-3 text-center"><Rating value={p.rating} size="sm" /></td>
              ))}
            </tr>
            <tr className="border-t border-gray-100">
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">{t('cart.discount')}</td>
              {items.map((p) => (
                <td key={p.id} className="p-3 text-center text-sm font-cairo">{p.discount ? `${p.discount}%` : '-'}</td>
              ))}
            </tr>
            <tr className="border-t border-gray-100">
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">{t('compare.availability')}</td>
              {items.map((p) => (
                <td key={p.id} className={cn('p-3 text-center text-sm font-cairo', p.stock > 0 ? 'text-success' : 'text-danger')}>{p.stock > 0 ? t('compare.inStock') : t('compare.outOfStock')}</td>
              ))}
            </tr>
            {allSpecs.map((spec) => (
              <tr key={spec} className="border-t border-gray-100">
                <td className="p-3 text-sm font-bold font-cairo text-gray-900">{spec}</td>
                {items.map((p) => {
                  const val = p.specifications.find((s) => s.label === spec)?.value;
                  return <td key={p.id} className="p-3 text-center text-sm font-cairo text-gray-600">{val || '-'}</td>;
                })}
              </tr>
            ))}
            <tr className="border-t border-gray-100">
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">{t('compare.tags')}</td>
              {items.map((p) => (
                <td key={p.id} className="p-3 text-center text-sm font-cairo text-gray-600">{p.tags.join(', ') || '-'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="lg:hidden space-y-3">
        {items.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card padding="md">
              <div className="flex items-start gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={PAGES.PRODUCT_DETAILS.replace(':slug', product.slug)} className="text-sm font-bold font-cairo text-gray-900 hover:text-secondary line-clamp-2">
                      {product.name}
                    </Link>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
                      aria-label={t('compare.removeProduct')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Rating value={product.rating} size="sm" />
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold font-cairo text-gray-900">{formatPrice(product.price)}</span>
                    {product.oldPrice && product.oldPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through font-cairo">{formatPrice(product.oldPrice)}</span>
                    )}
                  </div>
                  <p className={cn('mt-1 text-xs font-cairo', product.stock > 0 ? 'text-success' : 'text-danger')}>
                    {product.stock > 0 ? t('compare.inStock') : t('compare.outOfStock')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <Button variant="secondary" size="sm" rounded="xl" className="flex-1" onClick={() => { addItem(product, 1); toast.success(t('products.addedToCart')); }}>
                  <ShoppingCart className="w-3 h-3" /> {t('products.addToCart')}
                </Button>
                <Link
                  to={PAGES.PRODUCT_DETAILS.replace(':slug', product.slug)}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold font-cairo text-gray-700 hover:border-secondary hover:text-secondary transition-colors shrink-0"
                >
                  {t('profile.viewDetails')}
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}


