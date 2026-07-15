import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Package, Search, Plus, Edit2, Trash2, Image as ImageIcon,
  Star, AlertTriangle,
} from 'lucide-react';
import { formatPrice } from '@/utils';
import { adminService } from '@/services';
import {
  Button, Input, Select, Badge, Modal,
  EmptyState, Pagination, toast, ImageUpload,
} from '@/components/ui';
import type { Product } from '@/types';

const PAGE_SIZE = 10;

const emptyForm = {
  name: '',
  slug: '',
  price: 0,
  oldPrice: 0,
  discount: 0,
  stock: 0,
  sku: '',
  category: '',
  brand: '',
  description: '',
  shortDescription: '',
  images: [] as string[],
  isFeatured: false,
  tags: '',
};

type FormData = typeof emptyForm;

export function AdminProductsPage() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [catList, setCatList] = useState<{ value: string; label: string }[]>([]);
  const [brandList, setBrandList] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    adminService.getCategories().then((cats) =>
      setCatList(cats.map((c) => ({ value: c.id, label: c.name })))
    );
    adminService.getBrands().then((brands) =>
      setBrandList(brands.map((b) => ({ value: b.id, label: b.name })))
    );
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, brandFilter]);

  useEffect(() => {
    setLoading(true);
    adminService.getProducts(
      search || undefined,
      categoryFilter || undefined,
      brandFilter || undefined,
      page,
      PAGE_SIZE
    ).then((result) => {
      setProducts(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setLoading(false);
    });
  }, [search, categoryFilter, brandFilter, page]);

  function stockBadge(stock: number) {
    if (stock > 10) return { variant: 'success' as const, label: t('admin.inStock') };
    if (stock > 0) return { variant: 'warning' as const, label: t('admin.lowStock') };
    return { variant: 'danger' as const, label: t('admin.outOfStock') };
  }

  function openAddModal() {
    setForm(emptyForm);
    setModalMode('add');
  }

  function openEditModal(product: Product) {
    setForm({
      name: product.name,
      slug: product.slug,
      price: product.price,
      oldPrice: product.oldPrice || 0,
      discount: product.discount || 0,
      stock: product.stock,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      description: product.description,
      shortDescription: product.shortDescription,
      images: [...product.images],
      isFeatured: product.isFeatured,
      tags: product.tags.join(', '),
    });
    setEditId(product.id);
    setModalMode('edit');
  }

  function handleImages(urls: string[]) {
    setForm((prev) => ({ ...prev, images: urls }));
  }

  function updateForm(key: keyof FormData, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error(t('admin.nameRequired'));
      return;
    }
    if (!form.slug.trim()) {
      toast.error(t('admin.slugRequired'));
      return;
    }
    if (!form.price || form.price <= 0) {
      toast.error(t('admin.priceRequired'));
      return;
    }
    if (!form.sku.trim()) {
      toast.error(t('admin.skuRequired'));
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name,
        slug: form.slug,
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
        discount: form.discount ? Number(form.discount) : null,
        stock: Number(form.stock),
        sku: form.sku,
        category: form.category,
        brand: form.brand,
        description: form.description,
        shortDescription: form.shortDescription,
        images: form.images.length > 0
          ? form.images
          : ['https://picsum.photos/seed/default/600/600'],
        isFeatured: form.isFeatured,
        tags: form.tags
          ? form.tags.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
      };

      if (modalMode === 'add') {
        const created = await adminService.createProduct(data);
        setProducts((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
        toast.success(t('admin.productAdded'));
      } else {
        const id = editId;
        if (!id) return;
        const updated = await adminService.updateProduct(id, data);
        if (updated) {
          setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
          toast.success(t('admin.productUpdated'));
        }
      }
      setModalMode(null);
      setForm(emptyForm);
    } catch {
      toast.error(t('admin.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setTotal((t) => t - 1);
      toast.success(t('admin.productDeleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('admin.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  const containerAnim = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const catMap = useMemo(() => {
    const m: Record<string, string> = {};
    catList.forEach((c) => { m[c.value] = c.label; });
    return m;
  }, [catList]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 lg:p-6 space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">
            {t('admin.products')}
          </h1>
          <p className="text-sm text-gray-500 font-cairo mt-1">
            {total} {t('auth.productLabel')}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openAddModal} rounded="xl">
          <Plus className="w-4 h-4" />
          {t('admin.addProduct')}
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4 lg:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
              placeholder={t('admin.searchProduct')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 text-sm font-cairo bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={catList}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder={t('admin.allCategories')}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={brandList}
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              placeholder={t('admin.allBrands')}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="w-12 h-12" />}
            title={t('admin.noProducts')}
            description={search || categoryFilter || brandFilter ? t('admin.noSearchResults') : t('admin.noProductsDesc')}
            action={search || categoryFilter || brandFilter ? undefined : { label: t('admin.addProduct'), onClick: openAddModal }}
          />
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 font-cairo whitespace-nowrap">{t('common.image')}</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 font-cairo whitespace-nowrap">{t('common.name')}</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 font-cairo whitespace-nowrap">{t('admin.price')}</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 font-cairo whitespace-nowrap">{t('admin.stock')}</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 font-cairo whitespace-nowrap">{t('admin.category')}</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 font-cairo whitespace-nowrap">{t('products.reviews', { count: '' }).replace(' ({count})', '')}</th>
                    <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 font-cairo whitespace-nowrap">{t('common.status')}</th>
                    <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 font-cairo whitespace-nowrap">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold font-cairo text-gray-900">
                            {product.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-cairo">{product.sku}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm font-bold font-cairo text-gray-900">
                          {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && (
                          <span className="text-xs text-gray-400 font-cairo line-through mr-1">
                            {formatPrice(product.oldPrice)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={stockBadge(product.stock).variant} size="sm">
                          {stockBadge(product.stock).label} ({product.stock})
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm font-cairo text-gray-600">
                          {catMap[product.category] || product.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-accent text-accent" />
                          <span className="text-sm font-bold font-cairo text-gray-900">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant={stockBadge(product.stock).variant} size="sm">
                            {stockBadge(product.stock).label}
                          </Badge>
                          {product.isFeatured && (
                            <Badge variant="info" size="sm">{t('admin.featured')}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(product)} rounded="lg">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(product)} rounded="lg">
                            <Trash2 className="w-3.5 h-3.5 text-danger" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-3">
              <motion.div variants={containerAnim} initial="hidden" animate="show" className="space-y-3">
                {products.map((product) => {
                  const sb = stockBadge(product.stock);
                  return (
                    <motion.div
                      key={product.id}
                      variants={itemAnim}
                      className="bg-white rounded-2xl border border-gray-100 shadow-soft p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                          {product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold font-cairo text-gray-900 truncate">
                                {product.name}
                              </h3>
                              <p className="text-[10px] text-gray-400 font-cairo">{product.sku}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => openEditModal(product)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-gray-100 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(product)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-gray-100 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold font-cairo text-gray-900">
                                {formatPrice(product.price)}
                              </span>
                              {product.oldPrice && (
                                <span className="text-xs text-gray-400 font-cairo line-through">
                                  {formatPrice(product.oldPrice)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-accent text-accent" />
                              <span className="text-xs font-bold font-cairo text-gray-900">
                                {product.rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={sb.variant} size="sm">{sb.label} ({product.stock})</Badge>
                            {product.isFeatured && <Badge variant="info" size="sm">{t('admin.featured')}</Badge>}
                            <span className="text-xs text-gray-400 font-cairo">
                              {catMap[product.category] || product.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal
        isOpen={modalMode !== null}
        onClose={() => { setModalMode(null); setForm(emptyForm); }}
        title={modalMode === 'add' ? t('admin.addProduct') : t('admin.edit')}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('admin.productName')} value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder={t('admin.productName')} />
            <Input label={t('admin.productSlug')} value={form.slug} onChange={(e) => updateForm('slug', e.target.value)} placeholder="product-slug" dir="ltr" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label={t('admin.price')} type="number" value={form.price} onChange={(e) => updateForm('price', Number(e.target.value))} placeholder="0" min={0} />
            <Input label={t('admin.oldPrice')} type="number" value={form.oldPrice} onChange={(e) => updateForm('oldPrice', Number(e.target.value))} placeholder="0" min={0} />
            <Input label={t('admin.discount')} type="number" value={form.discount} onChange={(e) => updateForm('discount', Number(e.target.value))} placeholder="0" min={0} max={100} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label={t('admin.stock')} type="number" value={form.stock} onChange={(e) => updateForm('stock', Number(e.target.value))} placeholder="0" min={0} />
            <Input label={t('admin.sku')} value={form.sku} onChange={(e) => updateForm('sku', e.target.value)} placeholder="SKU-001" />
            <Select
              label={t('admin.category')}
              options={catList}
              value={form.category}
              onChange={(e) => updateForm('category', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t('admin.brand')}
              options={brandList}
              value={form.brand}
              onChange={(e) => updateForm('brand', e.target.value)}
            />
            <Input label={t('admin.tags')} value={form.tags} onChange={(e) => updateForm('tags', e.target.value)} placeholder="tag1, tag2, tag3" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700 font-cairo">{t('admin.shortDescription')}</label>
              <textarea
                dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                value={form.shortDescription}
                onChange={(e) => updateForm('shortDescription', e.target.value)}
                placeholder={t('admin.shortDescription')}
                className="w-full px-4 py-2.5 text-sm font-cairo bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary resize-y min-h-[80px] transition-all"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700 font-cairo">{t('admin.fullDescription')}</label>
              <textarea
                dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder={t('admin.fullDescription')}
                className="w-full px-4 py-2.5 text-sm font-cairo bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary resize-y min-h-[80px] transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700 font-cairo">
              {t('admin.productImages')}
            </label>
            <ImageUpload value={form.images} onChange={handleImages} bucket="products" max={5} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => updateForm('isFeatured', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-secondary focus:ring-secondary/30"
            />
            <span className="text-sm font-medium font-cairo text-gray-700">{t('admin.featuredProduct')}</span>
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => { setModalMode(null); setForm(emptyForm); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {modalMode === 'add' ? t('common.add') : t('common.saveChanges')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t('common.confirmDelete')}
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-danger" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-cairo">
              {t('admin.productDeleteConfirm')}
            </p>
            <p className="text-base font-bold font-cairo text-gray-900 mt-1">
              {deleteTarget?.name}
            </p>
            <p className="text-xs text-gray-400 font-cairo mt-1">
              {t('common.irreversibleAction')}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
