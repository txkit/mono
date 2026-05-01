import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [ react() ],
  resolve: {
    alias: {
      '@txkit/react': path.resolve(__dirname, '../../packages/react/src'),
      '@txkit/core': path.resolve(__dirname, '../../packages/core/src'),
      '@txkit/themes': path.resolve(__dirname, '../../packages/themes/src'),
      // @paulmillr/qr is a dependency of @txkit/react but not story.
      // Since story reads from @txkit/react source via alias, we need to resolve it.
      '@paulmillr/qr': path.resolve(__dirname, '../../packages/react/node_modules/@paulmillr/qr'),
    },
    // Dedupe peer deps so @txkit/react and @rainbow-me/rainbowkit share a
    // single WagmiContext / QueryClientContext / React tree. Without this,
    // pnpm resolves wagmi twice (one per consumer) -> two providers -> hooks
    // in one subtree can't see providers from the other -> "must be used
    // within WagmiProvider" or update-depth loops.
    dedupe: [ 'wagmi', 'viem', 'react', 'react-dom', '@tanstack/react-query' ],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        testnet: path.resolve(__dirname, 'testnet.html'),
      },
    },
  },
})
