import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
