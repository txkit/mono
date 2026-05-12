import { createEvmTx } from '@txkit/tx-protocol'
import { describe, expect, it } from 'vitest'

import { annotateWithOwsResult } from '../fromOws'
import { toOwsSignAndSend } from '../toOws'


describe('toOwsSignAndSend', () => {
  it('translates a single-call evm-tx envelope', () => {
    const envelope = createEvmTx({
      chain: 'eip155:1',
      from: '0x0000000000000000000000000000000000000099',
      calls: [{ to: '0x0000000000000000000000000000000000000001', data: '0xabcd', value: '0x10' }],
      validity: { notAfter: 9999999999 },
      description: { short: 'Test transfer', action: 'transfer' },
      metadata: { protocol: 'test', tokenMovements: [], counterparties: [] },
    })

    const payload = toOwsSignAndSend(envelope)

    expect(payload.chain).toBe('eip155:1')
    expect(Array.isArray(payload.transaction)).toBe(false)
    const tx = payload.transaction as { to?: string; data?: string; value?: string }
    expect(tx.to).toBe('0x0000000000000000000000000000000000000001')
    expect(tx.data).toBe('0xabcd')
    expect(tx.value).toBe('0x10')
    expect(payload.simulation?.functionName).toBe('Test transfer')
    expect(payload.simulation?.validity?.notAfter).toBe(9999999999)
  })

  it('preserves token movements and counterparties in simulation', () => {
    const envelope = createEvmTx({
      chain: 'eip155:1',
      from: '0x0000000000000000000000000000000000000005',
      calls: [{ to: '0x0000000000000000000000000000000000000002', data: '0x' }],
      validity: { notAfter: 9999999999 },
      description: { short: 'Approve', action: 'approve' },
      metadata: {
        protocol: 'test-protocol',
        counterparties: [
          {
            role: 'spender',
            address: '0x0000000000000000000000000000000000000003',
            label: 'Test Spender',
            labelSource: 'protocol_directory',
          },
        ],
        tokenMovements: [
          {
            kind: 'approve',
            token: '0x0000000000000000000000000000000000000004',
            standard: 'erc20',
            symbol: 'TEST',
            decimals: 18,
            amount: '255',
            from: '0x0000000000000000000000000000000000000005',
            to: '0x0000000000000000000000000000000000000003',
            isUnlimited: false,
          },
        ],
      },
    })

    const payload = toOwsSignAndSend(envelope)

    expect(payload.simulation?.counterparties).toHaveLength(1)
    expect(payload.simulation?.counterparties?.[0]?.label).toBe('Test Spender')
    expect(payload.simulation?.tokenMovements).toHaveLength(1)
    expect(payload.simulation?.tokenMovements?.[0]?.isUnlimited).toBe(false)
  })

  it('annotateWithOwsResult attaches owsResult to meta', () => {
    const envelope = createEvmTx({
      chain: 'eip155:1',
      from: '0x0000000000000000000000000000000000000099',
      calls: [{ to: '0x0000000000000000000000000000000000000001', data: '0x' }],
      validity: { notAfter: 9999999999 },
      description: { short: 'noop', action: 'other' },
      metadata: { protocol: 'test', tokenMovements: [], counterparties: [] },
    })

    const annotated = annotateWithOwsResult(envelope, {
      txHash: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
      chain: 'eip155:1',
      signedAt: 1714200000,
    })

    expect((annotated.meta as Record<string, unknown>).owsResult).toMatchObject({
      txHash: '0xdeadbeef00000000000000000000000000000000000000000000000000000000',
      chain: 'eip155:1',
    })
  })

  it('omits atomicRequired for single-call envelopes (EIP-5792 only applies to batches)', () => {
    const envelope = createEvmTx({
      chain: 'eip155:1',
      calls: [{ to: '0x0000000000000000000000000000000000000010', data: '0x' }],
      validity: { notAfter: 9999999999 },
      description: { short: 'Single call', action: 'other' },
      metadata: { protocol: 'test', tokenMovements: [], counterparties: [] },
    }, { capabilities: { atomicRequired: true } })

    const payload = toOwsSignAndSend(envelope)
    expect(payload.atomicRequired).toBeUndefined()
  })

  it('emits atomicRequired when the envelope is a batch and the capability is set', () => {
    const envelope = createEvmTx({
      chain: 'eip155:1',
      calls: [
        { to: '0x0000000000000000000000000000000000000020', data: '0x' },
        { to: '0x0000000000000000000000000000000000000021', data: '0x' },
      ],
      validity: { notAfter: 9999999999 },
      description: { short: 'Batch', action: 'other' },
      metadata: { protocol: 'test', tokenMovements: [], counterparties: [] },
    }, { capabilities: { atomicRequired: true } })

    const payload = toOwsSignAndSend(envelope)
    expect(payload.atomicRequired).toBe(true)
    expect(Array.isArray(payload.transaction)).toBe(true)
  })

  it('omits atomicRequired in batches when capability is not set', () => {
    const envelope = createEvmTx({
      chain: 'eip155:1',
      calls: [
        { to: '0x0000000000000000000000000000000000000030', data: '0x' },
        { to: '0x0000000000000000000000000000000000000031', data: '0x' },
      ],
      validity: { notAfter: 9999999999 },
      description: { short: 'Batch no atomic', action: 'other' },
      metadata: { protocol: 'test', tokenMovements: [], counterparties: [] },
    })

    const payload = toOwsSignAndSend(envelope)
    expect(payload.atomicRequired).toBeUndefined()
  })

  it('threads risk action and reasons through simulation', () => {
    const envelope = createEvmTx({
      chain: 'eip155:1',
      calls: [{ to: '0x0000000000000000000000000000000000000040', data: '0x' }],
      validity: { notAfter: 9999999999 },
      description: { short: 'risky', action: 'other' },
      metadata: { protocol: 'test', tokenMovements: [], counterparties: [] },
    })
    envelope.risk = {
      action: 'WARN',
      warnings: [{ code: 'unbounded-approval', severity: 'high', message: 'MAX approval' }],
    }

    const payload = toOwsSignAndSend(envelope)
    expect(payload.simulation?.risk?.action).toBe('warn')
    expect(payload.simulation?.risk?.reasons).toEqual([ 'MAX approval' ])
  })

  it('preserves consumer-supplied meta fields (non-destructive annotation)', () => {
    const envelope = createEvmTx({
      chain: 'eip155:1',
      calls: [{ to: '0x0000000000000000000000000000000000000050', data: '0x' }],
      validity: { notAfter: 9999999999 },
      description: { short: 'preserve meta', action: 'other' },
      metadata: { protocol: 'test', tokenMovements: [], counterparties: [] },
    })
    envelope.meta = { 'x-routing-id': 'abc-123' }

    const annotated = annotateWithOwsResult(envelope, {
      txHash: '0x000000000000000000000000000000000000000000000000000000000000000a',
      chain: 'eip155:1',
      signedAt: 100,
    })
    expect((annotated.meta as Record<string, unknown>)['x-routing-id']).toBe('abc-123')
    expect((annotated.meta as Record<string, unknown>).owsResult).toBeDefined()
  })

  it('forwards an empty data field as 0x rather than dropping it', () => {
    const envelope = createEvmTx({
      chain: 'eip155:1',
      calls: [{ to: '0x0000000000000000000000000000000000000060' }],
      validity: { notAfter: 9999999999 },
      description: { short: 'no data', action: 'transfer' },
      metadata: { protocol: 'test', tokenMovements: [], counterparties: [] },
    })

    const payload = toOwsSignAndSend(envelope)
    const tx = payload.transaction as { data?: string; value?: string }
    expect(tx.data).toBe('0x')
    expect(tx.value).toBe('0x0')
  })
})
