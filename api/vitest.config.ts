import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~': '/src'
    }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/setup-tests.ts'],
    maxWorkers: 1,
    coverage: {
      enabled: true
    }
  }
})
