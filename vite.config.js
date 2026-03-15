import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@supabase/supabase-js': path.resolve('./supabase-cdn-shim.js'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/rosebud-assets': {
        target: 'https://rosebud.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rosebud-assets/, '/assets'),
      },
    },
  },
  build: {
    target: 'esnext',
  },
});
