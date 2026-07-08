import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Package, Search, X, Eye, Trash2, ShoppingBag, AlertTriangle,
  CheckCircle, MapPin, CreditCard, Phone, User, Clock,
} from 'lucide-react';
import { formatPrice, formatDate, formatDateTime, cn, getPaymentMethodLabel } from '@/utils';
import { getOrderStatusMap } from '@/constants';
import { adminService } from '@/services';
import { Card, Button, Input, Modal, Badge, EmptyState, Spinner, Pagination, toast } from '@/components/ui';
import { TrackingTimeline } from '@/components/features/TrackingTimeline';
import type { Order } from '@/types';

const PAGE_SIZE = 10;

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'delivered': return 'success';
    case 'cancelled': return 'danger';
    case 'pending': return 'warning';
    default: return 'info';
  }
};

const statusFlow: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function AdminOrdersPage() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const STATUS_TABS = useMemo(() => [
    { value: '', label: t('orders.allOrders') },
    { value: 'pending', label: t('orders.pending') },
    { value: 'confirmed', label: t('orders.confirmed') },
    { value: 'processing', label: t('orders.processing') },
    { value: 'shipped', label: t('orders.shipped') },
    { value: 'delivered', label: t('orders.delivered') },
    { value: 'cancelled', label: t('orders.cancelled') },
  ], [t]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const result = adminService.getOrders(
      statusFilter || undefined,
      searchQuery || undefined,
      page,
      PAGE_SIZE,
    );
    setOrders(result.items);
    setTotal(result.total);
    setTotalPages(result.totalPages);
    setLoading(false);
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const openOrderModal = async (orderId: string) => {
    const order = adminService.getOrder(orderId);
    if (order) {
      setSelectedOrder(order);
      setModalOpen(true);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    await new Promise((r) => setTimeout(r, 500));
    const updated = adminService.updateOrderStatus(orderId, newStatus as Order['status']);
    if (updated) {
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      toast.success(t('orders.statusUpdated', { status: getOrderStatusMap()[newStatus]?.label || newStatus }));
    }
    setUpdating(false);
  };

  const handleDelete = async (orderId: string) => {
    await new Promise((r) => setTimeout(r, 300));
    const success = adminService.deleteOrder(orderId);
    if (success) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setTotal((prev) => prev - 1);
      setDeleteConfirm(null);
      toast.success(t('orders.orderDeleted'));
    }
  };

  const stats = useMemo(() => {
    const all = adminService.getOrders();
    return {
      total: all.total,
      pending: all.items.filter((o) => o.status === 'pending').length,
      processing: all.items.filter((o) => o.status === 'processing').length,
      cancelled: all.items.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 lg:p-6 space-y-6"
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">{t('admin.ordersManagement')}</h1>
        <p className="text-sm text-gray-500 font-cairo mt-1">{t('admin.ordersSubtitle')}</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('orders.totalOrders'), value: stats.total, icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
          { label: t('orders.pending'), value: stats.pending, icon: Clock, color: 'from-yellow-500 to-yellow-600' },
          { label: t('orders.processing'), value: stats.processing, icon: Package, color: 'from-indigo-500 to-indigo-600' },
          { label: t('orders.cancelledOrders'), value: stats.cancelled, icon: X, color: 'from-red-500 to-red-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl border p-4 shadow-soft bg-white border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 font-cairo">{stat.label}</p>
                <p className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={cn('p-2.5 rounded-xl bg-gradient-to-br', stat.color)}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('orders.searchOrder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </form>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-cairo font-medium whitespace-nowrap transition-all duration-200',
                  statusFilter === tab.value
                    ? 'bg-secondary text-white shadow-md shadow-secondary/20'
                    : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Orders Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="xl" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-12 h-12" />}
          title={t('orders.noOrders')}
          description={searchQuery ? t('orders.noSearchResults') : t('orders.noOrdersFound')}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-right px-4 py-3 text-xs font-bold font-cairo text-gray-500">{t('orders.orderNumber')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold font-cairo text-gray-500">{t('admin.customer')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold font-cairo text-gray-500">{t('admin.date')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold font-cairo text-gray-500">{t('admin.amount')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold font-cairo text-gray-500">{t('common.status')}</th>
                      <th className="text-left px-4 py-3 text-xs font-bold font-cairo text-gray-500">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {orders.map((order, i) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-semibold font-cairo text-gray-900">{order.orderNumber}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-cairo text-gray-700">
                              {order.shippingAddress?.fullName || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-cairo text-gray-500">{formatDate(order.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-bold font-cairo text-gray-900">{formatPrice(order.total)}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={statusBadgeVariant(order.status)} size="sm">
                              {getOrderStatusMap()[order.status]?.label || order.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openOrderModal(order.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(order.id)}
                                className="text-danger hover:text-danger"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            <AnimatePresence mode="popLayout">
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div role="button" tabIndex={0} onClick={() => openOrderModal(order.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openOrderModal(order.id); }}>
                    <Card padding="md" className="cursor-pointer hover:shadow-soft-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold font-cairo text-gray-900">{order.orderNumber}</span>
                      <Badge variant={statusBadgeVariant(order.status)} size="sm">
                        {getOrderStatusMap()[order.status]?.label || order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 font-cairo">
                        {order.shippingAddress?.fullName || '—'}
                      </span>
                      <span className="font-bold font-cairo text-gray-900">{formatPrice(order.total)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400 font-cairo">{formatDate(order.createdAt)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(order.id);
                        }}
                        className="text-danger hover:text-danger/80 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-cairo">
              {t('orders.totalCount', { count: total })}
            </p>
            {totalPages > 1 && (
              <div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                    onPageChange={(p: number) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Order Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedOrder(null); }}
        title={selectedOrder ? t('orders.orderDetails', { number: selectedOrder.orderNumber }) : ''}
        size="xl"
      >
        {selectedOrder && (
          <OrderDetailContent
            order={selectedOrder}
            onUpdateStatus={handleUpdateStatus}
            onDelete={() => { setDeleteConfirm(selectedOrder.id); setModalOpen(false); }}
            updating={updating}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('common.confirmDelete')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-danger/5 rounded-xl border border-danger/10">
            <AlertTriangle className="w-6 h-6 text-danger shrink-0" />
            <p className="text-sm font-cairo text-gray-700">
              {t('orders.deleteConfirm')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="danger"
              fullWidth
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              {t('common.delete')}
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setDeleteConfirm(null)}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

function OrderDetailContent({
  order,
  onUpdateStatus,
  onDelete,
  updating,
}: {
  order: Order;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: () => void;
  updating: boolean;
}) {
  const { t, i18n } = useTranslation();
  const nextStatuses = statusFlow[order.status] || [];

  return (
    <div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold font-cairo text-gray-900">{order.orderNumber}</h3>
            <Badge variant={statusBadgeVariant(order.status)} size="sm">
              {getOrderStatusMap()[order.status]?.label || order.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 font-cairo">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nextStatuses.map((status) => (
            <Button
              key={status}
              size="sm"
              variant={status === 'cancelled' ? 'danger' : 'primary'}
              loading={updating}
              onClick={() => onUpdateStatus(order.id, status)}
            >
              {status === 'cancelled' ? t('common.cancel') : getOrderStatusMap()[status]?.label || status}
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-danger">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
        <h3 className="text-sm font-bold font-cairo text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-400" /> {t('orders.orderTimeline')}
        </h3>
        <TrackingTimeline events={order.tracking} currentStatus={order.status} cancelled={order.status === 'cancelled'} />
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
        <h3 className="text-sm font-bold font-cairo text-gray-900 mb-4">{t('orders.items')}</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold font-cairo text-gray-900">{item.productName}</p>
                <p className="text-xs text-gray-400 font-cairo mt-0.5">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <span className="text-sm font-bold font-cairo text-gray-900">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer & Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft space-y-3">
          <h3 className="text-sm font-bold font-cairo text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" /> {t('orders.customerInfo')}
          </h3>
          {order.shippingAddress && (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-700 font-cairo">
                <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-900">{order.shippingAddress.fullName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-cairo">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                {order.shippingAddress.phone}
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-500 font-cairo">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span>{order.shippingAddress.street}، {order.shippingAddress.city}، {order.shippingAddress.state}</span>
              </div>
            </>
          )}
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft space-y-3">
          <h3 className="text-sm font-bold font-cairo text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" /> {t('orders.paymentInfo')}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-cairo">
            <CreditCard className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {getPaymentMethodLabel(order.paymentMethod)}
          </div>
          {order.couponCode && (
            <div className="flex items-center gap-2 text-sm text-secondary font-cairo">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              {t('orders.couponCode', { code: order.couponCode })}
            </div>
          )}
        </div>
      </div>

      {/* Order Totals */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft space-y-2.5">
        <h3 className="text-sm font-bold font-cairo text-gray-900 mb-3">{t('orders.orderSummary')}</h3>
        {[
          { label: t('cart.subtotal'), value: formatPrice(order.subtotal), color: '' },
          { label: t('cart.shipping'), value: order.shipping === 0 ? t('common.free') : formatPrice(order.shipping), color: '' },
          ...(order.discount > 0 ? [{ label: t('cart.discount'), value: `-${formatPrice(order.discount)}`, color: 'text-success' }] : []),
        ].map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-sm text-gray-500 font-cairo">{row.label}</span>
            <span className={cn('text-sm font-semibold font-cairo text-gray-900', row.color)}>
              {row.value}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-100 pt-2.5 mt-2.5">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold font-cairo text-gray-900">{t('cart.total')}</span>
            <span className="text-lg font-bold font-cairo text-gray-900">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
          <h3 className="text-sm font-bold font-cairo text-gray-900 mb-2">{t('orders.notes')}</h3>
          <p className="text-sm text-gray-500 font-cairo">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
