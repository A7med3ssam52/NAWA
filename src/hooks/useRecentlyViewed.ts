import { useState, useCallback } from 'react';
import type { Product } from '@/types';

const STORAGE_KEY = 'recently_viewed';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { items, addItem };
}
