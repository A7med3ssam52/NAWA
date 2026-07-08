import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import type { CartItem, Product, Coupon } from '@/types';
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from '@/constants';

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  couponCode: string;
  discount: number;
  notes: string;
  shippingCost: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'SET_COUPON'; payload: { coupon: Coupon | null; code: string; discount: number } }
  | { type: 'SET_NOTES'; payload: string }
  | { type: 'CLEAR_CART' };

interface CartContextType extends CartState {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setCoupon: (coupon: Coupon | null, code?: string, discount?: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  itemsCount: number;
}

const initialState: CartState = {
  items: [],
  coupon: null,
  couponCode: '',
  discount: 0,
  notes: '',
  shippingCost: SHIPPING_COST,
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (item) => item.product.id === action.payload.product.id
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          { id: crypto.randomUUID(), product: action.payload.product, quantity: action.payload.quantity },
        ],
      };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((item) => item.id !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };
    case 'SET_COUPON':
      return {
        ...state,
        coupon: action.payload.coupon,
        couponCode: action.payload.code,
        discount: action.payload.discount,
      };
    case 'SET_NOTES':
      return { ...state, notes: action.payload };
    case 'CLEAR_CART':
      return { ...initialState };
    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, (initial) => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initial;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('cart', JSON.stringify(state));
    }, 300);
    return () => clearTimeout(timer);
  }, [state]);

  const addItem = useCallback((product: Product, quantity = 1) =>
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } }), []);

  const removeItem = useCallback((id: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: id }), []);

  const updateQuantity = useCallback((id: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }), []);

  const setCoupon = useCallback((coupon: Coupon | null, code = '', discount = 0) =>
    dispatch({ type: 'SET_COUPON', payload: { coupon, code, discount } }), []);

  const setNotes = useCallback((notes: string) =>
    dispatch({ type: 'SET_NOTES', payload: notes }), []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);

  const subtotal = useMemo(() =>
    state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [state.items]
  );

  const shippingCost = useMemo(() =>
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST,
    [subtotal]
  );
  const total = useMemo(() => subtotal + shippingCost - state.discount, [subtotal, shippingCost, state.discount]);
  const itemsCount = useMemo(() => state.items.reduce((sum, item) => sum + item.quantity, 0), [state.items]);

  const value = useMemo(() => ({
    ...state,
    shippingCost,
    addItem,
    removeItem,
    updateQuantity,
    setCoupon,
    setNotes,
    clearCart,
    subtotal,
    total,
    itemsCount,
  }), [state, shippingCost, addItem, removeItem, updateQuantity, setCoupon, setNotes, clearCart, subtotal, total, itemsCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
