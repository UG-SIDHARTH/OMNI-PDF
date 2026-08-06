import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 8091,
    proxy: {
      '/api': {
        target: 'http://localhost:8092',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['@imgly/background-removal'],
  },
});
