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
    setupFiles: ['./src/test/preload-env.ts', './src/test/setup-tests.ts'],
    coverage: {
      enabled: true
    }
  }
})
