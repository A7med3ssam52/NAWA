import type { Order } from '@/types';

const LOCAL_ORDERS_KEY = 'nawa_orders';

function getStoredOrders(): Order[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredOrders(orders: Order[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {}
}

export const orderService = {
  getById: async (orderId: string): Promise<Order | null> => {
    const orders = getStoredOrders();
    return orders.find(o => o.id === orderId || o.orderNumber === orderId) || null;
  },

  getUserOrders: async (userId: string): Promise<Order[]> => {
    const orders = getStoredOrders();
    return orders.filter(o => o.userId === userId || !userId);
  },

  create: async (data: Partial<Order>): Promise<Order> => {
    const now = new Date().toISOString();
    const orderNumber = `NW-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      userId: data.userId || 'guest-user',
      orderNumber,
      status: 'pending',
      items: data.items || [],
      total: data.total || 0,
      subtotal: data.subtotal || 0,
      shipping: data.shipping || 0,
      discount: data.discount || 0,
      couponCode: data.couponCode,
      shippingAddress: data.shippingAddress || {
        id: 'addr-1',
        label: 'المنزل',
        fullName: 'عميل نوى',
        phone: '+201000000000',
        street: 'شارع التجاري',
        city: 'القاهرة',
        state: 'القاهرة',
        isDefault: true,
      },
      paymentMethod: data.paymentMethod || 'cod',
      notes: data.notes,
      paymentReceiptUrl: data.paymentReceiptUrl,
      paymentPhone: data.paymentPhone,
      createdAt: now,
      updatedAt: now,
      tracking: [
        {
          status: 'pending',
          date: now,
          description: 'تم إرسال الطلب بنجاح وهو قيد المراجعة',
          completed: true,
        },
      ],
    };

    const existing = getStoredOrders();
    existing.unshift(newOrder);
    saveStoredOrders(existing);

    return newOrder;
  },
};