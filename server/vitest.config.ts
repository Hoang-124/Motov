import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/controllers/**', 'src/middlewares/**', 'src/utils/**'],
    },
    // Run tests sequentially to avoid in-memory MongoDB conflicts
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true }
    }
  }
});
