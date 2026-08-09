import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/utils';
import { uploadImage, deleteImage, type StorageBucket } from '@/lib/upload';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket: StorageBucket;
  max?: number;
}

export function ImageUpload({ value, onChange, bucket, max = 5 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (value.length >= max || uploading) return;
    setUploading(true);
    try {
      const publicUrl = await uploadImage(bucket, file);
      onChange([...value, publicUrl]);
    } catch {
      /* toast handled by parent */
    }
    setUploading(false);
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) handleFile(file);
    e.target.value = '';
  };

  async function remove(index: number) {
    const url = value[index];
    onChange(value.filter((_, i) => i !== index));
    try { await deleteImage(url); } catch { /* ignore */ }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {value.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={cn(
              'w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors',
              dragging ? 'border-secondary bg-secondary/5' : 'border-gray-300 hover:border-secondary',
              uploading && 'opacity-50 pointer-events-none'
            )}
          >
            {uploading
              ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              : <Upload className="w-5 h-5 text-gray-400" />
            }
            <input ref={inputRef} type="file" accept="image/*" onChange={handleInput} className="hidden" />
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 font-cairo">{value.length}/{max}</p>
    </div>
  );
}
