import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false // Disable CSS processing in tests
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
