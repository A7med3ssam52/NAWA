import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { Product } from '@/types';
import toast from 'react-hot-toast';
import i18n from '@/i18n';

const MAX_COMPARE = 4;
const STORAGE_KEY = 'compare_items';

interface CompareContextType {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, 300);
    return () => clearTimeout(timer);
  }, [items]);

  const isInCompare = useCallback((id: string) => items.some((p) => p.id === id), [items]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;
      if (prev.length >= MAX_COMPARE) {
        toast.error(i18n.t('compare.maxItems', { count: MAX_COMPARE }));
        return prev;
      }
      toast.success(i18n.t('compare.addedToCompare'));
      return [...prev, product];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success(i18n.t('compare.removedFromCompare'));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(() => ({
    items, addItem, removeItem, clearAll, isInCompare,
  }), [items, addItem, removeItem, clearAll, isInCompare]);

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
};
