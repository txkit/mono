import { mainnet, optimism, polygon, base, arbitrum } from 'viem/chains'


/** DeFiLlama token price API endpoint */
export const DEFILLAMA_PRICE_URL = 'https://coins.llama.fi/prices/current'

/** Frankfurter forex rates API endpoint */
export const FRANKFURTER_API_URL = 'https://api.frankfurter.dev/latest'

/** Maps chain IDs to DeFiLlama platform identifiers */
export const CHAIN_TO_DEFILLAMA: Record<number, string> = {
  [base.id]: 'base',
  [polygon.id]: 'polygon',
  [mainnet.id]: 'ethereum',
  [optimism.id]: 'optimism',
  [arbitrum.id]: 'arbitrum',
}

/** Maps chain IDs to CoinGecko native token identifiers */
export const NATIVE_PRICE_IDS: Record<number, string> = {
  [mainnet.id]: 'coingecko:ethereum',
  [optimism.id]: 'coingecko:ethereum',
  [polygon.id]: 'coingecko:polygon-ecosystem-token',
  [base.id]: 'coingecko:ethereum',
  [arbitrum.id]: 'coingecko:ethereum',
}
