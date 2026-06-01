import { toHex, type PublicClient } from 'viem'
import { describe, expect, it } from 'vitest'

import { attachBridgeIntent, extractBridgeIntent, isBridgeIntent } from '../bridge'
import { KNOWN_ARBITRUM_ADDRESSES, decodeArbitrumCall } from '../decoder'
import { attachRetryableHints, extractRetryableHints, isRetryableHints } from '../retryable'
import {
  NOVA_USES_COMPRESSED_CALLDATA,
  attachSequencerFeePreview,
  extractSequencerFeePreview,
  isSequencerFeePreview,
  previewSequencerFee,
} from '../sequencer'
import type { L1ToL2BridgeIntent, RetryableTicketHints, SequencerFeePreview } from '../types'


const MINIMAL_ENVELOPE = {
  version: '0.1' as const,
  kind: 'evm-tx' as const,
  content: {
    chain: 'eip155:1' as const,
    calls: [ { to: '0x4dbd4fc535ac27206064b6804b5d6c7acb7c1abc' as `0x${string}`, data: '0x' as `0x${string}` } ],
    validity: { notAfter: 9999999999 },
  },
}

const SAMPLE_BRIDGE: L1ToL2BridgeIntent = {
  provider: 'canonical',
  l1ChainId: 'eip155:1',
  l2ChainId: 'eip155:42161',
  tokenIn: 'native',
  amount: '0xde0b6b3a7640000',
  recipient: '0x0000000000000000000000000000000000000099',
  expiresAt: 9999999999,
}

const SAMPLE_RETRYABLE: RetryableTicketHints = {
  l2Gas: '0x186a0',
  l2GasPriceBid: '0x5f5e100',
  maxSubmissionCost: '0x38d7ea4c68000',
  callValueRefundAddress: '0x0000000000000000000000000000000000000099',
}

const SAMPLE_PREVIEW: SequencerFeePreview = {
  l2GasEstimate: '0x186a0',
  l1CalldataBytes: 132,
  l1BaseFeeWei: '0x3b9aca00',
  l1FeeWei: '0x16345785d8a0000',
  l2FeeWei: '0x71afd498d0000',
  totalFeeWei: '0x1d4ab7f7c2a0000',
  isCompressed: false,
}

const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD' as const

type MockReadParams = {
  address: string,
  functionName: string,
  args: readonly unknown[],
  account?: unknown,
}

/**
 * Minimal fake viem PublicClient. previewSequencerFee only touches
 * readContract + getBlockNumber, so we stub exactly those two and cast.
 * The gasEstimateComponents tuple defaults to the happy-path values used
 * across the assertions below.
 */
const createMockClient = (options: {
  components?: readonly [ bigint, bigint, bigint, bigint ],
  blockNumber?: bigint,
  throwOnRead?: boolean,
  onRead?: (params: MockReadParams) => void,
}): PublicClient => {
  const { components, blockNumber, throwOnRead, onRead } = options
  const componentsValue = components ?? [ 1000000n, 200000n, 100000000n, 30000000000n ]
  const blockNumberValue = blockNumber ?? 12345n

  return {
    readContract: async (params: MockReadParams) => {
      onRead?.(params)
      if (throwOnRead) {
        throw new Error('rpc down')
      }

      return componentsValue
    },
    getBlockNumber: async () => blockNumberValue,
  } as unknown as PublicClient
}

