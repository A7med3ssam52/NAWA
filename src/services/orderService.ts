import { getOrderById, getUserOrders } from '@/data';
import type { Order } from '@/types';

export const orderService = {
  getById: (orderId: string) => getOrderById(orderId),

  getUserOrders: (userId: string) => getUserOrders(userId),

  create: (data: Partial<Order>) => {
    return {
      ...data,
      id: crypto.randomUUID(),
      orderNumber: `MAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tracking: [
        {
          status: 'pending',
          date: new Date().toISOString(),
          description: 'تم استلام الطلب',
          completed: true,
        },
      ],
    };
  },
};
