import { useState, useCallback } from 'react';
import { products } from '@/data';
import type { Product } from '@/types';

const STORAGE_KEY = 'recently_viewed_ids';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const ids: string[] = JSON.parse(saved);
      return ids
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined);
    } catch {
      return [];
    }
  });

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.map((p) => p.id)));
      return updated;
    });
  }, []);

  return { items, addItem };
}
