-- ============================================================================
-- NAWA REBRAND MIGRATION — ZAHI (زاهي) → NAWA (نوى)
-- Run once in Supabase Dashboard → SQL Editor.
-- Every UPDATE is guarded by a WHERE on the OLD value → safe to re-run.
-- ============================================================================

-- ── 1) Coupon code ZAHI20 → NAWA20 ──────────────────────────────────────────
UPDATE coupons SET code = 'NAWA20' WHERE code = 'ZAHI20';
SELECT id, code, discount, type, min_order, expires_at FROM coupons
WHERE code IN ('NAWA20', 'ZAHI20') ORDER BY code;

-- ── 2) settings.store_info JSON brand name → نوى ───────────────────────────
UPDATE settings
SET    value = jsonb_set(value, '{name}', '"نوى"'::jsonb, true)
WHERE  key = 'store_info'
  AND  value->>'name' = 'زاهي';
SELECT key, value->>'name' AS name FROM settings WHERE key = 'store_info';

-- ── 3) store_settings default row → name نوى + email nawaeg.com ────────────
UPDATE store_settings
SET    name  = 'نوى',
       email = 'info@nawaeg.com'
WHERE  id = 'default'
  AND (name IN ('Zahi', 'زاهي') OR email IN ('info@zahieg.com', 'sales@zahieg.com'));
SELECT id, name, email, phone, description FROM store_settings WHERE id = 'default';

-- ── 4) Admin profile email/name ──────────────────────────────────────────────
-- NOTE (email-change): this updates ONLY `profiles`. The matching auth.users
-- email must ALSO be changed (Dashboard → Authentication → Users → Edit → set
-- admin@nawaeg.com), otherwise sign-in still uses the old address.
UPDATE profiles
SET    email = 'admin@nawaeg.com',
       name  = 'Nawa Admin'
WHERE  email = 'kiady@zahieg.com';
SELECT id, name, email, role FROM profiles
WHERE email IN ('kiady@zahieg.com', 'admin@nawaeg.com');

-- ── 5) Sweep residual brand strings in live data ─────────────────────────────
-- 5a) Any leftover store_info rows (safe no-op when already updated):
UPDATE settings
SET    value = jsonb_set(value, '{name}', '"نوى"'::jsonb, true)
WHERE  key = 'store_info' AND value->>'name' LIKE '%زاهي%';

-- 5b) store_settings description/name leftovers:
UPDATE store_settings SET description = REPLACE(description, 'زاهي', 'نوى')
WHERE id = 'default' AND description LIKE '%زاهي%';
UPDATE store_settings SET name = 'نوى'
WHERE id = 'default' AND name LIKE '%زاهي%';

-- 5c) Announcement / notification text (guarded: skip if table absent):
DO $$
BEGIN
  IF to_regclass('public.announcements') IS NOT NULL THEN
    UPDATE announcements SET text = REPLACE(text, 'زاهي', 'نوى')
    WHERE text LIKE '%زاهي%';
  END IF;
  IF to_regclass('public.notifications') IS NOT NULL THEN
    UPDATE notifications SET title = REPLACE(title, 'زاهي', 'نوى'),
                             message = REPLACE(message, 'زاهي', 'نوى')
    WHERE title LIKE '%زاهي%' OR message LIKE '%زاهي%';
  END IF;
END $$;

-- ── 6) Verification queries ──────────────────────────────────────────────────
SELECT count(*) AS remaining_zahi20          FROM coupons   WHERE code = 'ZAHI20';
SELECT count(*) AS remaining_old_emails      FROM profiles  WHERE email LIKE '%@zahieg.com' OR email LIKE '%@zahi.store';
SELECT count(*) AS remaining_old_store_names FROM store_settings WHERE name LIKE '%زاهي%' OR name LIKE '%Zahi%';
SELECT count(*) AS remaining_old_json_names  FROM settings  WHERE key = 'store_info' AND value->>'name' LIKE '%زاهي%';
