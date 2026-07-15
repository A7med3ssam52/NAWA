import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type Palette = 'taupe' | 'terracotta';

interface ThemeContextType {
  palette: Palette;
  togglePalette: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<Palette>(() => {
    try {
      return (localStorage.getItem('palette') as Palette) || 'taupe';
    } catch {
      return 'taupe';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette);
    localStorage.setItem('palette', palette);
  }, [palette]);

  const togglePalette = useCallback(() => {
    setPalette((prev) => (prev === 'taupe' ? 'terracotta' : 'taupe'));
  }, []);

  return (
    <ThemeContext.Provider value={{ palette, togglePalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};