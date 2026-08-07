import { supabase } from '@/lib/supabase';
import { mapOrder } from '@/lib/mappers';
import type { Order } from '@/types';

export const orderService = {
  getById: async (orderId: string) => {
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (!error && data) return mapOrder(data);
    return null;
  },

  getUserOrders: async (userId: string) => {
    const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error && data) return (data as any[]).map(mapOrder);
    return [] as Order[];
  },

  create: async (data: Partial<Order>) => {
    const { data: orderRow, error } = await supabase.rpc('create_order', {
      p_user_id: data.userId || null,
      p_items: data.items || [],
      p_subtotal: data.subtotal || 0,
      p_shipping: data.shipping || 0,
      p_discount: data.discount || 0,
      p_total: data.total || 0,
      p_coupon_code: data.couponCode || null,
      p_payment_method: data.paymentMethod || 'cod',
      p_shipping_address: data.shippingAddress || null,
      p_notes: data.notes || '',
    });
    if (error) throw error;

    const order = mapOrder(orderRow);
    if (order.items.length > 0) {
      const rows = order.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_image: item.productImage || null,
        quantity: item.quantity,
        price: item.price,
      }));
      await supabase.from('order_items').insert(rows);
    }
    return order;
  },
};