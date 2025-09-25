import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'simulation/src/core'),
      '@types': resolve(__dirname, 'simulation/src/types'),
    },
  },
});