import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Edit3, Trash2, Grid3X3, List, Folder,
  LayoutGrid, X,
} from 'lucide-react';
import { cn } from '@/utils';
import { adminService } from '@/services';
import { Button, Input, Modal, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/components/ui';
import type { Category } from '@/types';

const emptyCategory: Partial<Category> = { name: '', slug: '', image: '', icon: 'Folder' };

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Category | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<Partial<Category>>(emptyCategory);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const data = adminService.getCategories();
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

  function handleSave() {
    if (!form.name) { toast.error('يرجى إدخال اسم التصنيف'); return; }
    setSaving(true);
    try {
      if (editing) {
        adminService.updateCategory(editing.id, form);
        toast.success('تم تحديث التصنيف بنجاح');
      } else {
        adminService.createCategory(form);
        toast.success('تم إضافة التصنيف بنجاح');
      }
      setModalOpen(false);
      fetchData();
    } catch { toast.error('حدث خطأ أثناء الحفظ'); }
    finally { setSaving(false); }
  }

  function handleDelete(cat: Category) {
    adminService.deleteCategory(cat.id);
    toast.success('تم حذف التصنيف بنجاح');
    setDeleteModal(null);
    fetchData();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900 dark:text-dark-text">التصنيفات</h1>
          <p className="text-sm text-gray-500 dark:text-dark-muted font-cairo mt-1">إدارة تصنيفات المنتجات</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> إضافة تصنيف</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="بحث عن تصنيف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-1">
          <button onClick={() => setView('grid')} className={cn('p-2 rounded-lg transition-colors', view === 'grid' ? 'bg-secondary text-white' : 'text-gray-500 dark:text-dark-muted hover:text-gray-900')}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('table')} className={cn('p-2 rounded-lg transition-colors', view === 'table' ? 'bg-secondary text-white' : 'text-gray-500 dark:text-dark-muted hover:text-gray-900')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Folder className="w-16 h-16" />} title="لا توجد تصنيفات" description={search ? 'لا توجد نتائج للبحث' : 'لم يتم إضافة أي تصنيف بعد'} action={!search ? { label: 'إضافة تصنيف', onClick: openAdd } : undefined} />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="group bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft overflow-hidden hover:shadow-soft-lg transition-all duration-300"
            >
              <div className="h-36 bg-gray-50 dark:bg-dark-border/50 overflow-hidden">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Folder className="w-4 h-4 text-secondary" />
                  <h3 className="font-bold font-cairo text-gray-900 dark:text-dark-text">{cat.name}</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-dark-muted font-cairo">{cat.productsCount} منتج</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/10 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteModal(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border">
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الصورة</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الاسم</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الرابط</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">المنتجات</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-dark-muted font-cairo">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-gray-50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-50 dark:bg-dark-border/50">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm font-semibold font-cairo text-gray-900 dark:text-dark-text">{cat.name}</span></td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-400 dark:text-dark-muted font-cairo">{cat.slug}</span></td>
                    <td className="px-4 py-3"><span className="text-sm font-cairo text-gray-600 dark:text-dark-muted">{cat.productsCount}</span></td>
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
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل تصنيف' : 'إضافة تصنيف'} size="md">
        <div className="space-y-4">
          <Input label="الاسم" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم التصنيف" />
          <Input label="الرابط (Slug)" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="category-slug" />
          <Input label="رابط الصورة" value={form.image || ''} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
          <Input label="الأيقونة" value={form.icon || ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Folder" />
          <div className="flex items-center gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button className="flex-1" onClick={handleSave} loading={saving}>{editing ? 'حفظ التغييرات' : 'إضافة'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="تأكيد الحذف" size="sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-danger" />
          </div>
          <p className="text-sm text-gray-600 dark:text-dark-muted font-cairo">هل أنت متأكد من حذف التصنيف <strong className="text-gray-900 dark:text-dark-text">{deleteModal?.name}</strong>؟</p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteModal(null)}>إلغاء</Button>
            <Button variant="danger" className="flex-1" onClick={() => deleteModal && handleDelete(deleteModal)}>حذف</Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
