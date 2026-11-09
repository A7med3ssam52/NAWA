const CART_KEY = "nawa_cart";
const CUSTOMER_KEY = "nawa_customer";

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

export function clearCartStorage() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    /* ignore */
  }
}

export function loadCustomer() {
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCustomer(customer) {
  try {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  } catch {
    /* ignore */
  }
}

export function clearCustomerStorage() {
  try {
    localStorage.removeItem(CUSTOMER_KEY);
  } catch {
    /* ignore */
  }
}