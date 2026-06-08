import { decodeFunctionData, hexToString } from 'viem'
import { describe, expect, it, vi } from 'vitest'


// Mock the deployed-address getters so the unit test does not depend on
// contracts/deployed.json being filled (it stays PENDING until Mike deploys).
// buildRwaEnvelope reads the addresses at call time, so stubbing the getters
// is enough to exercise the envelope-building logic in isolation.
vi.mock('@/src/config/deployed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/config/deployed')>()

  return {
    ...actual,
    getMockRwaRouterAddress: () => '0x000000000000000000000000000000000000aaaa',
    getAgentPolicyGateAddress: () => '0x000000000000000000000000000000000000bbbb',
  }
})

const { buildRwaEnvelope } = await import('./envelope-builder')

const RECEIVER = '0x1111111111111111111111111111111111111111' as const
const RWA_ROUTER = '0x000000000000000000000000000000000000aaaa'

const MOCK_RWA_ROUTER_ABI = [
  {
    type: 'function',
    name: 'buy',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'ticker', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

describe('buildRwaEnvelope', () => {
  it('builds an evm-tx envelope with a MockRwaRouter.buy inner call', () => {
    const envelope = buildRwaEnvelope({ asset: 'TSLA', amount: 5 }, RECEIVER)

    expect(envelope.kind).toBe('evm-tx')
    expect(envelope.chain).toBe('eip155:421614')
    expect(envelope.inner.to.toLowerCase()).toBe(RWA_ROUTER)
    expect(envelope.call.value).toBe('0x0')

    const inner = decodeFunctionData({ abi: MOCK_RWA_ROUTER_ABI, data: envelope.inner.data })
    expect(inner.functionName).toBe('buy')
    expect((inner.args[0] as string).toLowerCase()).toBe(RECEIVER)
    expect(hexToString(inner.args[1] as `0x${string}`, { size: 32 })).toBe('TSLA')
    expect(inner.args[2]).toBe(5n)
    expect(envelope.inner.label).toContain('TSLA')
  })
})
