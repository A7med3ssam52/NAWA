import { memo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, BarChart3 } from 'lucide-react';
import { cn, formatPrice, formatDiscount } from '@/utils';
import type { Product } from '@/types';
import { useCategories } from '@/api';
import { PAGES } from '@/constants';
import { Badge, Rating, Button, FadeInView } from '@/components/ui';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  index?: number;
  isInWishlist?: boolean;
  isInCompare?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onToggleCompare?: (product: Product) => void;
}

export const ProductCard = memo(function ProductCard({
  product,
  index = 0,
  isInWishlist: inWishlist = false,
  isInCompare: inCompare = false,
  onToggleWishlist,
  onAddToCart,
  onToggleCompare,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { data: categories } = useCategories();

  const mainImage = product.images[0];
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    setAddingToCart(true);
    await new Promise((r) => setTimeout(r, 400));
    onAddToCart?.(product);
    toast.success('تمت إضافة المنتج إلى السلة');
    setAddingToCart(false);
  }, [product, isOutOfStock, onAddToCart]);

  const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleWishlist?.(product);
    toast.success(inWishlist ? 'تمت إزالة المنتج من المفضلة' : 'تمت إضافة المنتج إلى المفضلة');
  }, [product, inWishlist, onToggleWishlist]);

  const handleToggleCompare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleCompare?.(product);
  }, [product, onToggleCompare]);

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-soft hover:shadow-soft-lg transition-shadow duration-300 overflow-hidden will-change-transform hover:-translate-y-1 transition-transform duration-300">
      <Link to={`${PAGES.PRODUCT_DETAILS.replace(':slug', product.slug)}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {!imageLoaded && !imgError && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          )}
          {!imgError ? (
            <img
              src={mainImage}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImgError(true)}
              className={cn(
                'w-full h-full object-cover transition-all duration-500 group-hover:scale-110',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Eye className="w-12 h-12" />
            </div>
          )}

          {product.discount && product.discount > 0 && (
            <Badge variant="danger" size="sm" className="absolute top-3 right-3 font-semibold shadow-lg">
              {formatDiscount(product.discount)}
            </Badge>
          )}

          {product.isNew && !product.discount && (
            <Badge variant="success" size="sm" className="absolute top-3 right-3 font-semibold shadow-lg">
              جديد
            </Badge>
          )}

          <Badge variant="secondary" size="sm" className="absolute top-3 left-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            {categories?.find((c) => c.id === product.category)?.name}
          </Badge>

          <button
            onClick={handleToggleWishlist}
            className={cn(
              'absolute bottom-3 left-3 p-2 rounded-xl backdrop-blur-sm transition-all duration-200',
              inWishlist
                ? 'bg-danger/20 text-danger'
                : 'bg-white/80 text-gray-400 hover:text-danger hover:bg-danger/10 opacity-100 md:opacity-0 md:group-hover:opacity-100'
            )}
            aria-label={inWishlist ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          >
            <Heart className={cn('w-4.5 h-4.5 transition-all duration-200', inWishlist && 'fill-danger scale-110')} />
          </button>

          <button
            onClick={handleToggleCompare}
            className={cn(
              'absolute top-3 right-3 p-2 rounded-xl backdrop-blur-sm transition-all duration-200',
              inCompare
                ? 'bg-secondary/20 text-secondary'
                : 'bg-white/80 text-gray-400 hover:text-secondary hover:bg-secondary/10'
            )}
            aria-label={inCompare ? 'إزالة من المقارنة' : 'إضافة إلى المقارنة'}
          >
            <BarChart3 className="w-4.5 h-4.5" />
          </button>

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-white text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold font-cairo shadow-lg">
                نفد من المخزون
              </span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="text-sm font-semibold font-cairo text-gray-900 line-clamp-2 group-hover:text-secondary transition-colors leading-relaxed min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="flex items-center gap-1">
            <Rating value={product.rating} count={product.reviewsCount} size="sm" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold font-cairo text-gray-900">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && product.oldPrice > product.price && (
                <span className="text-xs text-gray-400 line-through font-cairo">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            variant={isOutOfStock ? 'outline' : 'primary'}
            size="sm"
            fullWidth
            rounded="xl"
            loading={addingToCart}
            disabled={isOutOfStock}
            className="mt-2"
          >
            {isOutOfStock ? 'غير متوفر' : <><ShoppingCart className="w-4 h-4" /> أضف إلى السلة</>}
          </Button>
        </div>
      </Link>
    </div>
  );
});