describe('arbitrum-adapter / bridge', () => {
  it('attachBridgeIntent populates meta.arbitrum.bridge', () => {
    const envelope = attachBridgeIntent(MINIMAL_ENVELOPE as unknown as Parameters<typeof attachBridgeIntent>[0], SAMPLE_BRIDGE)
    expect(envelope.meta?.arbitrum?.bridge).toEqual(SAMPLE_BRIDGE)
  })

  it('extractBridgeIntent reads what attach wrote', () => {
    const envelope = attachBridgeIntent(MINIMAL_ENVELOPE as unknown as Parameters<typeof attachBridgeIntent>[0], SAMPLE_BRIDGE)
    expect(extractBridgeIntent(envelope)).toEqual(SAMPLE_BRIDGE)
  })

  it('extractBridgeIntent returns null when meta missing or malformed', () => {
    expect(extractBridgeIntent({})).toBeNull()
    expect(extractBridgeIntent({ meta: {} })).toBeNull()
    expect(extractBridgeIntent({ meta: { arbitrum: { bridge: { provider: 'x' } as never } } })).toBeNull()
  })

  it('isBridgeIntent narrows correctly', () => {
    expect(isBridgeIntent(SAMPLE_BRIDGE)).toBe(true)
    expect(isBridgeIntent(null)).toBe(false)
    expect(isBridgeIntent({ provider: 'canonical' })).toBe(false)
  })

  it('attach preserves existing meta keys and other arbitrum sub-keys', () => {
    const seeded = {
      ...MINIMAL_ENVELOPE,
      meta: { foo: 'bar', arbitrum: { retryable: SAMPLE_RETRYABLE } },
    }
    const envelope = attachBridgeIntent(seeded as unknown as Parameters<typeof attachBridgeIntent>[0], SAMPLE_BRIDGE)
    expect(envelope.meta?.foo).toBe('bar')
    expect(envelope.meta?.arbitrum?.bridge).toEqual(SAMPLE_BRIDGE)
    expect(envelope.meta?.arbitrum?.retryable).toEqual(SAMPLE_RETRYABLE)
  })
})

describe('arbitrum-adapter / retryable', () => {
  it('attachRetryableHints populates meta.arbitrum.retryable', () => {
    const envelope = attachRetryableHints(MINIMAL_ENVELOPE as unknown as Parameters<typeof attachRetryableHints>[0], SAMPLE_RETRYABLE)
    expect(envelope.meta?.arbitrum?.retryable).toEqual(SAMPLE_RETRYABLE)
  })

  it('extractRetryableHints returns null for malformed payloads', () => {
    expect(extractRetryableHints({})).toBeNull()
    expect(extractRetryableHints({ meta: { arbitrum: { retryable: { l2Gas: 1 } as never } } })).toBeNull()
  })

  it('isRetryableHints requires all three required hex fields', () => {
    expect(isRetryableHints(SAMPLE_RETRYABLE)).toBe(true)
    expect(isRetryableHints({ l2Gas: '0x1', l2GasPriceBid: '0x1' })).toBe(false)
    expect(isRetryableHints(undefined)).toBe(false)
  })
})

