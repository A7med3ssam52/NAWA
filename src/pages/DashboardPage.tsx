import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, DollarSign, Users, BarChart3,
  TrendingUp, TrendingDown, Tag, AlertTriangle, Layers,
  Percent, Eye, RefreshCw, Archive, Clock, CheckCircle,
  Truck, XCircle, ArrowUpRight, Star,
} from 'lucide-react';
import { getDashboardStats, categories, brands, coupons } from '@/data';
import { formatPrice, formatDate, cn } from '@/utils';
import { ORDER_STATUS_MAP } from '@/constants';
import { Card } from '@/components/ui';
import type { DashboardStats } from '@/data';
import type { Order, Product } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-indigo-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  confirmed: <CheckCircle className="w-3.5 h-3.5" />,
  processing: <RefreshCw className="w-3.5 h-3.5" />,
  shipped: <Truck className="w-3.5 h-3.5" />,
  delivered: <CheckCircle className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
};

function StatCard({ title, value, icon, trend, trendLabel, color }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendLabel?: string;
  color: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 shadow-soft transition-all duration-300 hover:shadow-soft-lg animate-fade-in-up',
        'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 dark:text-dark-muted font-cairo">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 dark:text-dark-text">{typeof value === 'number' ? value.toLocaleString('ar-EG') : value}</p>
          {trend && trendLabel && (
            <div className="flex items-center gap-1 text-xs font-medium font-cairo">
              {trend === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-danger" />
              )}
              <span className={trend === 'up' ? 'text-success' : 'text-danger'}>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-2xl bg-gradient-to-br', color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-dark-muted font-cairo w-28 shrink-0 text-left">{label}</span>
      <div className="flex-1 h-8 bg-gray-100 dark:bg-dark-border rounded-xl overflow-hidden relative">
        <div
          className={cn('h-full rounded-xl flex items-center justify-end px-2 transition-all duration-1000 ease-out', color)}
          style={{ width: `${pct}%` }}
        >
          <span className="text-xs font-bold text-white font-cairo">{value.toLocaleString('ar-EG')}</span>
        </div>
      </div>
    </div>
  );
}

function RecentOrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-cairo">
        <thead>
          <tr className="border-b border-gray-100 dark:border-dark-border">
            <th className="text-right py-3 px-2 text-gray-500 dark:text-dark-muted font-medium">رقم الطلب</th>
            <th className="text-right py-3 px-2 text-gray-500 dark:text-dark-muted font-medium">التاريخ</th>
            <th className="text-right py-3 px-2 text-gray-500 dark:text-dark-muted font-medium">المبلغ</th>
            <th className="text-right py-3 px-2 text-gray-500 dark:text-dark-muted font-medium">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, i) => {
            const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: 'text-gray-500' };
            return (
              <tr
                key={order.id}
                className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors"
              >
                <td className="py-3 px-2">
                  <span className="font-semibold text-gray-900 dark:text-dark-text">{order.orderNumber}</span>
                </td>
                <td className="py-3 px-2 text-gray-500 dark:text-dark-muted">{formatDate(order.createdAt)}</td>
                <td className="py-3 px-2 font-semibold text-gray-900 dark:text-dark-text">{formatPrice(order.total)}</td>
                <td className="py-3 px-2">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-cairo', statusInfo.color)}>
                    {statusIcons[order.status]}
                    {statusInfo.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TopProductsTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-cairo">
        <thead>
          <tr className="border-b border-gray-100 dark:border-dark-border">
            <th className="text-right py-3 px-2 text-gray-500 dark:text-dark-muted font-medium">المنتج</th>
            <th className="text-right py-3 px-2 text-gray-500 dark:text-dark-muted font-medium">السعر</th>
            <th className="text-right py-3 px-2 text-gray-500 dark:text-dark-muted font-medium">المبيعات</th>
            <th className="text-right py-3 px-2 text-gray-500 dark:text-dark-muted font-medium">التقييم</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, i) => (
            <tr
              key={product.id}
              className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors"
            >
              <td className="py-3 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50 dark:bg-dark-border/50 shrink-0">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-dark-text truncate max-w-[180px] block">{product.name}</span>
                </div>
              </td>
              <td className="py-3 px-2 font-semibold text-gray-900 dark:text-dark-text">{formatPrice(product.price)}</td>
              <td className="py-3 px-2 text-gray-500 dark:text-dark-muted">{product.reviewsCount.toLocaleString('ar-EG')}</td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                  <span className="font-semibold text-gray-900 dark:text-dark-text">{product.rating}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardPage() {
  const stats: DashboardStats = useMemo(() => getDashboardStats(), []);

  const maxRevenue = Math.max(...stats.monthlyRevenue.map((m) => m.revenue), 1);
  const maxOrders = Math.max(...stats.monthlyRevenue.map((m) => m.orders), 1);

  return (
    <div dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-gray-900 dark:text-dark-text">لوحة التحكم</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo mt-1">نظرة عامة على أداء المتجر</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-muted font-cairo">
          <Clock className="w-4 h-4" />
          <span>آخر تحديث: {formatDate(new Date().toISOString())}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="إجمالي المنتجات" value={stats.totalProducts} icon={<Package className="w-5 h-5 text-white" />} color="from-blue-500 to-blue-600" />
        <StatCard title="إجمالي الطلبات" value={stats.totalOrders} icon={<ShoppingCart className="w-5 h-5 text-white" />} color="from-emerald-500 to-emerald-600" />
        <StatCard title="الإيرادات" value={formatPrice(stats.totalRevenue)} icon={<DollarSign className="w-5 h-5 text-white" />} trend="up" trendLabel={`${stats.totalOrders} طلب`} color="from-violet-500 to-violet-600" />
        <StatCard title="المستخدمين" value={stats.totalUsers} icon={<Users className="w-5 h-5 text-white" />} color="from-orange-500 to-orange-600" />
        <StatCard title="الطلبات المعلقة" value={stats.pendingOrders} icon={<Clock className="w-5 h-5 text-white" />} trend={stats.pendingOrders > 0 ? 'up' : 'down'} trendLabel={stats.pendingOrders > 0 ? 'بحاجة للمراجعة' : 'لا توجد'} color="from-yellow-500 to-yellow-600" />
        <StatCard title="منتجات منخفضة" value={stats.lowStockProducts} icon={<AlertTriangle className="w-5 h-5 text-white" />} trend={stats.lowStockProducts > 0 ? 'up' : 'down'} trendLabel={stats.lowStockProducts > 0 ? 'أقل من 10 قطع' : 'مخزون كاف'} color="from-rose-500 to-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text">الإيرادات الشهرية</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-dark-muted font-cairo bg-gray-100 dark:bg-dark-border px-3 py-1 rounded-full">
                شهري
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {stats.monthlyRevenue.length > 0 ? (
              stats.monthlyRevenue.map((m) => (
                <ChartBar
                  key={m.month}
                  label={m.month}
                  value={m.revenue}
                  max={maxRevenue}
                  color="bg-gradient-to-l from-secondary to-blue-400"
                />
              ))
            ) : (
              <p className="text-sm text-gray-400 dark:text-dark-muted font-cairo text-center py-8">لا توجد بيانات</p>
            )}
          </div>
        </Card>

        {/* Order Status Distribution */}
        <Card padding="lg">
          <h2 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text mb-6">حالات الطلبات</h2>
          <div className="space-y-4">
            {stats.orderStatusDistribution.map((item) => {
              const total = stats.totalOrders || 1;
              const pct = Math.round((item.count / total) * 100);
              const statusInfo = ORDER_STATUS_MAP[item.status] || { label: item.status, color: 'text-gray-500' };
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2.5 h-2.5 rounded-full', statusColors[item.status])} />
                      <span className="text-sm font-medium font-cairo text-gray-700 dark:text-dark-muted">{statusInfo.label}</span>
                    </div>
                    <span className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-1000 ease-out', statusColors[item.status])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Category Distribution */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text">التصنيفات</h2>
            <Link to="/categories" className="text-xs text-secondary hover:underline font-cairo font-medium">عرض الكل</Link>
          </div>
          <div className="space-y-3">
            {stats.categoryDistribution.map((cat) => {
              const maxCount = Math.max(...stats.categoryDistribution.map((c) => c.count), 1);
              const pct = (cat.count / maxCount) * 100;
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-dark-muted font-cairo w-24 shrink-0 text-left">{cat.name}</span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-dark-border rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg bg-gradient-to-l from-accent to-orange-400 flex items-center justify-end px-2 transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%` }}
                    >
                      <span className="text-[10px] font-bold text-white font-cairo">{cat.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text">آخر الطلبات</h2>
            <Link to="/profile/orders" className="text-xs text-secondary hover:underline font-cairo font-medium">عرض الكل</Link>
          </div>
          {stats.recentOrders.length > 0 ? (
            <RecentOrdersTable orders={stats.recentOrders} />
          ) : (
            <p className="text-sm text-gray-400 dark:text-dark-muted font-cairo text-center py-8">لا توجد طلبات</p>
          )}
        </Card>

        {/* Top Products */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold font-cairo text-gray-900 dark:text-dark-text">الأكثر مبيعاً</h2>
            <Link to="/products" className="text-xs text-secondary hover:underline font-cairo font-medium">عرض الكل</Link>
          </div>
          {stats.topProducts.length > 0 ? (
            <TopProductsTable products={stats.topProducts} />
          ) : (
            <p className="text-sm text-gray-400 dark:text-dark-muted font-cairo text-center py-8">لا توجد منتجات</p>
          )}
        </Card>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-500/20">
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-dark-muted font-cairo">الماركات</span>
          </div>
          <p className="text-xl font-bold font-cairo text-gray-900 dark:text-dark-text">{stats.totalBrands}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {brands.slice(0, 4).map((b) => (
              <span key={b.id} className="text-[10px] bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-muted px-2 py-0.5 rounded-full font-cairo">{b.name}</span>
            ))}
            {brands.length > 4 && <span className="text-[10px] text-gray-400 dark:text-dark-muted font-cairo">+{brands.length - 4}</span>}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-dark-muted font-cairo">التصنيفات</span>
          </div>
          <p className="text-xl font-bold font-cairo text-gray-900 dark:text-dark-text">{stats.totalCategories}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {categories.slice(0, 4).map((c) => (
              <span key={c.id} className="text-[10px] bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-muted px-2 py-0.5 rounded-full font-cairo">{c.name}</span>
            ))}
            {categories.length > 4 && <span className="text-[10px] text-gray-400 dark:text-dark-muted font-cairo">+{categories.length - 4}</span>}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/20">
              <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-dark-muted font-cairo">الكوبونات</span>
          </div>
          <p className="text-xl font-bold font-cairo text-gray-900 dark:text-dark-text">{stats.totalCoupons}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {coupons.slice(0, 3).map((c) => (
              <span key={c.id} className="text-[10px] bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-muted px-2 py-0.5 rounded-full font-cairo">{c.code}</span>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-4 shadow-soft">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-dark-muted font-cairo">مخزون منخفض</span>
          </div>
          <p className="text-xl font-bold font-cairo text-gray-900 dark:text-dark-text">{stats.lowStockProducts}</p>
          <p className="text-[10px] text-gray-400 dark:text-dark-muted font-cairo mt-1">منتجات أقل من 10 قطع في المخزون</p>
        </div>
      </div>
    </div>
  );
}
