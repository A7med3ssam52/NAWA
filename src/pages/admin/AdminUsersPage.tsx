import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Eye, Mail, Phone, MapPin, ShoppingBag, Heart, X,
} from 'lucide-react';
import { cn } from '@/utils';
import { adminService } from '@/services';
import { Input, Modal, Badge, EmptyState, Spinner } from '@/components/ui';
import type { User } from '@/types';

interface UserWithOrders extends User {
  ordersCount: number;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewModal, setViewModal] = useState<UserWithOrders | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const data = adminService.getUsers(search || undefined) as UserWithOrders[];
    setUsers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">المستخدمين</h1>
        <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo mt-1">عرض بيانات المستخدمين</p>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={<Mail className="w-16 h-16" />} title="لا يوجد مستخدمين" description="لا توجد نتائج للبحث" />
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الصورة</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الاسم</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">البريد</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الهاتف</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الطلبات</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <motion.tr key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-50 dark:bg-dark-border/50">
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm font-semibold font-cairo text-gray-900 dark:text-dark-text">{user.name}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-cairo text-gray-500 dark:text-dark-muted">{user.email}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-cairo text-gray-500 dark:text-dark-muted">{user.phone || '—'}</span></td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">{user.ordersCount}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setViewModal(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="بيانات المستخدم" size="lg">
        {viewModal && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-50 dark:bg-dark-border/50">
                <img src={viewModal.avatar} alt={viewModal.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text">{viewModal.name}</h3>
                <p className="text-xs text-gray-500 dark:text-dark-muted font-cairo">{viewModal.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-dark-border/30 rounded-xl p-4 text-center space-y-2">
                <ShoppingBag className="w-5 h-5 text-secondary mx-auto" />
                <p className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">{viewModal.ordersCount}</p>
                <p className="text-xs font-cairo text-gray-500 dark:text-dark-muted">إجمالي الطلبات</p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-border/30 rounded-xl p-4 text-center space-y-2">
                <MapPin className="w-5 h-5 text-accent mx-auto" />
                <p className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">{viewModal.addresses.length}</p>
                <p className="text-xs font-cairo text-gray-500 dark:text-dark-muted">العناوين المسجلة</p>
              </div>
              <div className="bg-gray-50 dark:bg-dark-border/30 rounded-xl p-4 text-center space-y-2">
                <Heart className="w-5 h-5 text-danger mx-auto" />
                <p className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">{viewModal.wishlist.length}</p>
                <p className="text-xs font-cairo text-gray-500 dark:text-dark-muted">قائمة الرغبات</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold font-cairo text-gray-900 dark:text-dark-text">معلومات الاتصال</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm font-cairo text-gray-600 dark:text-dark-muted">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{viewModal.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-cairo text-gray-600 dark:text-dark-muted">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{viewModal.phone || 'غير متاح'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
