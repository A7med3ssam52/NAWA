import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
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

const typeConfig: Record<string, { labelKey: string; icon: React.ReactNode; color: string; badgeVariant: 'info' | 'success' | 'warning' | 'danger' }> = {
  info: { labelKey: 'admin.notificationInfo', icon: <Info className="w-4 h-4" />, color: 'text-secondary bg-secondary/10 border-secondary/20', badgeVariant: 'info' },
  success: { labelKey: 'admin.notificationSuccess', icon: <CheckCircle className="w-4 h-4" />, color: 'text-success bg-success/10 border-success/20', badgeVariant: 'success' },
  warning: { labelKey: 'admin.notificationWarning', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-accent bg-accent/10 border-accent/20', badgeVariant: 'warning' },
  error: { labelKey: 'admin.notificationError', icon: <XCircle className="w-4 h-4" />, color: 'text-danger bg-danger/10 border-danger/20', badgeVariant: 'danger' },
};

export function AdminNotificationsPage() {
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Notification | null>(null);
  const [form, setForm] = useState<Partial<Notification>>(emptyNotification);
  const [saving, setSaving] = useState(false);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await adminService.getNotifications(page, pageSize);
    setNotifications(result.items);
    setTotalPages(result.totalPages);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openAdd() {
    setForm(emptyNotification);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title) { toast.error(t('admin.notificationTitleRequired')); return; }
    if (!form.message) { toast.error(t('admin.notificationMessageRequired')); return; }
    setSaving(true);
    try {
      await adminService.createNotification(form);
      toast.success(t('admin.notificationSent'));
      setModalOpen(false);
      setPage(1);
      fetchData();
    } catch { toast.error(t('admin.saveError5')); }
    finally { setSaving(false); }
  }

  async function handleMarkRead(notif: Notification) {
    await adminService.markNotificationRead(notif.id);
    toast.success(t('admin.notificationMarkedRead'));
    fetchData();
  }

  async function handleDelete(notif: Notification) {
    await adminService.deleteNotification(notif.id);
    toast.success(t('admin.notificationDeleted'));
    setDeleteModal(null);
    fetchData();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">{t('admin.notificationsTitle')}</h1>
          <p className="text-sm text-gray-500 font-cairo mt-1">{t('admin.notificationsDesc')}</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> {t('admin.sendNotification')}</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-16 h-16" />} title={t('admin.noNotifications')} description={t('admin.noNotificationsDesc')} action={{ label: t('admin.sendNotification'), onClick: openAdd }} />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif, i) => {
            const config = typeConfig[notif.type] || typeConfig.info;
            return (
              <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className={cn(
                  'bg-white rounded-2xl border shadow-soft p-4 transition-all duration-200',
                  notif.read ? 'border-gray-100' : 'border-secondary/30',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('p-2.5 rounded-xl border', config.color)}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn('text-sm font-bold font-cairo', notif.read ? 'text-gray-900' : 'text-gray-900')}>
                        {notif.title}
                      </h3>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-secondary" />}
                    </div>
                    <p className="text-xs font-cairo text-gray-500 mb-2 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-3">
                      <Badge variant={config.badgeVariant} size="sm">{t(config.labelKey)}</Badge>
                      <span className="text-[10px] font-cairo text-gray-400">{formatDate(notif.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.read && (
                      <button onClick={() => handleMarkRead(notif)} className="p-1.5 rounded-lg text-gray-400 hover:text-success hover:bg-success/10 transition-colors" title={t('admin.markAsRead')}>
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setDeleteModal(notif)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors" title={t('admin.deleteNotification')}>
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
                    p === page ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t('admin.sendNewNotification')} size="md">
        <div className="space-y-4">
          <Select
            label={t('admin.notificationType')}
            value={form.type || 'info'}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { value: 'info', label: t('admin.notificationInfo') },
              { value: 'success', label: t('admin.notificationSuccess') },
              { value: 'warning', label: t('admin.notificationWarning') },
              { value: 'error', label: t('admin.notificationError') },
            ]}
          />
          <Input label={t('admin.notificationTitleInput')} value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('admin.notificationTitlePlaceholder')} />
          <Textarea label={t('admin.notificationMessage')} value={form.message || ''} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t('admin.notificationMessagePlaceholder')} />
          <div className="flex items-center gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>{t('common.submit')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={t('common.confirmDelete')} size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-gray-600 font-cairo">{t('common.deleteNotificationConfirm')}</p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
