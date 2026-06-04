import { defineChain } from 'viem'


/**
 * Robinhood Chain testnet (chainId 46630) - Arbitrum Orbit L2 used for
 * Buildathon Scenario C (x402-paid RWA agent). RPC and explorer endpoints
 * sourced from Robinhood Chain documentation.
 *
 * Note: testnet has no published SLA. For production load fall back to a
 * pinned Anvil fork on the same chainId.
 */
export const robinhoodTestnet = defineChain({
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [ 'https://rpc.testnet.chain.robinhood.com' ] },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Explorer',
      url: 'https://explorer.testnet.chain.robinhood.com',
    },
  },
  testnet: true,
})

export const ROBINHOOD_TESTNET_CHAIN_ID = 46630 as const
