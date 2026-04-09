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
      // @paulmillr/qr is a dependency of @txkit/react but not story.
      // Since story reads from @txkit/react source via alias, we need to resolve it.
      '@paulmillr/qr': path.resolve(__dirname, '../../packages/react/node_modules/@paulmillr/qr'),
    },
  },
})
