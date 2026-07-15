import { useTheme } from '@/contexts/ThemeContext';
import { Palette } from 'lucide-react';

const palettes = {
  taupe: { label: 'باليت 1', bg: 'bg-[#635352]' },
  terracotta: { label: 'باليت 2', bg: 'bg-[#C84913]' },
} as const;

export function PaletteToggle() {
  const { palette, togglePalette } = useTheme();
  const current = palettes[palette];
  const next = palette === 'taupe' ? palettes.terracotta : palettes.taupe;

  return (
    <button
      onClick={togglePalette}
      className="fixed bottom-24 right-4 z-[60] flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-soft-lg hover:shadow-xl transition-all duration-300 active:scale-95 group"
      aria-label="تغيير الألوان"
      title={next.label}
    >
      <div className="flex -space-x-1.5">
        <div className={`w-5 h-5 rounded-full border-2 border-white shadow-sm ${current.bg}`} />
        <div className={`w-5 h-5 rounded-full border-2 border-white shadow-sm ${next.bg}`} />
      </div>
      <Palette className="w-4 h-4 text-gray-400 group-hover:text-secondary transition-colors" />
    </button>
  );
}