import { supabase } from '@/lib/supabase';
import type {
  AccountGroup,
  AccountGroupNode,
  AccountsTree,
  AccountType,
  LedgerAccount,
} from '@/types';

interface GroupRow {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AccountRow {
  id: string;
  group_id: string | null;
  name: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  updated_at: string;
}

const MAX_DEPTH = 25;

export function mapGroup(row: GroupRow): AccountGroup {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAccount(row: AccountRow): LedgerAccount {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    type: row.type as AccountType,
    amount: Number(row.amount),
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildGroupNode(
  group: AccountGroup,
  groupsByParent: Map<string, AccountGroup[]>,
  accountsByGroup: Map<string, LedgerAccount[]>,
  visited: Set<string>,
  depth: number,
): AccountGroupNode {
  const node: AccountGroupNode = {
    ...group,
    children: [],
    accounts: [],
    incomeTotal: 0,
    expenseTotal: 0,
    total: 0,
    totalGroups: 0,
    totalAccounts: 0,
  };

  if (depth >= MAX_DEPTH || visited.has(group.id)) return node;
  visited.add(group.id);

  const childGroups = groupsByParent.get(group.id) || [];
  for (const child of childGroups) {
    const childNode = buildGroupNode(child, groupsByParent, accountsByGroup, visited, depth + 1);
    node.children.push(childNode);
    node.incomeTotal += childNode.incomeTotal;
    node.expenseTotal += childNode.expenseTotal;
    node.totalGroups += 1 + childNode.totalGroups;
    node.totalAccounts += childNode.totalAccounts;
  }

  node.accounts = accountsByGroup.get(group.id) || [];
  for (const account of node.accounts) {
    if (account.type === 'income') node.incomeTotal += account.amount;
    else node.expenseTotal += account.amount;
    node.totalAccounts += 1;
  }

  node.total = node.incomeTotal - node.expenseTotal;
  return node;
}

export function buildAccountsTree(groups: AccountGroup[], accounts: LedgerAccount[]): AccountsTree {
  const groupsByParent = new Map<string, AccountGroup[]>();
  const accountsByGroup = new Map<string, LedgerAccount[]>();
  const visited = new Set<string>();

  for (const group of groups) {
    const key = group.parentId || 'root';
    const arr = groupsByParent.get(key) || [];
    arr.push(group);
    groupsByParent.set(key, arr);
  }

  for (const account of accounts) {
    if (!account.groupId) continue;
    const arr = accountsByGroup.get(account.groupId) || [];
    arr.push(account);
    accountsByGroup.set(account.groupId, arr);
  }

  const rootGroups = (groupsByParent.get('root') || []).map((group) =>
    buildGroupNode(group, groupsByParent, accountsByGroup, visited, 0)
  );

  return {
    rootGroups,
    rootAccounts: accounts.filter((account) => !account.groupId),
    allGroups: groups,
  };
}

export const accountGroupsService = {
  async listGroups(): Promise<AccountGroup[]> {
    const { data, error } = await supabase
      .from('account_groups')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(mapGroup);
  },

  async listAccounts(): Promise<LedgerAccount[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data || []).map(mapAccount);
  },

  async getAccountsTree(): Promise<AccountsTree> {
    const [groups, accounts] = await Promise.all([this.listGroups(), this.listAccounts()]);
    return buildAccountsTree(groups, accounts);
  },

  async createGroup(params: { name: string; parentId?: string | null }): Promise<AccountGroup> {
    const { data, error } = await supabase
      .from('account_groups')
      .insert([{ name: params.name, parent_id: params.parentId || null }])
      .select()
      .single();
    if (error) throw error;
    return mapGroup(data);
  },

  async renameGroup(id: string, name: string): Promise<AccountGroup> {
    const { data, error } = await supabase
      .from('account_groups')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapGroup(data);
  },

  async deleteGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('account_groups')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async createAccount(params: {
    name: string;
    groupId?: string | null;
    type: AccountType;
    amount: number;
    description?: string;
  }): Promise<LedgerAccount> {
    const { data, error } = await supabase
      .from('accounts')
      .insert([{
        name: params.name,
        group_id: params.groupId || null,
        type: params.type,
        amount: params.amount,
        description: params.description || '',
      }])
      .select()
      .single();
    if (error) throw error;
    return mapAccount(data);
  },

  async updateAccount(id: string, updates: Partial<LedgerAccount>): Promise<LedgerAccount> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.groupId !== undefined) dbUpdates.group_id = updates.groupId;

    const { data, error } = await supabase
      .from('accounts')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapAccount(data);
  },

  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
