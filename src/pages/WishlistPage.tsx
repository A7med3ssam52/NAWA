import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingCart, Trash2, Share2 } from 'lucide-react';
import { useWishlist, useCart } from '@/contexts';
import { formatPrice } from '@/utils';
import { EmptyState, Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { PAGES, SITE_URL } from '@/constants';
import toast from 'react-hot-toast';

export function WishlistPage() {
  const { t, i18n } = useTranslation();
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <EmptyState
          icon={<Heart className="w-16 h-16" />}
          title={t('wishlist.emptyTitle')}
          description={t('wishlist.emptyDesc')}
          action={{ label: t('wishlist.shopNow'), onClick: () => window.location.href = PAGES.PRODUCTS }}
        />
      </motion.div>
    );
  }

  const handleAddToCart = (product: any) => {
    addItem(product, 1);
    toast.success(t('wishlist.addToCart'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900">
          {t('wishlist.title')}
          <span className="text-base font-medium text-gray-400 mr-2">({items.length})</span>
        </h1>
        <Button variant="ghost" size="sm" rounded="xl" onClick={async () => {
          const text = `${t('wishlist.shareTitle')}: ${items.map((p) => `${p.name} - ${SITE_URL}/products/${p.slug}`).join('\n')}`;
          if (navigator.share) {
            await navigator.share({ title: t('wishlist.shareTitle'), text });
          } else {
            await navigator.clipboard.writeText(text);
            toast.success(t('wishlist.shareCopied'));
          }
        }}>
          <Share2 className="w-4 h-4" /> {t('common.share')}
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-soft"
          >
            <Link to={`${PAGES.PRODUCT_DETAILS.replace(':slug', product.slug)}`} className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gray-50">
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`${PAGES.PRODUCT_DETAILS.replace(':slug', product.slug)}`} className="text-sm font-bold font-cairo text-gray-900 hover:text-secondary transition-colors line-clamp-1">
                {product.name}
              </Link>
              <p className="text-sm font-bold font-cairo text-gray-900 mt-1">{formatPrice(product.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" rounded="xl" onClick={() => handleAddToCart(product)}>
                <ShoppingCart className="w-4 h-4" />
              </Button>
              <button onClick={() => { removeItem(product.id); toast.success(t('wishlist.removedFromWishlist')); }} className="p-2 rounded-xl text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors" aria-label={t('products.removeFromWishlist')}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
