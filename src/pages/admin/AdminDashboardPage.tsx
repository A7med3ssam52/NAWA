import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, DollarSign, Users, 
  TrendingUp, TrendingDown, AlertTriangle, Clock,
  Star, ChevronLeft,
} from 'lucide-react';
import { formatPrice, formatDate, cn } from '@/utils';
import { getOrderStatusMap, SITE_NAME } from '@/constants';
import { useDashboard, useCategories } from '@/api';
import { Badge, Spinner, EmptyState } from '@/components/ui';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500', confirmed: 'bg-blue-500', processing: 'bg-indigo-500',
  shipped: 'bg-purple-500', delivered: 'bg-green-500', cancelled: 'bg-red-500',
};

function StatCard({ title, value, icon, trend, trendLabel, color }: {
  title: string; value: string | number; icon: React.ReactNode;
  trend?: 'up' | 'down'; trendLabel?: string; color: string;
}) {
  const displayValue = typeof value === 'number' ? value.toLocaleString('ar-EG') : value;
  const isLong = typeof displayValue === 'string' && displayValue.length > 12;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border p-4 lg:p-5 shadow-soft transition-all duration-300 hover:shadow-soft-lg bg-white border-gray-100"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs lg:text-sm font-medium text-gray-500 font-cairo truncate">{title}</p>
          <p className={cn(
            'font-bold font-cairo text-gray-900 break-words',
            isLong ? 'text-base sm:text-lg lg:text-xl' : 'text-lg sm:text-xl lg:text-2xl',
          )}>
            {displayValue}
          </p>
          {trend && trendLabel && (
            <div className="flex items-center gap-1 text-[10px] lg:text-xs font-medium font-cairo">
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-danger" />
              )}
              <span className={trend === 'up' ? 'text-success' : 'text-danger'}>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={cn('p-2.5 lg:p-3 rounded-xl lg:rounded-2xl shrink-0', color)}>{icon}</div>
      </div>
    </motion.div>
  );
}

function ChartBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <span className="text-[10px] lg:text-xs text-gray-500 font-cairo w-14 lg:w-24 shrink-0 text-left truncate">{label}</span>
      <div className="flex-1 h-5 lg:h-7 bg-gray-100 rounded-lg lg:rounded-xl overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-lg lg:rounded-xl flex items-center justify-end px-1 lg:px-2', color)}
        >
          <span className="text-[8px] lg:text-[10px] font-bold text-white font-cairo leading-none">{formatPrice(value)}</span>
        </motion.div>
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const { data: categoriesData } = useCategories();
  const allCategories = categoriesData || [];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <EmptyState title="تعذر تحميل بيانات لوحة التحكم" description="حدث خطأ أثناء جلب البيانات من قاعدة البيانات" />
      </div>
    );
  }

  const stats = data.stats;
  const monthlyData = data.monthlyRevenue.reduce((acc: Record<string, number>, row) => {
    acc[row.month_key] = Number(row.revenue) || 0;
    return acc;
  }, {} as Record<string, number>);
  const maxRevenue = Math.max(...(data.monthlyRevenue.map((r) => Number(r.revenue) || 0)), 1);
  const statusCounts: Record<string, number> = {};
  data.orderStatuses.forEach((s) => { statusCounts[s.status] = s.count; });
  const recentOrders = data.recentOrders;
  const topProducts = data.topProducts;

  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return { label: `${months[d.getMonth()]}`, key: `${d.getFullYear()}-${m}` };
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-lg lg:text-2xl font-bold font-cairo text-gray-900 truncate">لوحة التحكم</h1>
          <p className="text-xs lg:text-sm text-gray-500 font-cairo mt-0.5 lg:mt-1 truncate">{SITE_NAME()} - نظرة عامة على المتجر</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
        <StatCard title="إجمالي المنتجات" value={stats.totalProducts} icon={<Package className="w-5 h-5 text-white" />} color="from-blue-500 to-blue-600" />
        <StatCard title="إجمالي الطلبات" value={stats.totalOrders} icon={<ShoppingCart className="w-5 h-5 text-white" />} color="from-emerald-500 to-emerald-600" />
        <StatCard title="الإيرادات" value={formatPrice(stats.totalRevenue)} icon={<DollarSign className="w-5 h-5 text-white" />} trend="up" trendLabel={`${stats.totalOrders} طلب`} color="from-violet-500 to-violet-600" />
        <StatCard title="المستخدمين" value={stats.totalUsers} icon={<Users className="w-5 h-5 text-white" />} color="from-orange-500 to-orange-600" />
        <StatCard title="الطلبات المعلقة" value={stats.pendingOrders} icon={<Clock className="w-5 h-5 text-white" />} trend={stats.pendingOrders > 0 ? 'up' : 'down'} trendLabel={stats.pendingOrders > 0 ? 'بحاجة للمراجعة' : 'لا توجد'} color="from-yellow-500 to-yellow-600" />
        <StatCard title="مخزون منخفض" value={stats.lowStockProducts} icon={<AlertTriangle className="w-5 h-5 text-white" />} trend={stats.lowStockProducts > 0 ? 'up' : 'down'} trendLabel={stats.lowStockProducts > 0 ? 'أقل من 10' : 'ممتاز'} color="from-rose-500 to-rose-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-soft p-4 lg:p-6">
          <h2 className="text-base lg:text-lg font-bold font-cairo text-gray-900 mb-4 lg:mb-6">الإيرادات الشهرية</h2>
          <div className="space-y-2 lg:space-y-3">
            {last6Months.map((m) => (
              <ChartBar key={m.key} label={m.label} value={monthlyData[m.key] || 0} max={maxRevenue} color="bg-secondary" />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 lg:p-6">
          <h2 className="text-base lg:text-lg font-bold font-cairo text-gray-900 mb-4 lg:mb-6">حالات الطلبات</h2>
          <div className="space-y-3 lg:space-y-4">
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => {
              const count = statusCounts[s] || 0;
              const total = stats.totalOrders || 1;
              const pct = Math.round((count / total) * 100);
              const info = getOrderStatusMap()[s] || { label: s, color: 'text-gray-500' };
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full', statusColors[s])} />
                      <span className="text-sm font-medium font-cairo text-gray-700">{info.label}</span>
                    </div>
                    <span className="text-sm font-bold font-cairo text-gray-900">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', statusColors[s])}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h2 className="text-base lg:text-lg font-bold font-cairo text-gray-900">التصنيفات</h2>
            <Link to="/admin/categories" className="text-xs text-secondary hover:underline font-cairo font-medium flex items-center gap-1">
              إدارة <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2 lg:space-y-2.5">
            {allCategories.slice(0, 6).map((cat) => {
              const maxC = Math.max(...allCategories.map((c) => c.productsCount), 1);
              return (
                <div key={cat.id} className="flex items-center gap-2 lg:gap-3">
                  <span className="text-xs text-gray-500 font-cairo w-16 lg:w-20 shrink-0 text-left truncate">{cat.name}</span>
                  <div className="flex-1 h-4 lg:h-5 bg-gray-100 rounded-lg overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.productsCount / maxC) * 100}%` }} transition={{ duration: 0.8 }}
                      className="h-full rounded-lg bg-accent flex items-center justify-end px-1.5"
                    >
                      <span className="text-[9px] font-bold text-white font-cairo">{cat.productsCount}</span>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h2 className="text-base lg:text-lg font-bold font-cairo text-gray-900">آخر الطلبات</h2>
            <Link to="/admin/orders" className="text-xs text-secondary hover:underline font-cairo font-medium flex items-center gap-1">
              عرض الكل <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1 lg:space-y-2">
            {recentOrders.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-2 lg:p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1 ml-2">
                  <p className="text-xs lg:text-sm font-semibold font-cairo text-gray-900 truncate">{order.order_number}</p>
                  <p className="text-[10px] lg:text-xs text-gray-400 font-cairo">{formatDate(order.created_at)}</p>
                </div>
                <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : order.status === 'pending' ? 'warning' : 'info'} size="sm">
                  {getOrderStatusMap()[order.status]?.label || order.status}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h2 className="text-base lg:text-lg font-bold font-cairo text-gray-900">أفضل المنتجات</h2>
            <Link to="/admin/products" className="text-xs text-secondary hover:underline font-cairo font-medium flex items-center gap-1">
              إدارة <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1 lg:space-y-2">
            {topProducts.slice(0, 5).map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2 lg:gap-3 p-2 lg:p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                  <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs lg:text-sm font-semibold font-cairo text-gray-900 truncate">{product.name}</p>
                  <p className="text-[10px] lg:text-xs text-gray-400 font-cairo">{formatPrice(product.price)}</p>
                </div>
                <div className="flex items-center gap-0.5 lg:gap-1 shrink-0">
                  <Star className="w-2.5 h-2.5 lg:w-3 lg:h-3 fill-accent text-accent" />
                  <span className="text-[10px] lg:text-xs font-bold text-gray-900">{product.rating}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
