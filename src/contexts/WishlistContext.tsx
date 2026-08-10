import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { mapProduct } from '@/lib/mappers';
import { useAuth } from '@/contexts/AuthContext';
import type { Product } from '@/types';

interface WishlistState {
  items: Product[];
}

type WishlistAction =
  | { type: 'TOGGLE'; payload: Product }
  | { type: 'REMOVE'; payload: string }
  | { type: 'SET'; payload: Product[] };

interface WishlistContextType {
  items: Product[];
  toggleItem: (product: Product) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  itemsCount: number;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'TOGGLE': {
      const exists = state.items.find((p) => p.id === action.payload.id);
      if (exists) return { items: state.items.filter((p) => p.id !== action.payload.id) };
      return { items: [action.payload, ...state.items] };
    }
    case 'REMOVE':
      return { items: state.items.filter((p) => p.id !== action.payload) };
    case 'SET':
      return { items: action.payload };
    default:
      return state;
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(wishlistReducer, { items: [] }, (initial) => {
    try {
      const saved = localStorage.getItem('wishlist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initial;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('wishlist', JSON.stringify(state));
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  const toggleItem = useCallback((product: Product) => {
    dispatch({ type: 'TOGGLE', payload: product });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', payload: id });
  }, []);

  const isInWishlist = useCallback((id: string) =>
    state.items.some((p) => p.id === id),
    [state.items]
  );

  const value = useMemo(() => ({
    items: state.items,
    toggleItem,
    removeItem,
    isInWishlist,
    itemsCount: state.items.length,
  }), [state.items, toggleItem, removeItem, isInWishlist]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
