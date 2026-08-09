import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Edit3, Trash2, Grid3X3, List, Folder,
  LayoutGrid, X,
} from 'lucide-react';
import { cn } from '@/utils';
import { adminService } from '@/services';
import { Button, Input, Modal, EmptyState, Spinner, ImageUpload, Card } from '@/components/ui';
import { toast } from '@/components/ui';
import type { Category } from '@/types';

const emptyCategory: Partial<Category> = { name: '', slug: '', image: '', icon: 'Folder' };

export function AdminCategoriesPage() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Category | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Partial<Category>>(emptyCategory);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await adminService.getCategories();
    setCategories(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(emptyCategory);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, image: cat.image, icon: cat.icon });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name) { toast.error(t('admin.categoryNameRequired')); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminService.updateCategory(editing.id, form);
        toast.success(t('admin.categoryUpdated'));
      } else {
        await adminService.createCategory(form);
        toast.success(t('admin.categoryAdded'));
      }
      setModalOpen(false);
      fetchData();
    } catch { toast.error(t('admin.saveError3')); }
    finally { setSaving(false); }
  }

  async function handleDelete(cat: Category) {
    await adminService.deleteCategory(cat.id);
    toast.success(t('admin.categoryDeleted'));
    setDeleteModal(null);
    fetchData();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">{t('admin.categoriesTitle')}</h1>
          <p className="text-sm text-gray-500 font-cairo mt-1">{t('admin.categoriesDesc')}</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> {t('admin.addCategory')}</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('admin.searchCategory')}
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
        <EmptyState icon={<Folder className="w-16 h-16" />} title={t('admin.noCategories')} description={search ? t('admin.noSearchResults') : t('admin.noCategoriesDesc')} action={!search ? { label: t('admin.addCategory'), onClick: openAdd } : undefined} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="group bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden hover:shadow-soft-lg transition-all duration-300"
            >
              <div className="h-36 bg-gray-50 overflow-hidden">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Folder className="w-4 h-4 text-secondary" />
                  <h3 className="font-bold font-cairo text-gray-900">{cat.name}</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-cairo">{cat.productsCount} {t('categories.productsCount', { count: '' }).replace('{count}', '')}</span>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteModal(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <>
        <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableImage')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableName')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableSlug')}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableProducts')}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 font-cairo">{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm font-semibold font-cairo text-gray-900">{cat.name}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-400 font-cairo">{cat.slug}</span></td>
                    <td className="px-4 py-3"><span className="text-sm font-cairo text-gray-600">{cat.productsCount}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteModal(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-3">
            {filtered.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold font-cairo text-gray-900 truncate">{cat.name}</h3>
                      <p className="text-xs text-gray-400 font-cairo truncate">{cat.slug}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteModal(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500 font-cairo flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5" />
                      {cat.productsCount} {t('categories.productsCount', { count: '' }).replace('{count}', '')}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.editCategoryForm') : t('admin.addCategoryForm')} size="md">
        <div className="space-y-4">
          <Input label={t('admin.categoryName')} value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('admin.namePlaceholder')} />
          <Input label={t('admin.slugLabel')} value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={t('admin.slugPlaceholder')} />
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700 font-cairo">
              {t('admin.image')}
            </label>
            <ImageUpload
              value={form.image ? [form.image] : []}
              onChange={(urls) => setForm({ ...form, image: urls[0] || '' })}
              bucket="categories"
              max={1}
            />
          </div>
          <Input label={t('admin.iconLabel')} value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder={t('admin.iconPlaceholder')} />
          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>{editing ? t('common.saveChanges') : t('common.add')}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title={t('common.confirmDelete')} size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-gray-600 font-cairo">{t('admin.deleteCategoryConfirm', { name: deleteModal?.name || '' })}</p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
