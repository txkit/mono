/** @type {import('tsup').Options} */
module.exports = {
  entry: [
    'src/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  loader: {
    '.svg': 'dataurl',
  },
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
