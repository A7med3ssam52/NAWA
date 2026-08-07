export const getCartItemTotal = (quantity: number, price: number) =>
  quantity * price;

export const getCartSubtotal = (items: { quantity: number; price: number }[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.price, 0);

export const getDiscountedPrice = (price: number, discount?: number | null) =>
  discount ? price - (price * discount) / 100 : price;