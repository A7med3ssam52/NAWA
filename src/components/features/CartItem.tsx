import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ImageOff } from 'lucide-react';
import { cn, formatPrice } from '@/utils';
import type { CartItem as CartItemType } from '@/types';
import { useCart } from '@/contexts';
import { PAGES } from '@/constants';
import { QuantitySelector } from '@/components/ui';

interface CartItemProps {
  item: CartItemType;
  index?: number;
}

export const CartItem = memo(function CartItem({ item, index = 0 }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();
  const [imgError, setImgError] = useState(false);

  const lineTotal = item.product.price * item.quantity;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-soft"
    >
      {/* Product Image */}
      <Link
        to={`${PAGES.PRODUCT_DETAILS.replace(':slug', item.product.slug)}`}
        className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50"
      >
        {!imgError && item.product.images[0] ? (
          <img
            src={item.product.images[0]}
            alt={item.product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageOff className="w-6 h-6" />
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        <Link
          to={`${PAGES.PRODUCT_DETAILS.replace(':slug', item.product.slug)}`}
          className="text-sm font-bold font-cairo text-gray-900 hover:text-secondary transition-colors line-clamp-1"
        >
          {item.product.name}
        </Link>

        {/* Variants */}
        {(item.selectedColor || item.selectedSize) && (
          <div className="flex items-center gap-3 mt-1">
            {item.selectedColor && (
              <span className="text-xs text-gray-500 font-cairo">
                اللون: {item.selectedColor}
              </span>
            )}
            {item.selectedSize && (
              <span className="text-xs text-gray-500 font-cairo">
                المقاس: {item.selectedSize}
              </span>
            )}
          </div>
        )}

        {/* Unit Price */}
        <p className="text-xs text-gray-400 font-cairo mt-1">
          {formatPrice(item.product.price)} لكل قطعة
        </p>

        {/* Mobile: Qty + Total + Remove */}
        <div className="flex sm:hidden items-center justify-between mt-3 gap-3">
          <QuantitySelector
            value={item.quantity}
            onChange={(qty) => updateQuantity(item.id, qty)}
            size="sm"
            max={item.product.stock}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-cairo text-gray-900">
              {formatPrice(lineTotal)}
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors"
              aria-label="إزالة المنتج"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: Quantity Selector */}
      <div className="hidden sm:block">
        <QuantitySelector
          value={item.quantity}
          onChange={(qty) => updateQuantity(item.id, qty)}
          size="md"
          max={item.product.stock}
        />
      </div>

      {/* Desktop: Line Total */}
      <div className="hidden sm:block text-center min-w-[100px]">
        <span className="text-sm font-bold font-cairo text-gray-900">
          {formatPrice(lineTotal)}
        </span>
      </div>

      {/* Desktop: Remove Button */}
      <button
        onClick={() => removeItem(item.id)}
        className="hidden sm:flex p-2 rounded-xl text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors"
        aria-label="إزالة المنتج"
      >
        <Trash2 className="w-4.5 h-4.5" />
      </button>
    </motion.div>
  );
});
