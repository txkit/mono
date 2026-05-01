import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'txKit',
  description: 'Safe bridge between AI agents and Web3 transactions',
  baseUrl: 'https://docs.txkit.dev',
  rootDir: '.',
  iconUrl: '/favicon.svg',
  logoUrl: {
    light: '/logo.svg',
    dark: '/logo-dark.svg',
  },
  aiCta: false,
  sidebar: [
    { text: 'Introduction', link: '/' },
    { text: 'Getting Started', link: '/getting-started' },
    {
      text: 'Concepts',
      items: [
        { text: 'Architecture', link: '/concepts/architecture' },
        { text: 'Security model', link: '/concepts/security' },
        { text: 'Accessibility', link: '/concepts/accessibility' },
        { text: 'Compared to other libraries', link: '/concepts/comparison' },
      ],
    },
    {
      text: 'Guides',
      items: [
        { text: 'Migrate from RainbowKit', link: '/guides/migrate-from-rainbowkit' },
        { text: 'Embedded Mode', link: '/guides/embedded-mode' },
        { text: 'Next.js setup', link: '/guides/nextjs' },
        { text: 'Testing', link: '/guides/testing' },
      ],
    },
    {
      text: 'Protocol',
      items: [
        { text: 'PreparedTransaction v0.1', link: '/protocol/prepared-tx' },
        { text: 'OWS composition', link: '/protocol/ows' },
      ],
    },
    {
      text: 'API',
      items: [
        { text: 'TxKitProvider', link: '/api/tx-provider' },
        { text: 'ConnectWallet', link: '/api/connect-wallet' },
        { text: 'TokenBalance', link: '/api/token-balance' },
        { text: 'TransactionButton', link: '/api/transaction-button' },
        { text: 'FlowSteps', link: '/api/flow-steps' },
        { text: 'FlowProgress', link: '/api/flow-progress' },
        { text: 'FlowToast', link: '/api/flow-toast' },
        { text: 'Hooks', link: '/api/hooks' },
        { text: '@txkit/core', link: '/api/core' },
      ],
    },
    { text: 'Theming', link: '/theming' },
    { text: 'FAQ', link: '/faq' },
    {
      text: 'Errors',
      collapsed: true,
      items: [
        { text: 'Overview', link: '/errors' },
        { text: 'InvalidConfigError', link: '/errors/invalid-config' },
        { text: 'ProviderNotFoundError', link: '/errors/provider-not-found' },
        { text: 'MissingWagmiProviderError', link: '/errors/missing-wagmi-provider' },
        { text: 'NestedProviderError', link: '/errors/nested-provider' },
      ],
    },
  ],
  theme: {
    accentColor: {
      light: '#4338CA',
      dark: '#6366F1',
    },
  },
})
