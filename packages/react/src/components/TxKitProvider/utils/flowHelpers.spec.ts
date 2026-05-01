import { describe, expect, it, vi } from 'vitest'
import { erc20Abi } from 'viem'

import { txStep, approveAndExecute, multiApproveAndExecute, signAndSubmit } from './flowHelpers'
import type { StepContext } from '../../../types/transaction'


const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const TOKEN = '0x1111111111111111111111111111111111111111' as const
const SPENDER = '0x2222222222222222222222222222222222222222' as const
const ALICE = '0x3333333333333333333333333333333333333333' as const

const buildContext = (allowance: bigint = 0n): StepContext => ({
  address: ALICE,
  chainId: 1,
  publicClient: {
    readContract: vi.fn(async () => allowance),
  } as unknown as StepContext['publicClient'],
  results: {},
  previousResult: undefined,
})

const RAW_TX = {
  to: SPENDER,
  data: '0x' as const,
}


describe('txStep', () => {
  it('builds a tx step with the required fields', () => {
    const step = txStep('send', 'Send ETH', RAW_TX)
    expect(step.id).toBe('send')
    expect(step.type).toBe('tx')
    expect(step.label).toBe('Send ETH')
    expect(step.tx).toBe(RAW_TX)
  })

  it('threads optional fields through (gas, safety, optional)', () => {
    const step = txStep('send', 'Send ETH', RAW_TX, {
      gas: 100000n,
      optional: true,
      safety: { simulate: false },
    })
    expect(step.gas).toBe(100000n)
    expect(step.optional).toBe(true)
    expect(step.safety).toEqual({ simulate: false })
  })
})


describe('approveAndExecute', () => {
  it('returns [approve, execute] steps with the expected ABI call', () => {
    const steps = approveAndExecute({
      token: TOKEN,
      spender: SPENDER,
      amount: 100n,
      tx: RAW_TX,
    })
    expect(steps).toHaveLength(2)
    const [ approveStep, executeStep ] = steps
    expect(approveStep?.id).toBe('approve')
    expect(approveStep?.label).toBe('Approve')
    expect(executeStep?.id).toBe('execute')
    expect(executeStep?.label).toBe('Execute')
  })

  it('uses the provided execute label, gas, and safety on the execute step', () => {
    const steps = approveAndExecute({
      token: TOKEN,
      spender: SPENDER,
      amount: 100n,
      tx: RAW_TX,
      label: 'Swap USDC',
      gas: 200000n,
      safety: { simulate: false },
    })
    const executeStep = steps[1]
    expect(executeStep?.label).toBe('Swap USDC')
    if (executeStep?.type === 'tx') {
      expect(executeStep.gas).toBe(200000n)
      expect(executeStep.safety).toEqual({ simulate: false })
    }
  })

  it('skips approve when current allowance is >= amount (no extra wallet popup)', async () => {
    const steps = approveAndExecute({
      token: TOKEN,
      spender: SPENDER,
      amount: 100n,
      tx: RAW_TX,
    })
    const approveStep = steps[0]
    if (approveStep?.type !== 'tx') {
      throw new Error('expected tx step')
    }
    expect(await approveStep.shouldSkip?.(buildContext(150n))).toBe(true)
  })

  it('does not skip approve when current allowance is < amount', async () => {
    const steps = approveAndExecute({
      token: TOKEN,
      spender: SPENDER,
      amount: 100n,
      tx: RAW_TX,
    })
    const approveStep = steps[0]
    if (approveStep?.type !== 'tx') {
      throw new Error('expected tx step')
    }
    expect(await approveStep.shouldSkip?.(buildContext(50n))).toBe(false)
  })

  it('approve step targets the ERC-20 ABI with the right args', () => {
    const steps = approveAndExecute({
      token: TOKEN,
      spender: SPENDER,
      amount: 250n,
      tx: RAW_TX,
    })
    const approveStep = steps[0]
    if (approveStep?.type !== 'tx') {
      throw new Error('expected tx step')
    }
    const tx = approveStep.tx as { address: string; abi: typeof erc20Abi; functionName: string; args: unknown[] }
    expect(tx.address).toBe(TOKEN)
    expect(tx.functionName).toBe('approve')
    expect(tx.args).toEqual([ SPENDER, 250n ])
  })
})


describe('multiApproveAndExecute', () => {
  it('emits one approve step per entry plus a single execute step', () => {
    const steps = multiApproveAndExecute({
      approvals: [
        { token: TOKEN, spender: SPENDER, amount: 1n },
        { token: ZERO_ADDRESS, spender: SPENDER, amount: 2n, label: 'Approve WETH' },
      ],
      tx: RAW_TX,
    })
    expect(steps).toHaveLength(3)
    expect(steps[0]?.id).toBe('approve-0')
    expect(steps[0]?.label).toBe('Approve 1')
    expect(steps[1]?.id).toBe('approve-1')
    expect(steps[1]?.label).toBe('Approve WETH')
    expect(steps[2]?.id).toBe('execute')
  })

  it('threads shouldSkip into each approve step independently', async () => {
    const steps = multiApproveAndExecute({
      approvals: [
        { token: TOKEN, spender: SPENDER, amount: 100n },
        { token: ZERO_ADDRESS, spender: SPENDER, amount: 100n },
      ],
      tx: RAW_TX,
    })
    const first = steps[0]
    const second = steps[1]
    if (first?.type !== 'tx' || second?.type !== 'tx') {
      throw new Error('expected tx steps')
    }
    expect(await first.shouldSkip?.(buildContext(50n))).toBe(false)
    expect(await second.shouldSkip?.(buildContext(200n))).toBe(true)
  })
})


describe('signAndSubmit', () => {
  it('produces a sign step with onSign forwarded', async () => {
    const onSign = vi.fn(async () => ({}))
    const step = signAndSubmit({
      id: 'cow-order',
      label: 'Sign CoW order',
      signData: { method: 'personal_sign', message: 'GM' },
      onSign,
    })
    expect(step.type).toBe('sign')
    expect(step.id).toBe('cow-order')
    expect(step.label).toBe('Sign CoW order')
    expect(step.sign.onSign).toBe(onSign)
  })

  it('threads waitForCondition and onCancel through', () => {
    const waitForCondition = vi.fn(async () => undefined)
    const onCancel = vi.fn(async () => undefined)
    const step = signAndSubmit({
      id: 'permit',
      label: 'Sign permit',
      signData: { method: 'personal_sign', message: 'permit' },
      onSign: vi.fn(async () => ({})),
      waitForCondition,
      onCancel,
    })
    expect(step.waitForCondition).toBe(waitForCondition)
    expect(step.onCancel).toBe(onCancel)
  })

  it('preserves a function-form signData factory (resolved at execution time)', () => {
    const signData = (): { method: 'personal_sign'; message: string } => ({
      method: 'personal_sign',
      message: 'lazy',
    })
    const step = signAndSubmit({
      id: 'lazy',
      label: 'Lazy',
      signData,
      onSign: vi.fn(async () => ({})),
    })
    expect(step.sign.signData).toBe(signData)
  })
})
