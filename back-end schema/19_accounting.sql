-- ============================================================================
-- ZAHIEG - Accounting / Bookkeeping Module
-- Simple ledger for recording expenses, income, and tracking net profit
-- ============================================================================

-- 19.1 Accounting Entries (core ledger table)
CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT DEFAULT '',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 19.2 Indexes
CREATE INDEX IF NOT EXISTS idx_accounting_entries_date ON accounting_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_type ON accounting_entries(type);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_category ON accounting_entries(category);

-- 19.3 Row-Level Security
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

-- Admins can read all entries
CREATE POLICY "Admins can read accounting_entries"
  ON accounting_entries FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert entries
CREATE POLICY "Admins can insert accounting_entries"
  ON accounting_entries FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update entries
CREATE POLICY "Admins can update accounting_entries"
  ON accounting_entries FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete entries
CREATE POLICY "Admins can delete accounting_entries"
  ON accounting_entries FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 19.4 Auto-update updated_at
CREATE OR REPLACE FUNCTION update_accounting_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_accounting_entries_updated_at ON accounting_entries;
CREATE TRIGGER trg_accounting_entries_updated_at
  BEFORE UPDATE ON accounting_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_accounting_entries_updated_at();
