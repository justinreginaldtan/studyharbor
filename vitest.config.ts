import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**'],
    setupFiles: [], // No setup file needed for now
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
