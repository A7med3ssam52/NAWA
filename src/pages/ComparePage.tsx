import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, ShoppingCart, BarChart3 } from 'lucide-react';
import { useCompare } from '@/contexts/CompareContext';
import { useCart } from '@/contexts';
import { formatPrice, cn } from '@/utils';
import { PAGES } from '@/constants';
import { Button, EmptyState, Rating } from '@/components/ui';
import toast from 'react-hot-toast';

export function ComparePage() {
  const { items, removeItem, clearAll } = useCompare();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <EmptyState
          icon={<BarChart3 className="w-16 h-16" />}
          title="لا توجد منتجات للمقارنة"
          description="أضف منتجات إلى المقارنة لترى الفروقات بينها"
          action={{ label: 'تصفح المنتجات', onClick: () => window.location.href = PAGES.PRODUCTS }}
        />
      </motion.div>
    );
  }

  const allSpecs = Array.from(new Set(items.flatMap((p) => p.specifications.map((s) => s.label))));
  const allTags = Array.from(new Set(items.flatMap((p) => p.tags)));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">
          مقارنة المنتجات <span className="text-base font-medium text-gray-400">({items.length})</span>
        </h1>
        <Button variant="ghost" size="sm" rounded="xl" onClick={clearAll}>مسح الكل</Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="text-right p-3 w-32 sm:w-40" />
              {items.map((product) => (
                <th key={product.id} className="p-3 text-center min-w-[180px]">
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
                    <Button variant="secondary" size="sm" rounded="xl" className="mt-2 w-full" onClick={() => { addItem(product, 1); toast.success('تمت إضافة المنتج إلى السلة'); }}>
                      <ShoppingCart className="w-3 h-3" /> أضف للسلة
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100">
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">السعر</td>
              {items.map((p) => (
                <td key={p.id} className="p-3 text-center text-sm font-cairo text-gray-900">{formatPrice(p.price)}</td>
              ))}
            </tr>
            <tr className="border-t border-gray-100">
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">التقييم</td>
              {items.map((p) => (
                <td key={p.id} className="p-3 text-center"><Rating value={p.rating} size="sm" /></td>
              ))}
            </tr>
            <tr className="border-t border-gray-100">
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">الخصم</td>
              {items.map((p) => (
                <td key={p.id} className="p-3 text-center text-sm font-cairo">{p.discount ? `${p.discount}%` : '-'}</td>
              ))}
            </tr>
            <tr className="border-t border-gray-100">
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">المخزون</td>
              {items.map((p) => (
                <td key={p.id} className={cn('p-3 text-center text-sm font-cairo', p.stock > 0 ? 'text-success' : 'text-danger')}>{p.stock > 0 ? 'متوفر' : 'نفد'}</td>
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
              <td className="p-3 text-sm font-bold font-cairo text-gray-900">الوسوم</td>
              {items.map((p) => (
                <td key={p.id} className="p-3 text-center text-sm font-cairo text-gray-600">{p.tags.join(', ') || '-'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}


