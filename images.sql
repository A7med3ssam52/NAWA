-- ============================================================================
-- ZAHIEG - Product Images Storage
-- Run this in Supabase SQL Editor to set up product images storage
-- After running, upload images via Supabase Dashboard > Storage > product-images
-- Or use the admin panel's ImageUpload component
-- ============================================================================

-- ── Create Storage Bucket ──────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ───────────────────────────────────────────────

-- Public read (anyone can view product images)
CREATE POLICY "product_images_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin insert (only admins can upload)
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

-- Admin delete (only admins can delete)
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin());
