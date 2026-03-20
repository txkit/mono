import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@txkit/react': path.resolve(__dirname, '../../packages/react/src'),
      '@txkit/core': path.resolve(__dirname, '../../packages/core/src'),
      '@txkit/themes': path.resolve(__dirname, '../../packages/themes/src'),
    },
  },
})
