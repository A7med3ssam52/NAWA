import { useState, useCallback, useEffect } from 'react';
import { productService } from '@/services';
import type { Product } from '@/types';

const STORAGE_KEY = 'recently_viewed_ids';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const ids: string[] = JSON.parse(saved).slice(0, MAX_ITEMS);
        const resolved = await Promise.all(ids.map((id) => productService.getById(id)));
        if (!cancelled) setItems(resolved.filter((p): p is Product => p !== null));
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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