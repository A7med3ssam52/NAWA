import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, CheckCheck, Bell, Info, AlertTriangle,
  CheckCircle, XCircle, X,
} from 'lucide-react';
import { cn, formatDate } from '@/utils';
import { adminService } from '@/services';
import { Button, Input, Select, Textarea, Modal, Badge, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/components/ui';
import type { Notification } from '@/types';

const emptyNotification: Partial<Notification> = { type: 'info', title: '', message: '' };

const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string; badgeVariant: 'info' | 'success' | 'warning' | 'danger' }> = {
  info: { label: 'معلومات', icon: <Info className="w-4 h-4" />, color: 'text-secondary bg-secondary/10 border-secondary/20', badgeVariant: 'info' },
  success: { label: 'نجاح', icon: <CheckCircle className="w-4 h-4" />, color: 'text-success bg-success/10 border-success/20', badgeVariant: 'success' },
  warning: { label: 'تنبيه', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-accent bg-accent/10 border-accent/20', badgeVariant: 'warning' },
  error: { label: 'خطأ', icon: <XCircle className="w-4 h-4" />, color: 'text-danger bg-danger/10 border-danger/20', badgeVariant: 'danger' },
};

export function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Notification | null>(null);
  const [form, setForm] = useState<Partial<Notification>>(emptyNotification);
  const [saving, setSaving] = useState(false);
  const pageSize = 20;

  const fetchData = useCallback(() => {
    setLoading(true);
    const result = adminService.getNotifications(page, pageSize);
    setNotifications(result.items);
    setTotalPages(result.totalPages);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdd() {
    setForm(emptyNotification);
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.title) { toast.error('يرجى إدخال عنوان الإشعار'); return; }
    if (!form.message) { toast.error('يرجى إدخال نص الإشعار'); return; }
    setSaving(true);
    try {
      adminService.createNotification(form);
      toast.success('تم إرسال الإشعار بنجاح');
      setModalOpen(false);
      setPage(1);
      fetchData();
    } catch { toast.error('حدث خطأ أثناء الحفظ'); }
    finally { setSaving(false); }
  }

  function handleMarkRead(notif: Notification) {
    adminService.markNotificationRead(notif.id);
    toast.success('تم تحديد الإشعار كمقروء');
    fetchData();
  }

  function handleDelete(notif: Notification) {
    adminService.deleteNotification(notif.id);
    toast.success('تم حذف الإشعار بنجاح');
    setDeleteModal(null);
    fetchData();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">الإشعارات</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo mt-1">إدارة وإرسال الإشعارات</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> إرسال إشعار</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-16 h-16" />} title="لا توجد إشعارات" description="لم يتم إرسال أي إشعار بعد" action={{ label: 'إرسال إشعار', onClick: openAdd }} />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => {
            const config = typeConfig[notif.type] || typeConfig.info;
            return (
              <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className={cn(
                  'bg-white dark:bg-dark-card rounded-2xl border shadow-soft p-4 transition-all duration-200',
                  notif.read ? 'border-gray-100 dark:border-dark-border' : 'border-secondary/30 dark:border-secondary/40',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('p-2.5 rounded-xl border', config.color)}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn('text-sm font-bold font-cairo', notif.read ? 'text-gray-900 dark:text-dark-text' : 'text-gray-900 dark:text-dark-text')}>
                        {notif.title}
                      </h3>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-secondary" />}
                    </div>
                    <p className="text-xs font-cairo text-gray-500 dark:text-dark-muted mb-2 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-3">
                      <Badge variant={config.badgeVariant} size="sm">{config.label}</Badge>
                      <span className="text-[10px] font-cairo text-gray-400 dark:text-dark-muted">{formatDate(notif.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.read && (
                      <button onClick={() => handleMarkRead(notif)} className="p-1.5 rounded-lg text-gray-400 hover:text-success hover:bg-success/10 transition-colors" title="تحديد كمقروء">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setDeleteModal(notif)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors" title="حذف">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={cn(
                    'w-8 h-8 rounded-xl text-xs font-bold font-cairo transition-colors',
                    p === page ? 'bg-secondary text-white' : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-muted hover:bg-gray-200 dark:hover:bg-dark-border/70'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="إرسال إشعار جديد" size="md">
        <div className="space-y-4">
          <Select
            label="النوع"
            value={form.type || 'info'}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { value: 'info', label: 'معلومات' },
              { value: 'success', label: 'نجاح' },
              { value: 'warning', label: 'تنبيه' },
              { value: 'error', label: 'خطأ' },
            ]}
          />
          <Input label="العنوان" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="عنوان الإشعار" />
          <Textarea label="الرسالة" value={form.message || ''} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="نص الإشعار..." />
          <div className="flex items-center gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>إرسال</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="تأكيد الحذف" size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-muted font-cairo">هل أنت متأكد من حذف هذا الإشعار؟</p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>إلغاء</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>حذف</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
