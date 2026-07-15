import { supabase } from '@/lib/supabase';
import type { AccountingEntry } from '@/types';

export const ACCOUNTING_CATEGORIES = [
  { value: 'fabric', labelAr: 'القماش', labelEn: 'Fabric' },
  { value: 'factory', labelAr: 'تكلفة المصنع', labelEn: 'Factory Cost' },
  { value: 'labor', labelAr: 'عمالة', labelEn: 'Labor' },
  { value: 'packaging', labelAr: 'تغليف', labelEn: 'Packaging' },
  { value: 'shipping', labelAr: 'شحن', labelEn: 'Shipping' },
  { value: 'marketing', labelAr: 'تسويق', labelEn: 'Marketing' },
  { value: 'rent', labelAr: 'إيجار', labelEn: 'Rent' },
  { value: 'utilities', labelAr: 'مرافق', labelEn: 'Utilities' },
  { value: 'maintenance', labelAr: 'صيانة', labelEn: 'Maintenance' },
  { value: 'supplies', labelAr: 'مستلزمات', labelEn: 'Supplies' },
  { value: 'taxes', labelAr: 'ضرائب', labelEn: 'Taxes' },
  { value: 'other_expense', labelAr: 'مصروفات أخرى', labelEn: 'Other Expense' },
  { value: 'sales', labelAr: 'مبيعات', labelEn: 'Sales' },
  { value: 'other_income', labelAr: 'إيرادات أخرى', labelEn: 'Other Income' },
];

export const accountingService = {
  async getEntries(options?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }) {
    let query = supabase
      .from('accounting_entries')
      .select('*', { count: 'exact' })
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (options?.startDate) query = query.gte('entry_date', options.startDate);
    if (options?.endDate) query = query.lte('entry_date', options.endDate);
    if (options?.type) query = query.eq('type', options.type);
    if (options?.category) query = query.eq('category', options.category);

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data || []) as AccountingEntry[], count: count || 0 };
  },

  async createEntry(entry: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description?: string;
    entry_date: string;
  }) {
    const { data, error } = await supabase
      .from('accounting_entries')
      .insert([{ ...entry, description: entry.description || '' }])
      .select()
      .single();
    if (error) throw error;
    return data as AccountingEntry;
  },

  async updateEntry(id: string, updates: Partial<AccountingEntry>) {
    const { data, error } = await supabase
      .from('accounting_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as AccountingEntry;
  },

  async deleteEntry(id: string) {
    const { error } = await supabase
      .from('accounting_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getSummary(startDate?: string, endDate?: string) {
    let query = supabase.from('accounting_entries').select('type, amount');
    if (startDate) query = query.gte('entry_date', startDate);
    if (endDate) query = query.lte('entry_date', endDate);

    const { data, error } = await query;
    if (error) throw error;

    const entries = (data || []) as Pick<AccountingEntry, 'type' | 'amount'>[];
    const totalIncome = entries
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpenses = entries
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      count: entries.length,
    };
  },
};
