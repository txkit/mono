/** Truncate an Ethereum address to 0x1234...5678 format. Returns input unchanged when too short to truncate */
export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) {
    return ''
  }
  if (address.length < chars * 2 + 2) {
    return address
  }
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

const EXPLORERS: Record<number, string> = {
  // Mainnets
  1: 'https://etherscan.io',
  10: 'https://optimistic.etherscan.io',
  42161: 'https://arbiscan.io',
  8453: 'https://basescan.org',
  137: 'https://polygonscan.com',
  81457: 'https://blastscan.io',
  59144: 'https://lineascan.build',
  534352: 'https://scrollscan.com',
  324: 'https://explorer.zksync.io',
  5000: 'https://mantlescan.xyz',
  34443: 'https://explorer.mode.network',
  130: 'https://uniscan.xyz',
  // Testnets
  11155111: 'https://sepolia.etherscan.io',
  11155420: 'https://sepolia-optimism.etherscan.io',
  84532: 'https://sepolia.basescan.org',
  421614: 'https://sepolia.arbiscan.io',
  80002: 'https://amoy.polygonscan.com',
}

/** Build a block explorer URL for a given chain, hash, and type */
export const getExplorerUrl = (chainId: number, hash: string, type: 'tx' | 'address' = 'tx'): string | undefined => {
  const base = EXPLORERS[chainId]
  if (!base) {
    return undefined
  }
  return `${base}/${type}/${hash}`
}
