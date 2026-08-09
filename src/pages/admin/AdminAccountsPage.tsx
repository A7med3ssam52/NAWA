import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Plus, Search, Edit3, Trash2, TrendingUp, TrendingDown,
  ArrowLeftRight, X, Folder, ChevronLeft,
} from 'lucide-react';
import { cn, formatDate, formatPrice } from '@/utils';
import { accountingService, ACCOUNTING_CATEGORIES } from '@/services/accountingService';
import { accountGroupsService } from '@/services/accountGroupsService';
import { Button, Input, Select, Modal, Badge, EmptyState, Spinner, Card, Tabs } from '@/components/ui';
import { toast } from '@/components/ui';
import type {
  AccountingEntry,
  AccountGroup,
  AccountGroupNode,
  AccountsTree,
  AccountType,
  LedgerAccount,
} from '@/types';

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

interface AccountFormState {
  name: string;
  type: AccountType;
  amount: number;
  description: string;
}

const emptyAccountForm: AccountFormState = {
  name: '',
  type: 'expense',
  amount: 0,
  description: '',
};

function findGroupNode(groups: AccountGroupNode[], id: string): AccountGroupNode | null {
  for (const group of groups) {
    if (group.id === id) return group;
    const found = findGroupNode(group.children, id);
    if (found) return found;
  }
  return null;
}

