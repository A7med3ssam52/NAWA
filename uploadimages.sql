-- ============================================================================
-- ZAHIEG - Image Upload Storage
-- Create storage buckets and RLS policies for image uploads
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ── Create Storage Buckets ──────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('brand-logos', 'brand-logos', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('category-images', 'category-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ───────────────────────────────────────────────

-- Product Images: Public read, Admin write/delete
CREATE POLICY "product_images_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());

-- Brand Logos: Public read, Admin write
CREATE POLICY "brand_logos_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-logos');

CREATE POLICY "brand_logos_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-logos' AND is_admin());

CREATE POLICY "brand_logos_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-logos' AND is_admin());

-- Category Images: Public read, Admin write
CREATE POLICY "category_images_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'category-images');

CREATE POLICY "category_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'category-images' AND is_admin());

CREATE POLICY "category_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'category-images' AND is_admin());

-- Avatars: Public read, Owner write
CREATE POLICY "avatars_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
