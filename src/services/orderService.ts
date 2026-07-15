import { supabase } from '@/lib/supabase';
import { getOrderById, getUserOrders, orders, setOrdersData } from '@/data';
import type { Order } from '@/types';

export const orderService = {
  getById: (orderId: string) => getOrderById(orderId),

  getUserOrders: (userId: string) => getUserOrders(userId),

  create: async (data: Partial<Order>) => {
    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      userId: data.userId,
      orderNumber: `MAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      status: 'pending' as const,
      items: data.items || [],
      total: data.total || 0,
      subtotal: data.subtotal || 0,
      shipping: data.shipping || 0,
      discount: data.discount || 0,
      couponCode: data.couponCode,
      shippingAddress: data.shippingAddress || { id: '', label: '', fullName: '', phone: '', street: '', city: '', state: '', isDefault: false },
      paymentMethod: data.paymentMethod || '',
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
      tracking: [
        { status: 'pending', date: now, description: 'تم استلام الطلب', completed: true },
      ],
    };
    const dbRow = {
      id: order.id,
      user_id: order.userId,
      order_number: order.orderNumber,
      status: order.status,
      items: order.items,
      total: order.total,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      coupon_code: order.couponCode,
      shipping_address: order.shippingAddress,
      payment_method: order.paymentMethod,
      notes: order.notes,
      created_at: now,
      updated_at: now,
      tracking: order.tracking,
    };
    await supabase.from('orders').insert(dbRow);
    setOrdersData([...orders, order]);
    return order;
  },
};