export function AdminAccountsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [searchParams, setSearchParams] = useSearchParams();
  const currentGroupId = searchParams.get('group');
  const [tab, setTab] = useState('groups');
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
  const [tree, setTree] = useState<AccountsTree | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AccountGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [deleteGroupModal, setDeleteGroupModal] = useState<AccountGroup | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<LedgerAccount | null>(null);
  const [accountForm, setAccountForm] = useState<AccountFormState>(emptyAccountForm);
  const [savingAccount, setSavingAccount] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState<LedgerAccount | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesRes, summaryRes, treeRes] = await Promise.all([
        accountingService.getEntries({ pageSize: 200 }),
        accountingService.getSummary(),
        accountGroupsService.getAccountsTree(),
      ]);
      setEntries(entriesRes.data);
      setSummary(summaryRes);
      setTree(treeRes);
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

  const currentGroup = useMemo(() => {
    if (!tree || !currentGroupId) return null;
    return tree.allGroups.find((g) => g.id === currentGroupId) || null;
  }, [tree, currentGroupId]);

  useEffect(() => {
    if (currentGroupId && tree && !tree.allGroups.some((g) => g.id === currentGroupId)) {
      setSearchParams({}, { replace: true });
    }
  }, [currentGroupId, tree, setSearchParams]);

  const breadcrumbs = useMemo(() => {
    if (!currentGroup) return [];
    const chain: AccountGroup[] = [];
    const visited = new Set<string>();
    let node: AccountGroup | null = currentGroup;
    while (node && !visited.has(node.id)) {
      visited.add(node.id);
      chain.unshift(node);
      node = node.parentId ? (tree?.allGroups.find((g) => g.id === node!.parentId) || null) : null;
    }
    return chain;
  }, [currentGroup, tree]);

  const levelNode = useMemo(() => {
    if (!tree || !currentGroupId) return null;
    return findGroupNode(tree.rootGroups, currentGroupId);
  }, [tree, currentGroupId]);

  const levelGroups = currentGroupId ? (levelNode?.children || []) : (tree?.rootGroups || []);
  const levelAccounts = currentGroupId ? (levelNode?.accounts || []) : (tree?.rootAccounts || []);

  const levelTotals = useMemo(() => {
    if (levelNode) {
      return { totalIncome: levelNode.incomeTotal, totalExpenses: levelNode.expenseTotal, netTotal: levelNode.total };
    }
    const rootIncome = tree?.rootAccounts
      .filter((a) => a.type === 'income')
      .reduce((s, a) => s + a.amount, 0) || 0;
    const rootExpenses = tree?.rootAccounts
      .filter((a) => a.type === 'expense')
      .reduce((s, a) => s + a.amount, 0) || 0;
    const groupsIncome = tree?.rootGroups.reduce((s, g) => s + g.incomeTotal, 0) || 0;
    const groupsExpenses = tree?.rootGroups.reduce((s, g) => s + g.expenseTotal, 0) || 0;
    const totalIncome = rootIncome + groupsIncome;
    const totalExpenses = rootExpenses + groupsExpenses;
    return { totalIncome, totalExpenses, netTotal: totalIncome - totalExpenses };
  }, [tree, levelNode]);

  const deleteGroupNode = deleteGroupModal && tree ? findGroupNode(tree.rootGroups, deleteGroupModal.id) : null;

  function openGroupAdd() {
    setEditingGroup(null);
    setGroupName('');
    setGroupModalOpen(true);
  }

  function openGroupEdit(group: AccountGroup) {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupModalOpen(true);
  }

  function closeGroupModal() {
    setGroupModalOpen(false);
    setEditingGroup(null);
    setGroupName('');
  }

  async function handleGroupSave() {
    if (!groupName.trim()) { toast.error(t('admin.groupNameRequired')); return; }
    setSavingGroup(true);
    try {
      if (editingGroup) {
        await accountGroupsService.renameGroup(editingGroup.id, groupName.trim());
        toast.success(t('admin.groupUpdated'));
      } else {
        await accountGroupsService.createGroup({ name: groupName.trim(), parentId: currentGroupId });
        toast.success(t('admin.groupAdded'));
      }
      closeGroupModal();
      fetchData();
    } catch {
      toast.error(t('admin.saveError6'));
    } finally {
      setSavingGroup(false);
    }
  }

  async function handleDeleteGroup() {
    if (!deleteGroupModal) return;
    try {
      await accountGroupsService.deleteGroup(deleteGroupModal.id);
      toast.success(t('admin.groupDeleted'));
      if (currentGroupId === deleteGroupModal.id) setSearchParams({});
      setDeleteGroupModal(null);
      fetchData();
    } catch {
      toast.error(t('admin.saveError6'));
    }
  }

  function openAccountAdd() {
    setEditingAccount(null);
    setAccountForm(emptyAccountForm);
    setAccountModalOpen(true);
  }

  function openAccountEdit(account: LedgerAccount) {
    setEditingAccount(account);
    setAccountForm({
      name: account.name,
      type: account.type,
      amount: account.amount,
      description: account.description,
    });
    setAccountModalOpen(true);
  }

  function closeAccountModal() {
    setAccountModalOpen(false);
    setEditingAccount(null);
    setAccountForm(emptyAccountForm);
  }

  async function handleAccountSave() {
    if (!accountForm.name.trim()) { toast.error(t('admin.accountNameRequired')); return; }
    setSavingAccount(true);
    try {
      if (editingAccount) {
        await accountGroupsService.updateAccount(editingAccount.id, {
          name: accountForm.name.trim(),
          type: accountForm.type,
          amount: Number(accountForm.amount),
          description: accountForm.description,
        });
        toast.success(t('admin.accountUpdated'));
      } else {
        await accountGroupsService.createAccount({
          name: accountForm.name.trim(),
          groupId: currentGroupId,
          type: accountForm.type,
          amount: Number(accountForm.amount),
          description: accountForm.description,
        });
        toast.success(t('admin.accountAdded'));
      }
      closeAccountModal();
      fetchData();
    } catch {
      toast.error(t('admin.saveError6'));
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deleteAccountModal) return;
    try {
      await accountGroupsService.deleteAccount(deleteAccountModal.id);
      toast.success(t('admin.accountDeleted'));
      setDeleteAccountModal(null);
      fetchData();
    } catch {
      toast.error(t('admin.saveError6'));
    }
  }

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

  const accountTypeOptions = [
    { value: 'income', label: t('admin.incomeType') },
    { value: 'expense', label: t('admin.expenseType') },
  ];

  const pageTabs = [
    { id: 'groups', label: t('admin.groupsTab') },
    { id: 'entries', label: t('admin.entriesTab') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 lg:p-6 space-y-6"
    >
      <Tabs tabs={pageTabs} activeTab={tab} onChange={setTab} />

      {tab === 'groups' && (
        <>
          {/* Breadcrumb + Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 text-sm font-cairo">
              <Link to="/admin/accounts" className="text-secondary hover:underline font-medium">
                {lang === 'ar' ? 'دفتر الحسابات' : 'Accounts'}
              </Link>
              {breadcrumbs.map((group, i) => (
                <span key={group.id} className="flex items-center gap-1.5">
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-bold text-gray-900">{group.name}</span>
                  ) : (
                    <Link to={`/admin/accounts?group=${group.id}`} className="text-secondary hover:underline font-medium">
                      {group.name}
                    </Link>
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={openGroupAdd}>
                <Plus className="w-4 h-4" />
                {t('admin.newGroup')}
              </Button>
              <Button variant="primary" onClick={openAccountAdd}>
                <Plus className="w-4 h-4" />
                {t('admin.newAccount')}
              </Button>
            </div>
          </div>

          {/* Level Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs font-cairo text-gray-500">{t('admin.incomeType')}</p>
                  <p className="text-lg font-bold font-cairo text-gray-900">{formatPrice(levelTotals.totalIncome)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="text-xs font-cairo text-gray-500">{t('admin.expenseType')}</p>
                  <p className="text-lg font-bold font-cairo text-gray-900">{formatPrice(levelTotals.totalExpenses)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  levelTotals.netTotal >= 0 ? 'bg-success/10' : 'bg-danger/10',
                )}>
                  <ArrowLeftRight className={cn(
                    'w-5 h-5',
                    levelTotals.netTotal >= 0 ? 'text-success' : 'text-danger',
                  )} />
                </div>
                <div>
                  <p className="text-xs font-cairo text-gray-500">{t('admin.groupTotal')}</p>
                  <p className={cn(
                    'text-lg font-bold font-cairo',
                    levelTotals.netTotal >= 0 ? 'text-success' : 'text-danger',
                  )}>
                    {formatPrice(levelTotals.netTotal)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : levelGroups.length === 0 && levelAccounts.length === 0 ? (
            <>
              <EmptyState
                icon={<Folder className="w-12 h-12 text-gray-300" />}
                title={t('admin.noGroups')}
                description={t('admin.noGroupsDesc')}
              />
              <div className="flex items-center justify-center gap-3">
                <Button variant="secondary" onClick={openGroupAdd}>
                  <Plus className="w-4 h-4" />
                  {t('admin.newGroup')}
                </Button>
                <Button variant="primary" onClick={openAccountAdd}>
                  <Plus className="w-4 h-4" />
                  {t('admin.newAccount')}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Groups */}
              {levelGroups.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold font-cairo text-gray-900">{t('admin.groupsTab')}</h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {levelGroups.map((group) => (
                      <div key={group.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                        <button
                          onClick={() => setSearchParams({ group: group.id })}
                          className="flex items-center gap-3 min-w-0 flex-1 text-right"
                        >
                          <Folder className="w-4 h-4 text-secondary shrink-0" />
                          <span className="text-sm font-bold font-cairo text-gray-900 truncate">{group.name}</span>
                          <Badge variant="secondary" size="sm">
                            {t('admin.accountsCount', { count: group.totalAccounts })}
                          </Badge>
                        </button>
                        <span className={cn(
                          'text-sm font-bold font-cairo shrink-0',
                          group.total >= 0 ? 'text-success' : 'text-danger',
                        )}>
                          {formatPrice(group.total)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openGroupEdit(group)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteGroupModal(group)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounts */}
              {levelAccounts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold font-cairo text-gray-900">{t('admin.accounts')}</h2>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {levelAccounts.map((account) => (
                      <div key={account.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-sm font-bold font-cairo text-gray-900 truncate">{account.name}</span>
                          <Badge variant={account.type === 'income' ? 'success' : 'danger'} size="sm">
                            {account.type === 'income' ? t('admin.incomeType') : t('admin.expenseType')}
                          </Badge>
                        </div>
                        <span className={cn(
                          'text-sm font-bold font-cairo shrink-0',
                          account.type === 'income' ? 'text-success' : 'text-danger',
                        )}>
                          {formatPrice(account.amount)}
                        </span>
                        {account.description && (
                          <span className="text-xs font-cairo text-gray-500 max-w-[200px] truncate shrink-0">
                            {account.description}
                          </span>
                        )}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openAccountEdit(account)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteAccountModal(account)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/5 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'entries' && (
        <>
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
        <>
        <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
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

        <div className="lg:hidden space-y-3">
          {filtered.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Card padding="md">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={entry.type === 'income' ? 'success' : 'danger'} size="sm">
                    {entry.type === 'income'
                      ? (lang === 'ar' ? 'إيراد' : 'Income')
                      : (lang === 'ar' ? 'مصروف' : 'Expense')}
                  </Badge>
                  <span className="text-xs font-cairo text-gray-400">{formatDate(entry.entry_date)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-cairo text-gray-700 truncate">{getCategoryLabel(entry.category, lang)}</p>
                    <p className="text-xs font-cairo text-gray-500 truncate mt-0.5">{entry.description || '—'}</p>
                  </div>
                  <span className={cn(
                    'text-sm font-bold font-cairo shrink-0',
                    entry.type === 'income' ? 'text-success' : 'text-danger',
                  )}>
                    {entry.type === 'income' ? '+' : '-'}{Number(entry.amount).toLocaleString()} EGP
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
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
              </Card>
            </motion.div>
          ))}
        </div>
        </>
      )}
        </>
      )}

      {/* Group Modal */}
      <Modal
        isOpen={groupModalOpen}
        onClose={closeGroupModal}
        title={editingGroup ? t('admin.renameGroup') : t('admin.newGroup')}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={t('admin.groupName')}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t('admin.groupName')}
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={closeGroupModal}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleGroupSave} loading={savingGroup}>
              {editingGroup ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Group Confirm Modal */}
      <Modal
        isOpen={!!deleteGroupModal}
        onClose={() => setDeleteGroupModal(null)}
        title={t('common.confirmDelete')}
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-7 h-7 text-danger" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-cairo">
              {t('admin.deleteGroupConfirm', {
                groups: deleteGroupNode?.totalGroups || 0,
                accounts: deleteGroupNode?.totalAccounts || 0,
              })}
            </p>
            <p className="text-xs text-danger font-cairo mt-2">{t('admin.deleteGroupCascadeWarning')}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteGroupModal(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteGroup}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Account Modal */}
      <Modal
        isOpen={accountModalOpen}
        onClose={closeAccountModal}
        title={editingAccount ? t('admin.editAccount') : t('admin.newAccount')}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label={t('admin.accountName')}
            value={accountForm.name}
            onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
            placeholder={t('admin.accountName')}
            autoFocus
          />
          <Select
            label={lang === 'ar' ? 'النوع' : 'Type'}
            value={accountForm.type}
            onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value as AccountType })}
            options={accountTypeOptions}
          />
          <Input
            label={t('admin.accountAmount')}
            type="number"
            value={accountForm.amount || ''}
            onChange={(e) => setAccountForm({ ...accountForm, amount: Number(e.target.value) })}
            min={0}
            step="0.01"
          />
          <Input
            label={lang === 'ar' ? 'الوصف' : 'Description'}
            value={accountForm.description}
            onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
            placeholder={lang === 'ar' ? 'وصف الحساب...' : 'Account description...'}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={closeAccountModal}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAccountSave} loading={savingAccount}>
              {editingAccount ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirm Modal */}
      <Modal
        isOpen={!!deleteAccountModal}
        onClose={() => setDeleteAccountModal(null)}
        title={t('common.confirmDelete')}
        size="sm"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
            <Trash2 className="w-7 h-7 text-danger" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-cairo">
              {t('common.confirmDeleteQuestion', { item: deleteAccountModal?.name || '' })}
            </p>
            {deleteAccountModal && (
              <p className="text-base font-bold font-cairo text-gray-900 mt-1">
                {deleteAccountModal.name} — {formatPrice(deleteAccountModal.amount)}
              </p>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" onClick={() => setDeleteAccountModal(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

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
