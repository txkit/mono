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


/**
 * Splits the agent's real reply into sentence-sized lines for the reasoning
 * card. Pure text transform - it never invents content, it only breaks the
 * actual reply on sentence boundaries so a one-or-two sentence reply reads as a
 * short, honest reasoning list.
 */
export const splitReasoningLines = (text: string): string[] => {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}


/**
 * Reduce a wallet/RPC error to one readable line for the UI. viem errors carry
 * a clean one-line `shortMessage` (the fee-cap or user-rejected reason); the
 * full `message` is a several-hundred-character dump that includes raw calldata
 * and overflows the layout. Prefer shortMessage, else the capped first line.
 */
export const resolveSendErrorText = (error: Error): string => {
  const { shortMessage } = error as Error & { shortMessage?: string }
  if (shortMessage !== undefined && shortMessage.length > 0) {
    return shortMessage
  }

  const [ firstLine ] = error.message.split('\n')
  return firstLine.length > 160 ? `${firstLine.slice(0, 160)}...` : firstLine
}
