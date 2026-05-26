import type { NextConfig } from 'next'


/**
 * Workspace packages ship as TypeScript ESM and are not pre-built for the
 * Next.js consumer side. The `transpilePackages` list lets Next compile them
 * on the fly so we do not need a `pnpm build` against every @txkit/*
 * package before `next dev` works.
 */
const TXKIT_WORKSPACE_PACKAGES = [
  '@txkit/core',
  '@txkit/react',
  '@txkit/themes',
  '@txkit/tx-decoder',
  '@txkit/tx-protocol',
  '@txkit/x402-adapter',
] as const

const nextConfig: NextConfig = {
  transpilePackages: [ ...TXKIT_WORKSPACE_PACKAGES ],
  // The Anthropic SDK + viem ship as ESM and rely on `node:` builtins.
  // Force Node runtime on all API routes by default; individual routes can
  // override with `export const runtime = 'edge'` if they really need it.
  serverExternalPackages: [ '@anthropic-ai/claude-agent-sdk' ],
}

export default nextConfig
