import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://crypto-sensei.vercel.app',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://crypto-sensei.vercel.app',
        ws: true,
      }
    },
  },
  define: {
    'process.env': {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Add public directory configuration
  publicDir: 'public',
});
