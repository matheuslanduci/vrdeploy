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
    coverage: {
      enabled: true,
      include: ['src/**/*.router.ts', 'src/auth.ts']
    }
  }
})