describe('arbitrum-adapter / sequencer', () => {
  it('attachSequencerFeePreview populates meta.arbitrum.sequencerFee', () => {
    const envelope = attachSequencerFeePreview(MINIMAL_ENVELOPE as unknown as Parameters<typeof attachSequencerFeePreview>[0], SAMPLE_PREVIEW)
    expect(envelope.meta?.arbitrum?.sequencerFee).toEqual(SAMPLE_PREVIEW)
  })

  it('extractSequencerFeePreview reads what attach wrote', () => {
    const envelope = attachSequencerFeePreview(MINIMAL_ENVELOPE as unknown as Parameters<typeof attachSequencerFeePreview>[0], SAMPLE_PREVIEW)
    expect(extractSequencerFeePreview(envelope)).toEqual(SAMPLE_PREVIEW)
  })

  it('isSequencerFeePreview rejects partial shapes', () => {
    expect(isSequencerFeePreview(SAMPLE_PREVIEW)).toBe(true)
    expect(isSequencerFeePreview({ l2GasEstimate: '0x1' })).toBe(false)
  })

  it('previewSequencerFee computes every field from gasEstimateComponents', async () => {
    const client = createMockClient({
      components: [ 1000000n, 200000n, 100000000n, 30000000000n ],
      blockNumber: 12345n,
    })
    const preview = await previewSequencerFee(client, {
      chain: 'eip155:42161',
      to: DEAD_ADDRESS,
      calldata: '0xabcdef',
    })

    expect(preview).toEqual({
      l2GasEstimate: toHex(800000n),
      l1CalldataBytes: 3,
      l1BaseFeeWei: toHex(30000000000n),
      l1FeeWei: toHex(200000n * 100000000n),
      l2FeeWei: toHex(800000n * 100000000n),
      totalFeeWei: toHex(1000000n * 100000000n),
      isCompressed: false,
      previewBlock: 12345,
    })
  })

  it('previewSequencerFee reads gasEstimateComponents on NodeInterface 0xC8', async () => {
    let captured: MockReadParams | undefined
    const client = createMockClient({ onRead: (params) => { captured = params } })
    await previewSequencerFee(client, {
      chain: 'eip155:42161',
      to: DEAD_ADDRESS,
      calldata: '0x1234',
    })

    expect(captured?.address).toBe('0x00000000000000000000000000000000000000C8')
    expect(captured?.functionName).toBe('gasEstimateComponents')
    expect(captured?.args).toEqual([ DEAD_ADDRESS, false, '0x1234' ])
  })

  it('previewSequencerFee flags Nova calldata compression', async () => {
    const client = createMockClient({})
    const preview = await previewSequencerFee(client, {
      chain: 'eip155:42170',
      to: DEAD_ADDRESS,
      calldata: '0x',
    })

    expect(preview?.isCompressed).toBe(true)
  })

  it('previewSequencerFee honours an l1BaseFeeWei override', async () => {
    const client = createMockClient({ components: [ 1000000n, 200000n, 100000000n, 30000000000n ] })
    const preview = await previewSequencerFee(client, {
      chain: 'eip155:42161',
      to: DEAD_ADDRESS,
      calldata: '0x',
      l1BaseFeeWei: '0x1',
    })

    expect(preview?.l1BaseFeeWei).toBe('0x1')
  })

  it('previewSequencerFee returns null when the precompile read fails', async () => {
    const client = createMockClient({ throwOnRead: true })
    const preview = await previewSequencerFee(client, {
      chain: 'eip155:42161',
      to: DEAD_ADDRESS,
      calldata: '0x',
    })

    expect(preview).toBeNull()
  })

  it('previewSequencerFee counts calldata bytes', async () => {
    const client = createMockClient({})
    const empty = await previewSequencerFee(client, {
      chain: 'eip155:42161',
      to: DEAD_ADDRESS,
      calldata: '0x',
    })
    const filled = await previewSequencerFee(client, {
      chain: 'eip155:42161',
      to: DEAD_ADDRESS,
      calldata: '0xdeadbeef',
    })

    expect(empty?.l1CalldataBytes).toBe(0)
    expect(filled?.l1CalldataBytes).toBe(4)
  })

  it('exposes the Nova compression flag', () => {
    expect(NOVA_USES_COMPRESSED_CALLDATA).toBe(true)
  })
})

describe('arbitrum-adapter / decoder', () => {
  it('decodeArbitrumCall labels the Arbitrum One Delayed Inbox', () => {
    const decoded = decodeArbitrumCall({
      to: '0x4dbd4fc535ac27206064b6804b5d6c7acb7c1abc',
      calldata: '0x679b6ded000000000000000000000000',
    })
    expect(decoded).toEqual({ kind: 'retryable-create', contractLabel: 'Arbitrum Inbox' })
  })

  it('decodeArbitrumCall flags known bridge providers when the selector is unknown', () => {
    const decoded = decodeArbitrumCall({
      to: '0xb8901acb165ed027e32754e0ffe830802919727f',
      calldata: '0xdeadbeef',
    })
    expect(decoded?.kind).toBe('bridge-deposit')
    expect(decoded).toMatchObject({ provider: 'hop' })
  })

  it('decodeArbitrumCall returns null for addresses outside the registry', () => {
    const decoded = decodeArbitrumCall({
      to: '0x1111111111111111111111111111111111111111',
      calldata: '0xdeadbeef',
    })
    expect(decoded).toBeNull()
  })

  it('decoder address registry is case-insensitive (lowercased lookup)', () => {
    const decoded = decodeArbitrumCall({
      to: '0x4DBD4FC535AC27206064B6804B5D6C7ACB7C1ABC',
      calldata: '0xdeadbeef',
    })
    expect(decoded).toMatchObject({ kind: 'bridge-deposit', provider: 'canonical' })
  })

  it('KNOWN_ARBITRUM_ADDRESSES exposes the core precompile labels', () => {
    expect(KNOWN_ARBITRUM_ADDRESSES['0x0000000000000000000000000000000000000064']).toContain('ArbSys')
    expect(KNOWN_ARBITRUM_ADDRESSES['0x000000000000000000000000000000000000006c']).toContain('ArbGasInfo')
  })
})
