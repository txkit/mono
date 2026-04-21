import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'txKit',
  description: 'Safe bridge between AI agents and Web3 transactions',
  baseUrl: 'https://docs.txkit.dev',
  iconUrl: '/favicon.svg',
  logoUrl: '/logo.svg',
  sidebar: [
    { text: 'Introduction', link: '/' },
    { text: 'Getting Started', link: '/getting-started' },
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
        { text: 'TxKitProvider', link: '/api/txkit-provider' },
        { text: 'ConnectWallet', link: '/api/connect-wallet' },
        { text: 'TokenBalance', link: '/api/token-balance' },
        { text: 'TransactionButton', link: '/api/transaction-button' },
        { text: 'FlowSteps', link: '/api/flow-steps' },
        { text: 'FlowProgress', link: '/api/flow-progress' },
        { text: 'FlowToast', link: '/api/flow-toast' },
      ],
    },
    { text: 'Theming', link: '/theming' },
    {
      text: 'Errors',
      collapsed: true,
      items: [
        { text: 'Overview', link: '/errors' },
        { text: 'InvalidConfigError', link: '/errors/invalid-config' },
        { text: 'ProviderNotFoundError', link: '/errors/provider-not-found' },
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
