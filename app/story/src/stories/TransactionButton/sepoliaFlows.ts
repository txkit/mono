import { parseEther } from 'viem'
import { txStep } from '@txkit/react'
import type { FlowStep } from '@txkit/react'


/** Canonical WETH on Sepolia (Aave / Uniswap / OpenSea reference). */
export const WETH_SEPOLIA = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as const

/** Amount used by every multi-step round-trip flow (deposit / approve / transfer / withdraw). */
export const FLOW_AMOUNT_WEI = parseEther('0.001')

/** Minimum balance recommendation: 1x deposit + headroom for ~5 step gas costs on Sepolia. */
export const MIN_BALANCE_WEI = parseEther('0.005')

const WETH_ABI = [
  { type: 'function', name: 'deposit', stateMutability: 'payable', inputs: [], outputs: [] },
  { type: 'function', name: 'withdraw', stateMutability: 'nonpayable', inputs: [{ name: 'wad', type: 'uint256' }], outputs: [] },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'guy', type: 'address' }, { name: 'wad', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'dst', type: 'address' }, { name: 'wad', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
] as const


// --- Step factories ---

const wrapStep = (): FlowStep => txStep('weth-deposit', 'Wrap 0.001 ETH', {
  address: WETH_SEPOLIA,
  abi: WETH_ABI,
  functionName: 'deposit',
  value: FLOW_AMOUNT_WEI,
})

const approveStep = (): FlowStep => txStep('weth-approve', 'Approve WETH (0.001)', (context) => ({
  address: WETH_SEPOLIA,
  abi: WETH_ABI,
  functionName: 'approve',
  args: [ context.address, FLOW_AMOUNT_WEI ],
}))

const transferToSelfStep = (): FlowStep => txStep('weth-transfer', 'Transfer 0.001 WETH to self', (context) => ({
  address: WETH_SEPOLIA,
  abi: WETH_ABI,
  functionName: 'transfer',
  args: [ context.address, FLOW_AMOUNT_WEI ],
}))

const revokeApprovalStep = (): FlowStep => txStep('weth-revoke', 'Revoke WETH approval', (context) => ({
  address: WETH_SEPOLIA,
  abi: WETH_ABI,
  functionName: 'approve',
  args: [ context.address, 0n ],
}))

const unwrapStep = (): FlowStep => txStep('weth-withdraw', 'Unwrap 0.001 WETH', {
  address: WETH_SEPOLIA,
  abi: WETH_ABI,
  functionName: 'withdraw',
  args: [ FLOW_AMOUNT_WEI ],
})


// --- Flow builder ---

export type FlowDefinition = {
  steps: FlowStep[]
  /** Short description shown above the button to explain the flow narrative. */
  narrative: string
  /** Whether this flow ends with funds in a third-party recipient (true) or back to the user (false).
   *  All current flows are self-send WETH round-trips, so this is always false today. */
  losesFunds: boolean
}

const WRAP_SNIPPET = [
  "  txStep('weth-deposit', 'Wrap 0.001 ETH', {",
  "    address: WETH, abi: WETH_ABI, functionName: 'deposit',",
  "    value: parseEther('0.001'),",
  '  }),',
]

const APPROVE_SNIPPET = [
  "  txStep('weth-approve', 'Approve WETH (0.001)', (ctx) => ({",
  "    address: WETH, abi: WETH_ABI, functionName: 'approve',",
  "    args: [ ctx.address, parseEther('0.001') ],",
  '  })),',
]

const TRANSFER_SNIPPET = [
  "  txStep('weth-transfer', 'Transfer 0.001 WETH to self', (ctx) => ({",
  "    address: WETH, abi: WETH_ABI, functionName: 'transfer',",
  "    args: [ ctx.address, parseEther('0.001') ],",
  '  })),',
]

const REVOKE_SNIPPET = [
  "  txStep('weth-revoke', 'Revoke WETH approval', (ctx) => ({",
  "    address: WETH, abi: WETH_ABI, functionName: 'approve',",
  '    args: [ ctx.address, 0n ],',
  '  })),',
]

const UNWRAP_SNIPPET = [
  "  txStep('weth-withdraw', 'Unwrap 0.001 WETH', {",
  "    address: WETH, abi: WETH_ABI, functionName: 'withdraw',",
  "    args: [ parseEther('0.001') ],",
  '  }),',
]

const wrapStepsArray = (stepLines: string[]): string[] => [
  'const steps = [',
  ...stepLines,
  ']',
]

/**
 * Returns the source lines that define `steps` for the requested step count.
 * Used by the Live tab CodeBlock to show the actual Sepolia flow alongside the component.
 */
export const buildSepoliaFlowSnippet = (stepsCount: number): string[] => {
  switch (stepsCount) {
    case 1:
      return wrapStepsArray(WRAP_SNIPPET)
    case 2:
      return wrapStepsArray([ ...WRAP_SNIPPET, ...UNWRAP_SNIPPET ])
    case 3:
      return wrapStepsArray([ ...WRAP_SNIPPET, ...APPROVE_SNIPPET, ...UNWRAP_SNIPPET ])
    case 4:
      return wrapStepsArray([ ...WRAP_SNIPPET, ...APPROVE_SNIPPET, ...TRANSFER_SNIPPET, ...UNWRAP_SNIPPET ])
    case 5:
      return wrapStepsArray([ ...WRAP_SNIPPET, ...APPROVE_SNIPPET, ...TRANSFER_SNIPPET, ...REVOKE_SNIPPET, ...UNWRAP_SNIPPET ])
    default:
      return buildSepoliaFlowSnippet(1)
  }
}

/**
 * Build a Sepolia WETH-based flow with the requested step count (1-5).
 *
 * Each flow is a real, runnable Sepolia transaction sequence:
 *  1: deposit (wrap, single tx, ETH stays with user as WETH)
 *  2: deposit -> withdraw (round-trip, ETH back to user)
 *  3: deposit -> approve self -> withdraw (round-trip + approval)
 *  4: deposit -> approve -> transfer to self -> withdraw (round-trip + approval + transfer)
 *  5: deposit -> approve -> transfer -> revoke -> withdraw (full safety pattern)
 */
export const buildSepoliaFlow = (stepsCount: number): FlowDefinition => {
  switch (stepsCount) {
    case 1:
      return {
        steps: [ wrapStep() ],
        narrative: 'Wrap 0.001 ETH to WETH. Single transaction, funds stay with you.',
        losesFunds: false,
      }
    case 2:
      return {
        steps: [ wrapStep(), unwrapStep() ],
        narrative: 'Wrap 0.001 ETH to WETH, then unwrap back. Round-trip - no funds leave your wallet.',
        losesFunds: false,
      }
    case 3:
      return {
        steps: [ wrapStep(), approveStep(), unwrapStep() ],
        narrative: 'Wrap, approve yourself as spender, unwrap. Round-trip with extra approval step.',
        losesFunds: false,
      }
    case 4:
      return {
        steps: [ wrapStep(), approveStep(), transferToSelfStep(), unwrapStep() ],
        narrative: 'Wrap, approve, transfer to self, unwrap. Approval + transfer pattern, funds stay with you.',
        losesFunds: false,
      }
    case 5:
      return {
        steps: [ wrapStep(), approveStep(), transferToSelfStep(), revokeApprovalStep(), unwrapStep() ],
        narrative: 'Wrap, approve, transfer, revoke approval, unwrap. Full safe-approval lifecycle.',
        losesFunds: false,
      }
    default:
      return buildSepoliaFlow(1)
  }
}
