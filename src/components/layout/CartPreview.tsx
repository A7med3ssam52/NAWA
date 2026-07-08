import { useState, useRef, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import { useCart } from '@/contexts';
import { PAGES, CURRENCY } from '@/constants';

export function CartPreview() {
  const { t } = useTranslation();
  const { items, itemsCount, subtotal, removeItem, updateQuantity } = useCart();
  const [open, setOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(true), 200);
  }, []);

  const hide = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(false), 300);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {/* Cart Button */}
      <Link
        to={PAGES.CART}
        className="relative p-1.5 sm:p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label={t('nav.cartLabel')}
      >
        <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
        {itemsCount > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-white text-[10px] font-bold shadow-lg shadow-secondary/30',
              itemsCount > 0 && 'animate-in zoom-in-50 duration-200'
            )}
          >
            {itemsCount > 99 ? '99+' : itemsCount}
          </span>
        )}
      </Link>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-soft-xl border border-gray-100 overflow-hidden z-50 animate-fade-in-up"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold font-cairo text-gray-900">
                  {t('cart.title')}
                </span>
                <span className="text-xs text-gray-400 font-cairo">
                  {t('nav.cartItems', { count: itemsCount })}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400 font-cairo">
                  {t('nav.cartEmpty')}
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {items.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium font-cairo text-gray-900 truncate">
                          {item.product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (item.quantity <= 1) {
                                  removeItem(item.id);
                                } else {
                                  updateQuantity(item.id, item.quantity - 1);
                                }
                              }}
                              className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                              aria-label={t('cart.decreaseQty')}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-medium text-gray-500 min-w-[16px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                updateQuantity(item.id, item.quantity + 1);
                              }}
                              className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                              aria-label={t('cart.increaseQty')}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-gray-900">
                            {item.product.price.toLocaleString('ar-EG')} {CURRENCY()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          removeItem(item.id);
                        }}
                        className="p-1 rounded-lg text-gray-300 hover:text-danger hover:bg-danger/5 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label={t('cart.deleteProduct', { name: item.product.name })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <>
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
                    <span className="text-sm font-bold font-cairo text-gray-900">
                      {t('cart.total')}
                    </span>
                    <span className="text-sm font-bold text-secondary">
                      {subtotal.toLocaleString('ar-EG')} {CURRENCY()}
                    </span>
                  </div>
                  <Link
                    to={PAGES.CART}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center w-full mt-3 py-2.5 rounded-xl bg-secondary text-white text-sm font-bold font-cairo hover:bg-secondary/90 transition-colors active:scale-[0.98]"
                  >
                    {t('nav.viewCart')}
                  </Link>
                </>
              )}
            </div>
        </div>
      )}
    </div>
  );
}
