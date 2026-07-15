import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Edit3, Trash2, TrendingUp, TrendingDown,
  ArrowLeftRight, X,
} from 'lucide-react';
import { cn, formatDate } from '@/utils';
import { accountingService, ACCOUNTING_CATEGORIES } from '@/services/accountingService';
import { Button, Input, Select, Modal, Badge, EmptyState, Spinner } from '@/components/ui';
import { toast } from '@/components/ui';
import type { AccountingEntry } from '@/types';

const EXPENSE_CATS = ACCOUNTING_CATEGORIES.filter((c) => c.value !== 'sales' && c.value !== 'other_income');
const INCOME_CATS = ACCOUNTING_CATEGORIES.filter((c) => c.value === 'sales' || c.value === 'other_income');

function getCategoryLabel(value: string, lang: string) {
  const cat = ACCOUNTING_CATEGORIES.find((c) => c.value === value);
  return cat ? (lang === 'ar' ? cat.labelAr : cat.labelEn) : value;
}

interface FormState {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  entry_date: string;
}

const emptyForm: FormState = {
  type: 'expense',
  category: '',
  amount: 0,
  description: '',
  entry_date: new Date().toISOString().slice(0, 10),
};

export function AdminAccountsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<AccountingEntry | null>(null);
  const [editing, setEditing] = useState<AccountingEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, netProfit: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await accountingService.getEntries({ pageSize: 200 });
      setEntries(data);
      const s = await accountingService.getSummary();
      setSummary(s);
    } catch {
      toast.error(t('common.error'));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch = search
      ? e.description.toLowerCase().includes(q) ||
        getCategoryLabel(e.category, 'en').toLowerCase().includes(q) ||
        getCategoryLabel(e.category, 'ar').includes(q)
      : true;
    const matchesType = typeFilter ? e.type === typeFilter : true;
    const matchesCategory = categoryFilter ? e.category === categoryFilter : true;
    return matchesSearch && matchesType && matchesCategory;
  });

  async function handleSave() {
    if (!form.category) { toast.error(lang === 'ar' ? 'يرجى اختيار التصنيف' : 'Please select a category'); return; }
    if (!form.amount || form.amount <= 0) { toast.error(lang === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount'); return; }
    setSaving(true);
    try {
      if (editing) {
        await accountingService.updateEntry(editing.id, form);
        toast.success(lang === 'ar' ? 'تم تحديث القيد بنجاح' : 'Entry updated');
      } else {
        await accountingService.createEntry(form);
        toast.success(lang === 'ar' ? 'تم إضافة القيد بنجاح' : 'Entry added');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchData();
    } catch {
      toast.error(t('common.error'));
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteModal) return;
    try {
      await accountingService.deleteEntry(deleteModal.id);
      toast.success(lang === 'ar' ? 'تم حذف القيد بنجاح' : 'Entry deleted');
      setDeleteModal(null);
      fetchData();
    } catch {
      toast.error(t('common.error'));
    }
  }

  function openEdit(entry: AccountingEntry) {
    setEditing(entry);
    setForm({
      type: entry.type,
      category: entry.category,
      amount: entry.amount,
      description: entry.description,
      entry_date: entry.entry_date,
    });
    setModalOpen(true);
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  const typeOptions = [
    { value: '', label: lang === 'ar' ? 'الكل' : 'All' },
    { value: 'income', label: lang === 'ar' ? 'إيرادات' : 'Income' },
    { value: 'expense', label: lang === 'ar' ? 'مصروفات' : 'Expense' },
  ];

  const categoryFilterOptions = [
    { value: '', label: lang === 'ar' ? 'كل التصنيفات' : 'All Categories' },
    ...ACCOUNTING_CATEGORIES.map((c) => ({ value: c.value, label: lang === 'ar' ? c.labelAr : c.labelEn })),
  ];

  const formTypeOptions = [
    { value: 'expense', label: lang === 'ar' ? 'مصروف' : 'Expense' },
    { value: 'income', label: lang === 'ar' ? 'إيراد' : 'Income' },
  ];

  const currentCatOptions = (form.type === 'expense' ? EXPENSE_CATS : INCOME_CATS).map((c) => ({
    value: c.value,
    label: lang === 'ar' ? c.labelAr : c.labelEn,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 lg:p-6 space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-cairo text-gray-500">{lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Income'}</p>
              <p className="text-lg font-bold font-cairo text-gray-900">{summary.totalIncome.toLocaleString()} EGP</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-xs font-cairo text-gray-500">{lang === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</p>
              <p className="text-lg font-bold font-cairo text-gray-900">{summary.totalExpenses.toLocaleString()} EGP</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              summary.netProfit >= 0 ? 'bg-success/10' : 'bg-danger/10',
            )}>
              <ArrowLeftRight className={cn(
                'w-5 h-5',
                summary.netProfit >= 0 ? 'text-success' : 'text-danger',
              )} />
            </div>
            <div>
              <p className="text-xs font-cairo text-gray-500">{lang === 'ar' ? 'صافي الربح' : 'Net Profit'}</p>
              <p className={cn(
                'text-lg font-bold font-cairo',
                summary.netProfit >= 0 ? 'text-success' : 'text-danger',
              )}>
                {summary.netProfit >= 0 ? '+' : ''}{summary.netProfit.toLocaleString()} EGP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl lg:text-2xl font-bold font-cairo text-gray-900">
          {lang === 'ar' ? 'دفتر الحسابات' : 'Accounts'}
        </h1>
        <Button variant="primary" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          {lang === 'ar' ? 'قيد جديد' : 'New Entry'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
            className="pr-10"
          />
        </div>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={typeOptions} className="w-36" placeholder="" />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={categoryFilterOptions} className="w-44" placeholder="" />
        {(typeFilter || categoryFilter || search) && (
          <button
            onClick={() => { setTypeFilter(''); setCategoryFilter(''); setSearch(''); }}
            className="text-xs text-secondary hover:underline font-cairo flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            {lang === 'ar' ? 'مسح الفلتر' : 'Clear filters'}
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={lang === 'ar' ? 'لا توجد قيود' : 'No entries'}
          description={lang === 'ar' ? 'لم يتم تسجيل أي قيود بعد' : 'No accounting entries recorded yet'}
          icon={<ArrowLeftRight className="w-12 h-12 text-gray-300" />}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-right px-4 py-3 text-xs font-bold font-cairo text-gray-500">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold font-cairo text-gray-500">{lang === 'ar' ? 'النوع' : 'Type'}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold font-cairo text-gray-500">{lang === 'ar' ? 'التصنيف' : 'Category'}</th>
                  <th className="text-right px-4 py-3 text-xs font-bold font-cairo text-gray-500">{lang === 'ar' ? 'الوصف' : 'Description'}</th>
                  <th className="text-left px-4 py-3 text-xs font-bold font-cairo text-gray-500">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  <th className="text-center px-4 py-3 text-xs font-bold font-cairo text-gray-500">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-cairo text-gray-700">
                      {formatDate(entry.entry_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={entry.type === 'income' ? 'success' : 'danger'} size="sm">
                        {entry.type === 'income'
                          ? (lang === 'ar' ? 'إيراد' : 'Income')
                          : (lang === 'ar' ? 'مصروف' : 'Expense')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-cairo text-gray-700">
                      {getCategoryLabel(entry.category, lang)}
                    </td>
                    <td className="px-4 py-3 text-sm font-cairo text-gray-500 max-w-[200px] truncate">
                      {entry.description || '—'}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-sm font-bold font-cairo text-left',
                      entry.type === 'income' ? 'text-success' : 'text-danger',
                    )}>
                      {entry.type === 'income' ? '+' : '-'}{Number(entry.amount).toLocaleString()} EGP
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(entry)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal(entry)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); }}
        title={editing
          ? (lang === 'ar' ? 'تعديل القيد' : 'Edit Entry')
          : (lang === 'ar' ? 'قيد جديد' : 'New Entry')}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label={lang === 'ar' ? 'النوع' : 'Type'}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'income' | 'expense', category: '' })}
            options={formTypeOptions}
          />
          <Select
            label={lang === 'ar' ? 'التصنيف' : 'Category'}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={[
              { value: '', label: lang === 'ar' ? 'اختر التصنيف' : 'Select category' },
              ...currentCatOptions,
            ]}
          />
          <Input
            label={lang === 'ar' ? 'المبلغ (EGP)' : 'Amount (EGP)'}
            type="number"
            value={form.amount || ''}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            min={0}
            step="0.01"
          />
          <Input
            label={lang === 'ar' ? 'التاريخ' : 'Date'}
            type="date"
            value={form.entry_date}
            onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
          />
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700 font-cairo">
              {lang === 'ar' ? 'الوصف' : 'Description'}
            </label>
            <textarea
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={lang === 'ar' ? 'وصف القيد...' : 'Entry description...'}
              className="w-full px-4 py-2.5 text-sm font-cairo bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary resize-y min-h-[80px] transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditing(null); setForm(emptyForm); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editing ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title={t('common.confirmDelete')}
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-7 h-7 text-danger" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-cairo">
              {lang === 'ar' ? 'هل أنت متأكد من حذف هذا القيد؟' : 'Are you sure you want to delete this entry?'}
            </p>
            {deleteModal && (
              <p className="text-base font-bold font-cairo text-gray-900 mt-1">
                {getCategoryLabel(deleteModal.category, lang)} — {Number(deleteModal.amount).toLocaleString()} EGP
              </p>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteModal(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
