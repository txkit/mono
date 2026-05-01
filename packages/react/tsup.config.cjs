/** @type {import('tsup').Options} */
// NOTE: kept as .cjs (and not migrated to .ts like the other 7 packages)
// because tsup's `--config` loader pulls fsevents + the local path-alias
// resolution path through esbuild on macOS, which then refuses the
// fsevents.node native binding. The .cjs path skips the TS bundling step
// entirely. See feedback memory `project_react_build_issue.md`.
module.exports = {
  entry: [
    'src/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: false,
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
