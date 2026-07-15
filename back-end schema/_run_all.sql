-- ============================================================================
-- ZAHIEG - Comprehensive Database Schema
-- Run files in this exact order to respect foreign key dependencies
-- Each file is idempotent (safe to run multiple times)
-- ============================================================================
-- USAGE:
--   Option A: psql -U user -d database -f _run_all.sql
--   Option B: Copy-paste each file into Supabase SQL Editor in order
--   Option C: Execute individual files for specific tables only
-- ============================================================================

-- Step 1: Enums & Core data tables (no dependencies)
\i '01_categories_brands.sql'

-- Step 2: Products (depends on categories, brands)
\i '02_products.sql'

-- Step 3: Auth profiles (linked to auth.users via trigger)
\i '03_profiles.sql'

-- Step 4: User addresses (depends on profiles)
\i '04_addresses.sql'

-- Step 5: Cart & Wishlist (depends on profiles, products)
\i '05_cart_wishlist.sql'

-- Step 6: Orders & Order Items (depends on profiles, products)
\i '06_orders.sql'

-- Step 7: Reviews (depends on profiles, products)
\i '07_reviews.sql'

-- Step 8: Coupons (standalone)
\i '08_coupons.sql'

-- Step 9: Notifications (depends on profiles)
\i '09_notifications.sql'

-- Step 10: Spin Wheel (depends on profiles)
\i '10_spin_wheel.sql'

-- Step 11: Marketing tables (standalone)
\i '11_marketing.sql'

-- Step 12: Settings (standalone)
\i '12_settings.sql'

-- Step 13: Optional features (depends on profiles, products)
\i '13_optional_features.sql'

-- Step 14: Storage Buckets (documentation only - run manually)
-- \i '14_storage_buckets.sql'

-- Step 15: Cross-cutting Functions & Triggers
\i '17_functions_triggers.sql'

-- Step 16: Indexes (after all tables exist)
\i '16_indexes.sql'

-- Step 17: Dashboard Views (after all tables exist)
\i '18_dashboard_views.sql'

-- Step 18: RLS Policies (after all tables exist)
\i '15_rls_policies.sql'

-- Step 19: Accounting / Bookkeeping Module
\i '19_accounting.sql'

-- Step 20: Storage Buckets & RLS for image uploads
-- Note: Requires service_role key; alternatively create buckets via Dashboard first
-- \i '../uploadimages.sql'
