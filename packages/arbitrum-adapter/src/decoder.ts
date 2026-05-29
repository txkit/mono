import type { ArbitrumDecodedCall, L1ToL2BridgeProvider } from './types'


/**
 * Address -> label registry for Arbitrum-specific contracts. Seeded with
 * the core Arbitrum precompiles + the canonical Delayed Inbox on
 * Ethereum mainnet + one Hop / Across L1 entrypoint each. Alpha.1 will
 * expand coverage (Sepolia inbox, Hop bonders per token, Across SpokePool
 * per chain, Stargate routers, Camelot / GMX / Pendle / Aave V3 on
 * Arbitrum One).
 *
 * Lowercase keys for case-insensitive lookup.
 */
export const KNOWN_ARBITRUM_ADDRESSES: Readonly<Record<string, string>> = {
  // Arbitrum precompiles (identical across One / Sepolia / Nova).
  '0x0000000000000000000000000000000000000064': 'ArbSys (precompile)',
  '0x000000000000000000000000000000000000006c': 'ArbGasInfo (precompile)',
  '0x00000000000000000000000000000000000000c8': 'NodeInterface (precompile)',

  // L1 entrypoints for Arbitrum One (Ethereum mainnet).
  '0x4dbd4fc535ac27206064b6804b5d6c7acb7c1abc': 'Arbitrum One Delayed Inbox (L1)',
  '0x72ce9c846789fdb6fc1f34ac4ad25dd9ef7031ef': 'Arbitrum One L1 Gateway Router',

  // L1 entrypoints for Arbitrum Nova.
  '0xc4448b71118c9071bcb9734a0eac55d18a153949': 'Arbitrum Nova Delayed Inbox (L1)',

  // Third-party bridge entrypoints on L1.
  '0xb8901acb165ed027e32754e0ffe830802919727f': 'Hop Protocol L1 Bridge (ETH)',
  '0x5c7bcd6e7de5423a257d81b442095a1a6ced35c5': 'Across SpokePool (L1 Ethereum)',
}

/**
 * Selector -> intent label registry. Empty in the skeleton; expansion to
 * follow as the decoder hardens. Only function-selector lookups go here;
 * full ABI decoding is the responsibility of `@txkit/tx-decoder`.
 */
const KNOWN_SELECTORS: Readonly<Record<string, ArbitrumDecodedCall>> = {
  // Inbox.createRetryableTicket(address,uint256,uint256,address,address,uint256,uint256,bytes)
  '0x679b6ded': { kind: 'retryable-create', contractLabel: 'Arbitrum Inbox' },
  // ArbSys.sendTxToL1(address,bytes)
  '0x928c169a': { kind: 'arbsys', method: 'sendTxToL1' },
  // ArbSys.withdrawEth(address)
  '0x25e16063': { kind: 'arbsys', method: 'withdrawEth' },
}

const PROVIDER_BY_ADDRESS: Readonly<Record<string, L1ToL2BridgeProvider>> = {
  '0x4dbd4fc535ac27206064b6804b5d6c7acb7c1abc': 'canonical',
  '0xc4448b71118c9071bcb9734a0eac55d18a153949': 'canonical',
  '0xb8901acb165ed027e32754e0ffe830802919727f': 'hop',
  '0x5c7bcd6e7de5423a257d81b442095a1a6ced35c5': 'across',
}

const normalize = (address: string): string => address.toLowerCase()

const selectorOf = (calldata: `0x${string}`): string | null => {
  if (calldata.length < 10) {
    return null
  }
  return calldata.slice(0, 10).toLowerCase()
}

/**
 * Decode an Arbitrum-flavoured call into a coarse intent label. Skeleton
 * registry; returns `kind: 'unknown'` (with the address label when known)
 * for selectors we have not catalogued yet, and `null` for inputs whose
 * `to` is not in the Arbitrum registry at all.
 *
 * This is not a replacement for `@txkit/tx-decoder` - it surfaces
 * Arbitrum-specific intents that a generic decoder would not flag, so the
 * wallet preview can label a transaction as "L1->L2 bridge via Hop" or
 * "Arbitrum retryable ticket creation".
 */
export const decodeArbitrumCall = (args: {
  to: `0x${string}`,
  calldata: `0x${string}`,
}): ArbitrumDecodedCall | null => {
  const to = normalize(args.to)
  const contractLabel = KNOWN_ARBITRUM_ADDRESSES[to]
  if (!contractLabel) {
    return null
  }

  const selector = selectorOf(args.calldata)
  const matchedSelector = selector ? KNOWN_SELECTORS[selector] : undefined
  if (matchedSelector) {
    return matchedSelector
  }

  const provider = PROVIDER_BY_ADDRESS[to]
  if (provider) {
    return { kind: 'bridge-deposit', provider, contractLabel }
  }

  return { kind: 'unknown', contractLabel }
}
