/** DeFiLlama token price API endpoint */
export const DEFILLAMA_PRICE_URL = 'https://coins.llama.fi/prices/current'

/** Frankfurter forex rates API endpoint */
export const FRANKFURTER_API_URL = 'https://api.frankfurter.dev/latest'

/** Maps chain IDs to DeFiLlama platform identifiers */
export const CHAIN_TO_DEFILLAMA: Record<number, string> = {
  1: 'ethereum',
  10: 'optimism',
  137: 'polygon',
  8453: 'base',
  42161: 'arbitrum',
}

/** Maps chain IDs to CoinGecko native token identifiers */
export const NATIVE_PRICE_IDS: Record<number, string> = {
  1: 'coingecko:ethereum',
  10: 'coingecko:ethereum',
  137: 'coingecko:polygon-ecosystem-token',
  8453: 'coingecko:ethereum',
  42161: 'coingecko:ethereum',
}
