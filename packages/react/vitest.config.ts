import { defineConfig } from 'vitest/config'
import { resolve } from 'path'


export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.spec.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@txkit/core': resolve(__dirname, '../core/src'),
    },
  },
})
