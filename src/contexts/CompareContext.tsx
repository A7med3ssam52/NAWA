import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

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
        toast.error(`يمكن مقارنة ${MAX_COMPARE} منتجات كحد أقصى`);
        return prev;
      }
      toast.success('تمت إضافة المنتج للمقارنة');
      return [...prev, product];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success('تمت إزالة المنتج من المقارنة');
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
