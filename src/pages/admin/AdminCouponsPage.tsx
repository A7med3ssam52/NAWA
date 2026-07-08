import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Edit3, Trash2, Percent, Tag, X,
} from 'lucide-react';
import { cn, formatDate } from '@/utils';
import { adminService } from '@/services';
import { Button, Input, Select, Modal, Badge, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/components/ui';
import type { Coupon } from '@/types';

const emptyCoupon: Partial<Coupon> = {
  code: '', discount: 0, type: 'percentage', minOrder: 0,
  maxDiscount: 0, expiresAt: '', usageLimit: 100,
};

export function AdminCouponsPage() {
  const { t, i18n } = useTranslation();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Coupon | null>(null);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Partial<Coupon>>(emptyCoupon);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const data = adminService.getCoupons();
    setCoupons(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  function isExpired(dateStr: string) {
    return new Date(dateStr).getTime() < Date.now();
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyCoupon);
    setModalOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discount: coupon.discount,
      type: coupon.type,
      minOrder: coupon.minOrder,
      maxDiscount: coupon.maxDiscount,
      expiresAt: coupon.expiresAt.slice(0, 10),
      usageLimit: coupon.usageLimit,
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.code) { toast.error(t('admin.couponCodeRequired')); return; }
    if (!form.discount || form.discount <= 0) { toast.error(t('admin.discountRequired')); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
      };
      if (editing) {
        adminService.updateCoupon(editing.id, payload);
        toast.success(t('admin.couponUpdated'));
      } else {
        adminService.createCoupon(payload);
        toast.success(t('admin.couponAdded'));
      }
      setModalOpen(false);
      fetchData();
    } catch { toast.error(t('admin.saveError2')); }
    finally { setSaving(false); }
  }

  function handleDelete(coupon: Coupon) {
    adminService.deleteCoupon(coupon.id);
    toast.success(t('admin.couponDeleted'));
    setDeleteModal(null);
    fetchData();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">{t('admin.coupons')}</h1>
          <p className="text-sm text-gray-500 font-cairo mt-1">{t('admin.couponsDesc')}</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> {t('admin.addCoupon')}</Button>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={t('admin.searchCoupon')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Tag className="w-16 h-16" />} title={t('admin.noCoupons')} description={search ? t('admin.noSearchResults') : t('admin.couponsDesc')} action={!search ? { label: t('admin.addCoupon'), onClick: openAdd } : undefined} />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.couponCode')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.couponDiscount')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.couponType')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.couponMinOrder')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.couponUsage')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.couponExpiry')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('common.status')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((coupon) => {
                  const expired = isExpired(coupon.expiresAt);
                  return (
                    <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/10 text-secondary text-sm font-bold font-cairo">
                          <Percent className="w-3 h-3" /> {coupon.code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold font-cairo text-gray-900">
                          {coupon.type === 'percentage' ? `${coupon.discount}%` : `${coupon.discount.toLocaleString('ar-EG')} ${t('common.currency')}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-cairo text-gray-500">
                          {coupon.type === 'percentage' ? t('admin.percentage') : t('admin.fixed')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-cairo text-gray-600">
                          {coupon.minOrder > 0 ? `${coupon.minOrder.toLocaleString('ar-EG')} ${t('common.currency')}` : t('admin.noMinimum')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-cairo text-gray-600">
                          {coupon.usedCount} / {coupon.usageLimit}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm font-cairo', expired ? 'text-danger' : 'text-gray-600')}>
                          {formatDate(coupon.expiresAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={expired ? 'danger' : 'success'} size="sm">
                          {expired ? t('admin.expired') : t('admin.active')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEdit(coupon)} className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteModal(coupon)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.editCoupon') : t('admin.addCouponForm')} size="md">
        <div className="space-y-4">
          <Input label={t('admin.couponCodeInput')} value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SUMMER20" />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('admin.discountValue')} type="number" value={form.discount || ''} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} placeholder="20" />
            <Select
              label={t('admin.discountType')}
              value={form.type || 'percentage'}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={[
                { value: 'percentage', label: t('admin.percentage') },
                { value: 'fixed', label: t('admin.fixed') },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('admin.minOrder')} type="number" value={form.minOrder || ''} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} placeholder="0" />
            <Input label={t('admin.maxDiscount')} type="number" value={form.maxDiscount || ''} onChange={(e) => setForm({ ...form, maxDiscount: Number(e.target.value) })} placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('admin.expiryDate')} type="date" value={form.expiresAt || ''} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            <Input label={t('admin.usageLimit')} type="number" value={form.usageLimit || ''} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} placeholder="100" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>{editing ? t('common.saveChanges') : t('common.add')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={t('common.confirmDelete')} size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-gray-600 font-cairo">{t('admin.deleteCouponConfirm', { code: deleteModal?.code || '' })}</p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
