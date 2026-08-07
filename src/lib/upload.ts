import { supabase } from './supabase';

const STORAGE_BUCKETS = {
  products: 'product-images',
  brands: 'brand-logos',
  categories: 'category-images',
  avatars: 'avatars',
} as const;

export type StorageBucket = keyof typeof STORAGE_BUCKETS;

function getBucket(bucket: StorageBucket) {
  return STORAGE_BUCKETS[bucket];
}

function fileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() || 'jpg';
}

function fileName(bucket: StorageBucket, ext: string) {
  const id = crypto.randomUUID();
  return `${bucket}/${id}.${ext}`;
}

async function avatarFileName(ext: string, userId?: string) {
  let id = userId;
  if (!id) {
    const { data } = await supabase.auth.getSession();
    id = data.session?.user.id || crypto.randomUUID();
  }
  return `${id}.${ext}`;
}

export async function uploadImage(
  bucket: StorageBucket,
  file: File,
  userId?: string
): Promise<string> {
  const ext = fileExt(file.name);
  const path = bucket === 'avatars'
    ? await avatarFileName(ext, userId)
    : fileName(bucket, ext);

  const { error } = await supabase.storage
    .from(getBucket(bucket))
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(getBucket(bucket))
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
}

export async function deleteImage(url: string) {
  const { pathname } = new URL(url);
  const parts = pathname.split('/');
  const buckets = Object.values(STORAGE_BUCKETS);
  const bucketIdx = parts.findIndex((p) => buckets.includes(p as any));
  if (bucketIdx === -1) return;

  const path = parts.slice(bucketIdx).join('/');
  const bucket = parts[bucketIdx];
  if (!bucket || !buckets.includes(bucket as any)) return;

  await supabase.storage.from(bucket).remove([path]);
}
