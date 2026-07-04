import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Edit3, Trash2, Gift, Sparkles, X,
} from 'lucide-react';
import { adminService } from '@/services';
import { Button, Input, Select, Modal, Badge, EmptyState, Spinner, Tabs } from '@/components/ui';
import { toast } from '@/components/ui';
import type { SpinPrize, SpinPrizeType } from '@/types';

const PRIZE_TYPE_OPTIONS = [
  { value: 'percentage', label: 'نسبة مئوية' },
  { value: 'fixed', label: 'قيمة ثابتة' },
  { value: 'freeShipping', label: 'شحن مجاني' },
  { value: 'tryAgain', label: 'حظ أوفر' },
];

const emptyForm: Partial<SpinPrize> = {
  label: '',
  type: 'percentage',
  value: 10,
  color: '#2563EB',
  weight: 10,
  isActive: true,
};

const defaultColors = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#F97316', '#06B6D4', '#64748B', '#3B82F6'];

export function AdminSpinPrizesPage() {
  const [prizes, setPrizes] = useState<SpinPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<SpinPrize | null>(null);
  const [editing, setEditing] = useState<SpinPrize | null>(null);
  const [form, setForm] = useState<Partial<SpinPrize>>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('prizes');

  const fetchData = useCallback(() => {
    setLoading(true);
    const data = adminService.getSpinPrizes();
    setPrizes(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = prizes.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm({
      ...emptyForm,
      color: defaultColors[prizes.length % defaultColors.length],
    });
    setModalOpen(true);
  }

  function openEdit(prize: SpinPrize) {
    setEditing(prize);
    setForm({
      label: prize.label,
      type: prize.type,
      value: prize.value,
      color: prize.color,
      weight: prize.weight,
      isActive: prize.isActive,
    });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.label) { toast.error('يرجى إدخال اسم الجائزة'); return; }
    if (!form.weight || form.weight < 1) { toast.error('الوزن يجب أن يكون 1 على الأقل'); return; }
    setSaving(true);
    try {
      if (editing) {
        adminService.updateSpinPrize(editing.id, form);
        toast.success('تم تحديث الجائزة بنجاح');
      } else {
        adminService.createSpinPrize(form);
        toast.success('تم إضافة الجائزة بنجاح');
      }
      setModalOpen(false);
      fetchData();
    } catch { toast.error('حدث خطأ أثناء الحفظ'); }
    finally { setSaving(false); }
  }

  function handleDelete(prize: SpinPrize) {
    adminService.deleteSpinPrize(prize.id);
    toast.success('تم حذف الجائزة بنجاح');
    setDeleteModal(null);
    fetchData();
  }

  function toggleActive(prize: SpinPrize) {
    adminService.updateSpinPrize(prize.id, { isActive: !prize.isActive });
    fetchData();
    toast.success(prize.isActive ? 'تم تعطيل الجائزة' : 'تم تفعيل الجائزة');
  }

  const totalWeight = prizes.filter((p) => p.isActive).reduce((s, p) => s + p.weight, 0);

  const tabs = [
    { id: 'prizes', label: 'الجوائز' },
    { id: 'stats', label: 'إحصائيات' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">جوائز عجلة الحظ</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo mt-1">إدارة جوائز وفرص عجلة الحظ</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> إضافة جائزة</Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'prizes' && (
        <>
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث عن جائزة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Gift className="w-16 h-16" />}
              title="لا توجد جوائز"
              description={search ? 'لا توجد نتائج للبحث' : 'لم يتم إضافة أي جائزة بعد'}
              action={!search ? { label: 'إضافة جائزة', onClick: openAdd } : undefined}
            />
          ) : (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-dark-border">
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الجائزة</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">النوع</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">القيمة</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الوزن</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الفرصة</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الحالة</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((prize) => {
                      const chance = totalWeight > 0 ? ((prize.weight / totalWeight) * 100).toFixed(1) : '0';
                      return (
                        <tr key={prize.id} className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-lg"
                                style={{ backgroundColor: prize.color }}
                              />
                              <span className="text-sm font-bold font-cairo text-gray-900 dark:text-dark-text">
                                {prize.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-cairo text-gray-500 dark:text-dark-muted">
                              {prize.type === 'percentage' ? 'نسبة مئوية'
                                : prize.type === 'fixed' ? 'قيمة ثابتة'
                                : prize.type === 'freeShipping' ? 'شحن مجاني'
                                : 'حظ أوفر'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-cairo text-gray-600 dark:text-dark-muted">
                              {prize.type === 'percentage' ? `${prize.value}%`
                                : prize.type === 'fixed' ? `${prize.value?.toLocaleString('ar-EG')} ج.م`
                                : prize.type === 'freeShipping' ? '—'
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-cairo text-gray-600 dark:text-dark-muted">{prize.weight}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-gray-100 dark:bg-dark-border overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${chance}%`,
                                    backgroundColor: prize.color,
                                  }}
                                />
                              </div>
                              <span className="text-[10px] font-bold font-cairo text-gray-400">{chance}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleActive(prize)}>
                              <Badge variant={prize.isActive ? 'success' : 'secondary'} size="sm">
                                {prize.isActive ? 'نشط' : 'معطل'}
                              </Badge>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => openEdit(prize)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteModal(prize)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-secondary" />
              </div>
            </div>
            <p className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">{prizes.length}</p>
            <p className="text-xs font-cairo text-gray-500 dark:text-dark-muted mt-0.5">إجمالي الجوائز</p>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">
              {prizes.filter((p) => p.isActive && p.type !== 'tryAgain').length}
            </p>
            <p className="text-xs font-cairo text-gray-500 dark:text-dark-muted mt-0.5">جوائز قابلة للفوز</p>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">{totalWeight}</p>
            <p className="text-xs font-cairo text-gray-500 dark:text-dark-muted mt-0.5">الوزن الإجمالي</p>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                <X className="w-5 h-5 text-danger" />
              </div>
            </div>
            <p className="text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">
              {prizes.filter((p) => !p.isActive).length}
            </p>
            <p className="text-xs font-cairo text-gray-500 dark:text-dark-muted mt-0.5">جوائز معطلة</p>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل الجائزة' : 'إضافة جائزة'} size="md">
        <div className="space-y-4">
          <Input
            label="اسم الجائزة"
            value={form.label || ''}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="10% خصم"
          />

          <Select
            label="نوع الجائزة"
            value={form.type || 'percentage'}
            onChange={(e) => setForm({ ...form, type: e.target.value as SpinPrizeType })}
            options={PRIZE_TYPE_OPTIONS}
          />

          {form.type !== 'tryAgain' && form.type !== 'freeShipping' && (
            <Input
              label="القيمة"
              type="number"
              value={form.value || ''}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              placeholder={form.type === 'percentage' ? '10' : '50'}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="اللون"
              type="color"
              value={form.color || '#2563EB'}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 p-1"
            />
            <Input
              label="الوزن (الفرصة)"
              type="number"
              value={form.weight || ''}
              onChange={(e) => setForm({ ...form, weight: Math.max(1, Number(e.target.value)) })}
              placeholder="10"
            />
          </div>

          {/* Color presets */}
          <div>
            <p className="text-xs font-cairo text-gray-500 dark:text-dark-muted mb-2">ألوان مقترحة</p>
            <div className="flex flex-wrap gap-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={cn(
                    'w-8 h-8 rounded-xl border-2 transition-all',
                    form.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>
              {editing ? 'حفظ التغييرات' : 'إضافة'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="تأكيد الحذف" size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-muted font-cairo">
            هل أنت متأكد من حذف الجائزة <strong className="text-gray-900 dark:text-dark-text">{deleteModal?.label}</strong>؟
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>إلغاء</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>حذف</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
