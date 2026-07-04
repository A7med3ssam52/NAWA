import { memo } from 'react';
import { useWishlist, useCart } from '@/contexts';
import { useCompare } from '@/contexts/CompareContext';
import { ProductCard } from './ProductCard';
import type { Product } from '@/types';

interface ProductCardWithContextProps {
  product: Product;
  index?: number;
}

export const ProductCardWithContext = memo(function ProductCardWithContext({
  product,
  index = 0,
}: ProductCardWithContextProps) {
  const { isInWishlist, toggleItem } = useWishlist();
  const { addItem } = useCart();
  const { isInCompare, addItem: addCompare, removeItem: removeCompare } = useCompare();

  return (
    <ProductCard
      product={product}
      index={index}
      isInWishlist={isInWishlist(product.id)}
      isInCompare={isInCompare(product.id)}
      onToggleWishlist={toggleItem}
      onAddToCart={(p) => addItem(p, 1)}
      onToggleCompare={(p) => isInCompare(p.id) ? removeCompare(p.id) : addCompare(p)}
    />
  );
});
