import { describe, expect, it } from 'vitest'
import { SPEC_VERSION, validatePreparedTx, serialize, deserialize } from '../index'
import type { PreparedTransaction } from '../index'

const validTx: PreparedTransaction = {
  version: SPEC_VERSION,
  chainId: 1,
  to: '0xAC0F906E433d58FA868F936E8A43230473652885',
  data: '0x6e553f650000000000000000000000000000000000000000000000000de0b6b3a7640000',
  value: 1_000_000_000_000_000_000n,
  description: {
    short: 'Stake 1 ETH in Genesis Vault',
    long: 'Deposits 1 ETH into StakeWise Genesis Vault.',
    action: 'stake',
  },
  metadata: {
    protocol: 'stakewise-v3',
    tokenMovements: [
      {
        token: 'native',
        symbol: 'ETH',
        decimals: 18,
        amount: 1_000_000_000_000_000_000n,
        direction: 'out',
      },
    ],
    counterparties: ['0xAC0F906E433d58FA868F936E8A43230473652885'],
  },
  decoderRef: 'stakewise-v3/vault/deposit',
}

describe('validatePreparedTx', () => {
  it('accepts a valid PreparedTransaction', () => {
    const result = validatePreparedTx(validTx)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.description.short).toBe('Stake 1 ETH in Genesis Vault')
      expect(result.value.metadata.tokenMovements).toHaveLength(1)
    }
  })

  it('rejects missing description.short', () => {
    const invalid = {
      ...validTx,
      description: { action: 'stake' },
    }
    const result = validatePreparedTx(invalid)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues?.some((i) => i.path.includes('description'))).toBe(true)
    }
  })

  it('rejects malformed tokenMovements amount (non-bigint)', () => {
    const invalid = {
      ...validTx,
      metadata: {
        ...validTx.metadata,
        tokenMovements: [
          {
            token: 'native',
            symbol: 'ETH',
            decimals: 18,
            amount: '1000000' as unknown as bigint,
            direction: 'out',
          },
        ],
      },
    }
    const result = validatePreparedTx(invalid)
    expect(result.ok).toBe(false)
  })

  it('rejects invalid chainId (zero)', () => {
    const invalid = { ...validTx, chainId: 0 }
    const result = validatePreparedTx(invalid)
    expect(result.ok).toBe(false)
  })

  it('rejects wrong version literal', () => {
    const invalid = { ...validTx, version: '0.2' as unknown as typeof SPEC_VERSION }
    const result = validatePreparedTx(invalid)
    expect(result.ok).toBe(false)
  })

  it('rejects invalid hex address (bad length)', () => {
    const invalid = { ...validTx, to: '0x123' as `0x${string}` }
    const result = validatePreparedTx(invalid)
    expect(result.ok).toBe(false)
  })
})

describe('serialize / deserialize', () => {
  it('roundtrips bigint fields', () => {
    const json = serialize(validTx)
    const restored = deserialize(json)
    expect(restored.value).toBe(validTx.value)
    expect(restored.metadata.tokenMovements[0]!.amount).toBe(
      validTx.metadata.tokenMovements[0]!.amount,
    )
  })

  it('produces JSON that does not include native bigint', () => {
    const json = serialize(validTx)
    expect(() => JSON.parse(json)).not.toThrow()
    expect(json).toContain('1000000000000000000n')
  })

  it('throws on deserialize of invalid JSON shape', () => {
    expect(() => deserialize('{"version":"0.1"}')).toThrow(/deserialize:/)
  })
})
