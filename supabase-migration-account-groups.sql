-- Migration: nested account groups + accounts inside the Accounts section
-- Run this once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS account_groups (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    parent_id  UUID NULL REFERENCES account_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NULL REFERENCES account_groups(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('income','expense')),
    amount      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_groups_parent_id ON account_groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_accounts_group_id ON accounts(group_id);

CREATE OR REPLACE FUNCTION update_account_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_account_groups_updated_at ON account_groups;
CREATE TRIGGER trg_account_groups_updated_at
    BEFORE UPDATE ON account_groups
    FOR EACH ROW EXECUTE FUNCTION update_account_groups_updated_at();

CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON accounts;
CREATE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_accounts_updated_at();

ALTER TABLE account_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "account_groups_select" ON account_groups;
CREATE POLICY "account_groups_select" ON account_groups FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "account_groups_insert" ON account_groups;
CREATE POLICY "account_groups_insert" ON account_groups FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "account_groups_update" ON account_groups;
CREATE POLICY "account_groups_update" ON account_groups FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "account_groups_delete" ON account_groups;
CREATE POLICY "account_groups_delete" ON account_groups FOR DELETE USING (is_admin());

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "accounts_select" ON accounts;
CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "accounts_insert" ON accounts;
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "accounts_update" ON accounts;
DROP POLICY IF EXISTS "accounts_delete" ON accounts;
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING (is_admin());
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING (is_admin());
