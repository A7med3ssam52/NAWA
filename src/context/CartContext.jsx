import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  loadCart,
  saveCart,
  clearCartStorage,
  loadCustomer,
  saveCustomer,
  clearCustomerStorage,
} from "../utils/cartStorage";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadCart());
  const [customer, setCustomerState] = useState(() => loadCustomer());

  useEffect(() => {
    saveCart(items);
  }, [items]);

  useEffect(() => {
    if (customer) saveCustomer(customer);
  }, [customer]);

  const addItem = useCallback((product, size, qty = 1) => {
    setItems((prev) => {
      const key = `${product.id}::${size || ""}`;
      const existing = prev.find((it) => `${it.id}::${it.size || ""}` === key);
      if (existing) {
        return prev.map((it) =>
          `${it.id}::${it.size || ""}` === key
            ? { ...it, qty: it.qty + qty }
            : it
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          nameEn: product.nameEn,
          image: product.image,
          size: size || product.size || null,
          qty,
          price: product.price ?? null,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id, size) => {
    setItems((prev) =>
      prev.filter((it) => !(it.id === id && (it.size || "") === (size || "")))
    );
  }, []);

  const updateQty = useCallback((id, size, qty) => {
    const q = Math.max(1, Number(qty) || 1);
    setItems((prev) =>
      prev.map((it) =>
        it.id === id && (it.size || "") === (size || "") ? { ...it, qty: q } : it
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    clearCartStorage();
  }, []);

  const setCustomer = useCallback((c) => {
    setCustomerState(c);
    if (c) saveCustomer(c);
    else clearCustomerStorage();
  }, []);

  const clearCustomer = useCallback(() => {
    setCustomerState(null);
    clearCustomerStorage();
  }, []);

  const count = useMemo(
    () => items.reduce((sum, it) => sum + (it.qty || 1), 0),
    [items]
  );

  const hasPrice = items.some((it) => typeof it.price === "number");
  const subtotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (typeof it.price === "number") return sum + it.price * (it.qty || 1);
        return sum;
      }, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      customer,
      count,
      subtotal,
      hasPrice,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      setCustomer,
      clearCustomer,
    }),
    [items, customer, count, subtotal, hasPrice, addItem, removeItem, updateQty, clearCart, setCustomer, clearCustomer]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}