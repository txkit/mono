/** Truncate an Ethereum address to 0x1234...5678 format */
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) {
    return ''
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/** Build a block explorer URL for a given chain, hash, and type */
export const getExplorerUrl = (chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string | undefined => {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    10: 'https://optimistic.etherscan.io',
    42161: 'https://arbiscan.io',
    8453: 'https://basescan.org',
    137: 'https://polygonscan.com',
  }
  const base = explorers[chainId]
  if (!base) {
    return undefined
  }
  return `${base}/${type}/${hash}`
}
