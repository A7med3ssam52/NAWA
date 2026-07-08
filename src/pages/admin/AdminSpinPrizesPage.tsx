import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Edit3, Trash2, Gift, Sparkles, X,
} from 'lucide-react';
import { cn } from '@/utils';
import { adminService } from '@/services';
import { Button, Input, Select, Modal, Badge, EmptyState, Spinner, Tabs } from '@/components/ui';
import { toast } from '@/components/ui';
import type { SpinPrize, SpinPrizeType } from '@/types';

export function AdminSpinPrizesPage() {
  const { t, i18n } = useTranslation();
  const [prizes, setPrizes] = useState<SpinPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<SpinPrize | null>(null);
  const [editing, setEditing] = useState<SpinPrize | null>(null);
  const [form, setForm] = useState<Partial<SpinPrize>>({
    label: '',
    type: 'percentage',
    value: 10,
    color: '#2563EB',
    weight: 10,
    isActive: true,
  });
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

  const PRIZE_TYPE_OPTIONS = [
    { value: 'percentage', label: t('spin.prizeTypePercentage') },
    { value: 'fixed', label: t('spin.prizeTypeFixed') },
    { value: 'freeShipping', label: t('spin.prizeTypeFreeShipping') },
    { value: 'tryAgain', label: t('spin.prizeTypeTryAgain') },
  ];

  const defaultColors = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#EC4899', '#F97316', '#06B6D4', '#64748B', '#3B82F6'];

  function openAdd() {
    setEditing(null);
    setForm({
      label: '',
      type: 'percentage',
      value: 10,
      color: defaultColors[prizes.length % defaultColors.length],
      weight: 10,
      isActive: true,
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
    if (!form.label) { toast.error(t('admin.prizeLabelRequired')); return; }
    if (!form.weight || form.weight < 1) { toast.error(t('admin.prizeWeightMin')); return; }
    setSaving(true);
    try {
      if (editing) {
        adminService.updateSpinPrize(editing.id, form);
        toast.success(t('admin.prizeUpdated'));
      } else {
        adminService.createSpinPrize(form);
        toast.success(t('admin.prizeAdded'));
      }
      setModalOpen(false);
      fetchData();
    } catch { toast.error(t('admin.saveError2')); }
    finally { setSaving(false); }
  }

  function handleDelete(prize: SpinPrize) {
    adminService.deleteSpinPrize(prize.id);
    toast.success(t('admin.prizeDeleted'));
    setDeleteModal(null);
    fetchData();
  }

  function toggleActive(prize: SpinPrize) {
    adminService.updateSpinPrize(prize.id, { isActive: !prize.isActive });
    fetchData();
    toast.success(prize.isActive ? t('admin.prizeToggled') : t('admin.prizeToggledActive'));
  }

  const totalWeight = prizes.filter((p) => p.isActive).reduce((s, p) => s + p.weight, 0);

  const tabs = [
    { id: 'prizes', label: t('admin.prizeTabs') },
    { id: 'stats', label: t('admin.statsTab') },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">{t('admin.spinPrizesTitle')}</h1>
          <p className="text-sm text-gray-500 font-cairo mt-1">{t('admin.spinPrizesManagement')}</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> {t('admin.addPrize')}</Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'prizes' && (
        <>
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('admin.searchPrize')}
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
              title={t('admin.noPrizes')}
              description={search ? t('admin.noSearchResults') : t('admin.noPrizesDesc')}
              action={!search ? { label: t('admin.addPrize'), onClick: openAdd } : undefined}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.prizeName')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.prizeType')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.prizeValue')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.prizeWeight')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.prizeChance')}</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.prizeStatus')}</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((prize) => {
                      const chance = totalWeight > 0 ? ((prize.weight / totalWeight) * 100).toFixed(1) : '0';
                      return (
                        <tr key={prize.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 rounded-lg"
                                style={{ backgroundColor: prize.color }}
                              />
                              <span className="text-sm font-bold font-cairo text-gray-900">
                                {prize.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-cairo text-gray-500">
                              {prize.type === 'percentage' ? t('spin.prizeTypePercentage')
                                : prize.type === 'fixed' ? t('spin.prizeTypeFixed')
                                : prize.type === 'freeShipping' ? t('spin.prizeTypeFreeShipping')
                                : t('spin.prizeTypeTryAgain')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-cairo text-gray-600">
                              {prize.type === 'percentage' ? `${prize.value}%`
                                : prize.type === 'fixed' ? `${prize.value?.toLocaleString('ar-EG')} ${t('common.currency')}`
                                : prize.type === 'freeShipping' ? '—'
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-cairo text-gray-600">{prize.weight}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
                                {prize.isActive ? t('admin.active') : t('admin.inactive')}
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
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-secondary" />
              </div>
            </div>
            <p className="text-2xl font-bold font-cairo text-gray-900">{prizes.length}</p>
            <p className="text-xs font-cairo text-gray-500 mt-0.5">{t('admin.totalPrizes')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold font-cairo text-gray-900">
              {prizes.filter((p) => p.isActive && p.type !== 'tryAgain').length}
            </p>
            <p className="text-xs font-cairo text-gray-500 mt-0.5">{t('admin.winnablePrizes')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold font-cairo text-gray-900">{totalWeight}</p>
            <p className="text-xs font-cairo text-gray-500 mt-0.5">{t('admin.totalWeight')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                <X className="w-5 h-5 text-danger" />
              </div>
            </div>
            <p className="text-2xl font-bold font-cairo text-gray-900">
              {prizes.filter((p) => !p.isActive).length}
            </p>
            <p className="text-xs font-cairo text-gray-500 mt-0.5">{t('admin.disabledPrizes')}</p>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.editPrize') : t('admin.addPrize')} size="md">
        <div className="space-y-4">
          <Input
            label={t('admin.prizeLabel')}
            value={form.label || ''}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder={t('admin.prizeNamePlaceholder')}
          />

          <Select
            label={t('admin.prizeType')}
            value={form.type || 'percentage'}
            onChange={(e) => setForm({ ...form, type: e.target.value as SpinPrizeType })}
            options={PRIZE_TYPE_OPTIONS}
          />

          {form.type !== 'tryAgain' && form.type !== 'freeShipping' && (
            <Input
              label={t('admin.prizeValue')}
              type="number"
              value={form.value || ''}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              placeholder={form.type === 'percentage' ? t('admin.percentagePlaceholder') : t('admin.fixedPlaceholder')}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.prizeColor')}
              type="color"
              value={form.color || '#2563EB'}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 p-1"
            />
            <Input
              label={t('admin.prizeWeightLabel')}
              type="number"
              value={form.weight || ''}
              onChange={(e) => setForm({ ...form, weight: Math.max(1, Number(e.target.value)) })}
              placeholder={t('admin.weightPlaceholder')}
            />
          </div>

          <div>
            <p className="text-xs font-cairo text-gray-500 mb-2">{t('admin.suggestedColors')}</p>
            <div className="flex flex-wrap gap-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={cn(
                    'w-8 h-8 rounded-xl border-2 transition-all',
                    form.color === color ? 'border-gray-900 scale-110' : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>
              {editing ? t('common.saveChanges') : t('common.add')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={t('common.confirmDelete')} size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-gray-600 font-cairo">
            {t('admin.deletePrizeConfirm', { name: deleteModal?.label || '' })}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
