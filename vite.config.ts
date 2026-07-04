import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor';
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/swiper') || id.includes('node_modules/lucide-react')) return 'ui';
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod') || id.includes('node_modules/@hookform')) return 'forms';
          if (id.includes('node_modules/@tanstack')) return 'data';
        },
      },
    },
  },
});
