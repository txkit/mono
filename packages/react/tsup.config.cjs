/** @type {import('tsup').Options} */
module.exports = {
  entry: [
    'src/index.ts',
    'src/connect/index.ts',
    'src/balance/index.ts',
    'src/transaction/index.ts',
    'src/contract/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'wagmi',
    'wagmi/connectors',
    'viem',
    '@tanstack/react-query',
    '@paulmillr/qr',
  ],
  noExternal: ['@txkit/core'],
}
