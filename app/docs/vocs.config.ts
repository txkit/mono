import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'txKit',
  description: 'Stripe Elements for Web3',
  baseUrl: 'https://docs.txkit.dev',
  sidebar: [
    { text: 'Introduction', link: '/' },
    { text: 'Getting Started', link: '/getting-started' },
    {
      text: 'API',
      items: [
        { text: 'TxKitProvider', link: '/api/txkit-provider' },
        { text: 'ConnectWallet', link: '/api/connect-wallet' },
        { text: 'TokenBalance', link: '/api/token-balance' },
        { text: 'TransactionButton', link: '/api/transaction-button' },
        { text: 'ContractForm', link: '/api/contract-form' },
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
