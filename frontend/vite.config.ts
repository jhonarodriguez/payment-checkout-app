import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/types/**',
        'src/assets/**',
        '**/*.d.ts',
        'src/vite-env.d.ts',
        '**/*.module.css',
      ],
    },
  },
});