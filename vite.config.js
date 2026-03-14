import { defineConfig } from 'vite';

export default defineConfig({
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
