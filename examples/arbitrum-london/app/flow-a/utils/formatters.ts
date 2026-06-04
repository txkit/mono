/**
 * Pure presentation helpers for the Pendle flow - chain labels, explorer URLs
 * and labels, and the reply-text fallback. Module-level (no component state)
 * so they stay trivially testable and importable by the chat + action pieces.
 */

export const formatChainLabel = (chain: `eip155:${number}`): string => {
  const chainId = Number(chain.split(':')[1])
  if (chainId === 421614) {
    return 'Arbitrum Sepolia (421614)'
  }

  if (chainId === 46630) {
    return 'Robinhood Chain testnet (46630)'
  }

  return `chain ${chainId}`
}

export const formatTxExplorerUrl = (chainId: number, txHash: `0x${string}`): string => {
  if (chainId === 421614) {
    return `https://sepolia.arbiscan.io/tx/${txHash}`
  }

  if (chainId === 46630) {
    return `https://explorer.testnet.chain.robinhood.com/tx/${txHash}`
  }

  return `chain ${chainId} tx ${txHash}`
}

export const formatExplorerBase = (chainId: number | null): string | undefined => {
  if (chainId === 421614) {
    return 'https://sepolia.arbiscan.io'
  }

  if (chainId === 46630) {
    return 'https://explorer.testnet.chain.robinhood.com'
  }

  return undefined
}

export const resolveExplorerLabel = (chainId: number | null): string => {
  if (chainId === 421614) {
    return 'Arbiscan'
  }

  if (chainId === 46630) {
    return 'Robinhood explorer'
  }

  return 'block explorer'
}

export const resolveReplyText = (reply: string | undefined, hasEnvelope: boolean): string => {
  const hasReplyText = reply !== undefined && reply.length > 0
  if (hasReplyText) {
    return reply
  }

  if (hasEnvelope) {
    return '(envelope prepared - review below)'
  }

  return '(empty reply)'
}
