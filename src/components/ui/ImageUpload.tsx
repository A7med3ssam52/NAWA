import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/utils';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function ImageUpload({ value, onChange, max = 5 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (value.length >= max) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange([...value, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) handleFile(file);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {value.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => remove(i)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors',
              dragging ? 'border-secondary bg-secondary/5' : 'border-gray-300 hover:border-secondary'
            )}
          >
            <Upload className="w-5 h-5 text-gray-400" />
            <input ref={inputRef} type="file" accept="image/*" onChange={handleInput} className="hidden" />
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 font-cairo">{value.length}/{max} صور</p>
    </div>
  );
}
