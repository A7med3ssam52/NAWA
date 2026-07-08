import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Edit3, Trash2, Grid3X3, List,
  Building2, X,
} from 'lucide-react';
import { cn } from '@/utils';
import { adminService } from '@/services';
import { Button, Input, Modal, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/components/ui';
import type { Brand } from '@/types';

const emptyBrand: Partial<Brand> = { name: '', slug: '', logo: '' };

export function AdminBrandsPage() {
  const { t, i18n } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Brand | null>(null);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<Partial<Brand>>(emptyBrand);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const data = adminService.getBrands();
    setBrands(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyBrand);
    setModalOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditing(brand);
    setForm({ name: brand.name, slug: brand.slug, logo: brand.logo });
    setModalOpen(true);
  }

  function handleSave() {
    if (!form.name) { toast.error(t('admin.brandNameRequired')); return; }
    setSaving(true);
    try {
      if (editing) {
        adminService.updateBrand(editing.id, form);
        toast.success(t('admin.brandUpdated'));
      } else {
        adminService.createBrand(form);
        toast.success(t('admin.brandAdded'));
      }
      setModalOpen(false);
      fetchData();
    } catch { toast.error(t('admin.saveError4')); }
    finally { setSaving(false); }
  }

  function handleDelete(brand: Brand) {
    adminService.deleteBrand(brand.id);
    toast.success(t('admin.brandDeleted'));
    setDeleteModal(null);
    fetchData();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">{t('admin.brandsTitle')}</h1>
          <p className="text-sm text-gray-500 font-cairo mt-1">{t('admin.brandsDesc')}</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> {t('admin.addBrand')}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('admin.searchBrand')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-1">
          <button onClick={() => setView('grid')} title={t('admin.viewGrid')} className={cn('p-2 rounded-lg transition-colors', view === 'grid' ? 'bg-secondary text-white' : 'text-gray-500 hover:text-gray-900')}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('table')} title={t('admin.viewTable')} className={cn('p-2 rounded-lg transition-colors', view === 'table' ? 'bg-secondary text-white' : 'text-gray-500 hover:text-gray-900')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Building2 className="w-16 h-16" />} title={t('admin.noBrands')} description={search ? t('admin.noSearchResults') : t('admin.noBrandsDesc')} action={!search ? { label: t('admin.addBrand'), onClick: openAdd } : undefined} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((brand, i) => (
            <motion.div key={brand.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="group bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden hover:shadow-soft-lg transition-all duration-300"
            >
              <div className="h-40 flex items-center justify-center bg-gray-50 p-6">
                <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-secondary" />
                  <h3 className="font-bold font-cairo text-gray-900">{brand.name}</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-cairo">{brand.productsCount} {t('brands.productsCount', { count: '' }).replace('{count}', '')}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(brand)} className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteModal(brand)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableLogo')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableBrandName')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableSlug')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableProducts')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((brand) => (
                  <tr key={brand.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-1">
                        <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm font-semibold font-cairo text-gray-900">{brand.name}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-400 font-cairo">{brand.slug}</span></td>
                    <td className="px-4 py-3"><span className="text-sm font-cairo text-gray-600">{brand.productsCount}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(brand)} className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteModal(brand)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.editBrandForm') : t('admin.addBrandForm')} size="md">
        <div className="space-y-4">
          <Input label={t('admin.brandName')} value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('admin.namePlaceholder')} />
          <Input label={t('admin.brandSlug')} value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="brand-slug" />
          <Input label={t('admin.brandLogoLink')} value={form.logo || ''} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder={t('admin.imagePlaceholder')} />
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
          <p className="text-sm text-gray-600 font-cairo">{t('admin.deleteBrandConfirm', { name: deleteModal?.name || '' })}</p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
