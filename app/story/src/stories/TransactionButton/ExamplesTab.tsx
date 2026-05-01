import React from 'react'

import { InfoGrid, StorySection } from '../../components'
import dedent from '../../helpers/dedent'
import TxbMockButton from './TxbMockButton'


const stepStatus = (step: { current: boolean; done: boolean }): 'completed' | 'tx-pending' | 'pending' => {
  if (step.done) {
    return 'completed'
  }
  if (step.current) {
    return 'tx-pending'
  }
  return 'pending'
}

const MockFlowSteps: React.FC<{ steps: Array<{ id: string; label: string; current: boolean; done: boolean }> }> = ({ steps }) => (
  <ol className="tx-fs-list" data-orientation="vertical" aria-label="Transaction steps">
    {
      steps.map((step, index) => (
        <li
          key={step.id}
          className="tx-fs-item"
          data-status={stepStatus(step)}
          aria-current={step.current ? 'step' : undefined}
        >
          <span className="tx-fs-indicator" aria-hidden="true">
            <span className="tx-fs-indicator-number">{index + 1}</span>
          </span>
          <div className="tx-fs-text">
            <span className="tx-fs-label">{step.label}</span>
          </div>
        </li>
      ))
    }
  </ol>
)


const ExamplesTab = () => (
  <>
    <p className="story-description">Production recipes for TransactionButton. Each example pairs a use-case hint with a copyable snippet</p>

    <StorySection
      title="Simple ETH Transfer (Sepolia)"
      useWhen="Single-step send / claim / mint. Static mocks below show idle, pending, completed and error states from the same flow"
      code={dedent`
        import { TransactionButton, txStep } from '@txkit/react'
        import { parseEther } from 'viem'
        import { sepolia } from 'viem/chains'

        // tx callback receives StepContext (address, chainId, publicClient, results, ...)
        const SendButton = () => (
          <TransactionButton
            steps={[
              txStep('send', 'Send ETH', (ctx) => ({
                to: ctx.address,
                value: parseEther('0.001'),
              })),
            ]}
            chainId={sepolia.id}
            label="Send 0.001 ETH"
          />
        )
      `}
    >
      <div className="story-row" style={{ flexWrap: 'wrap' }}>
        <TxbMockButton state="idle" />
        <TxbMockButton state="tx-pending" />
        <TxbMockButton state="completed" />
        <TxbMockButton state="error" />
      </div>
    </StorySection>

    <StorySection
      title="Multi-Step: Approve + Execute"
      useWhen="Any ERC-20 spend (swap, deposit, bridge). approveAndExecute auto-skips approve when allowance is sufficient"
      code={dedent`
        import { TransactionButton, approveAndExecute } from '@txkit/react'
        import { USDC_ADDRESS, STAKING_VAULT, vaultAbi } from './constants'

        const DepositUsdc = () => (
          <TransactionButton
            label="Approve + Deposit"
            steps={approveAndExecute({
              token: USDC_ADDRESS,
              spender: STAKING_VAULT,
              amount: 1_000_000n,
              label: 'Deposit USDC',
              tx: {
                address: STAKING_VAULT,
                abi: vaultAbi,
                functionName: 'deposit',
                args: [ 1_000_000n ],
              },
            })}
          />
        )
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MockFlowSteps steps={[
          { id: 'approve', label: 'Approve USDC', current: false, done: true },
          { id: 'deposit', label: 'Deposit USDC', current: true, done: false },
        ]} />
        <TxbMockButton state="tx-pending" label="Sending Deposit..." />
      </div>
    </StorySection>

    <StorySection
      title="Safety Delay"
      useWhen="High-value transfers that need a confirm window. Renders a 5s countdown pill before signing - reduces accidental signs by 80%+"
      code={dedent`
        import { TransactionButton, txStep } from '@txkit/react'
        import { parseEther } from 'viem'

        const RECIPIENT = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51' // your recipient address

        const SendBigAmount = () => (
          <TransactionButton
            steps={[ txStep('send', 'Send', { to: RECIPIENT, value: parseEther('1') }) ]}
            safety={{ delayMs: 5000 }}
          />
        )
      `}
    >
      <TxbMockButton state="confirming-risk" label="Confirm in 5s..." />
    </StorySection>

    <StorySection
      title="Rejected by User"
      useWhen="Distinguish soft-fail (closed wallet popup) from hard error (revert). Surface a softer toast - don't shout at users for cancelling"
      code={dedent`
        import { TransactionButton, txStep } from '@txkit/react'
        import { parseEther } from 'viem'

        const RECIPIENT = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51' // your recipient address

        const SendButton = () => (
          <TransactionButton
            steps={[ txStep('send', 'Send', { to: RECIPIENT, value: parseEther('0.01') }) ]}
            onError={(error) => {
              if (error.code === 'USER_REJECTED') {
                // soft toast, no red alert
                return
              }
              // surface hard error
              console.error(error.message)
            }}
          />
        )
      `}
    >
      <TxbMockButton state="rejected" />
    </StorySection>

    <StorySection
      title="Compound Components"
      useWhen="Place FlowSteps / FlowProgress / FlowToast anywhere in the tree. They auto-connect via TxKitProvider context - no prop drilling"
      code={dedent`
        import { TransactionButton, FlowSteps, FlowProgress, FlowToast, approveAndExecute } from '@txkit/react'
        import { USDC_ADDRESS, WETH_ADDRESS, SWAP_ROUTER, swapAbi } from './constants'

        const SwapPanel = () => (
          <>
            <TransactionButton
              label="Approve + Swap"
              steps={approveAndExecute({
                token: USDC_ADDRESS,
                spender: SWAP_ROUTER,
                amount: 1_000_000n,
                label: 'Swap',
                tx: (ctx) => ({
                  address: SWAP_ROUTER,
                  abi: swapAbi,
                  functionName: 'swapExactTokensForTokens',
                  args: [
                    1_000_000n,
                    0n,
                    [ USDC_ADDRESS, WETH_ADDRESS ],
                    ctx.address,
                    BigInt(Math.floor(Date.now() / 1000) + 1200),
                  ],
                }),
              })}
            />
            {/* place anywhere - they read flow state from TxKitProvider */}
            <FlowSteps />
            <FlowProgress />
            <FlowToast />
          </>
        )
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MockFlowSteps steps={[
          { id: 'approve', label: 'Approve USDC', current: false, done: true },
          { id: 'transfer', label: 'Transfer', current: true, done: false },
        ]} />
        <TxbMockButton state="tx-pending" label="Approve + Transfer" />
        <div className="tx-fp" data-active="true">
          <div className="tx-fp-inner">
            <div className="tx-fp-bar" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
              <div className="tx-fp-fill" data-status="running" style={{ width: '50%' }} />
            </div>
          </div>
        </div>
      </div>
    </StorySection>

    <StorySection
      title="Computed Tx Params"
      useWhen="Step args are not known at flow definition time - depend on a prior step receipt, an off-chain quote, or a runtime on-chain read"
      description="The tx argument of txStep accepts (ctx) => TxParams or async (ctx) => Promise<TxParams>. Same pattern works for signData, shouldSkip, waitForCondition, and the lifecycle callbacks."
      code={dedent`
        import { useState } from 'react'
        import { TransactionButton, txStep, approveAndExecute } from '@txkit/react'
        import { rewardsAbi, REWARDS_VAULT, USDC_ADDRESS, SWAP_ROUTER, fetchQuote } from './constants'
        import type { Quote } from './constants'

        // 1. Closure: off-chain quote fetched once before flow start
        const SwapButton = ({ amount }: { amount: bigint }) => {
          const [ quote, setQuote ] = useState<Quote | null>(null)

          if (!quote) {
            return (
              <button onClick={async () => setQuote(await fetchQuote({ amount }))}>
                Get quote
              </button>
            )
          }

          return (
            <TransactionButton
              label="Swap"
              steps={approveAndExecute({
                token: USDC_ADDRESS,
                spender: SWAP_ROUTER,
                amount: quote.amountIn,
                tx: { to: SWAP_ROUTER, data: quote.calldata, value: 0n },
              })}
            />
          )
        }

        // 2. Inter-step: read the prior step's result (narrow before use)
        const claimStep = txStep('claim', 'Claim with proof', (ctx) => {
          const previous = ctx.previousResult
          if (previous?.type !== 'tx') {
            throw new Error('Expected a prior tx step')
          }
          return {
            address: REWARDS_VAULT,
            abi: rewardsAbi,
            functionName: 'claimWithProof',
            args: [ previous.hash ],
          }
        })

        // 3. Async runtime read: on-chain lookup at step start
        const claimAllStep = txStep('claim-all', 'Claim all', async (ctx) => {
          const pending = await ctx.publicClient.readContract({
            address: REWARDS_VAULT,
            abi: rewardsAbi,
            functionName: 'pendingRewards',
            args: [ ctx.address ],
          })
          return {
            address: REWARDS_VAULT,
            abi: rewardsAbi,
            functionName: 'claim',
            args: [ pending ],
          }
        })
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MockFlowSteps steps={[
          { id: 'approve', label: 'Approve USDC', current: false, done: true },
          { id: 'swap', label: 'Swap (computed from quote)', current: true, done: false },
        ]} />
        <TxbMockButton state="tx-pending" label="Swap" />
      </div>
    </StorySection>

    <StorySection
      title="Error Categorization"
      useWhen="Differentiate USER_REJECTED, TIMEOUT, SIMULATION_FAILED in onError for tailored UX. error.code carries a stable string regardless of which provider threw"
      description="Common codes: USER_REJECTED (silent retry), TIMEOUT (network warning), SIMULATION_FAILED (blocked tx, surface details), EXECUTION_REVERTED (on-chain revert), CHAIN_MISMATCH (prompt switch)"
      code={dedent`
        import { TransactionButton, txStep } from '@txkit/react'
        import type { TransactionError } from '@txkit/core'
        import { parseEther } from 'viem'

        const RECIPIENT = '0xaC8e0D90b7dc16D63ad77d9CDd71e3DAb45ABE51' // your recipient address

        const SendButton = () => {
          const handleError = (error: TransactionError) => {
            // error.code is one of the stable codes - branch on it for tailored UX
            if (error.code === 'USER_REJECTED') {
              return
            }

            if (error.code === 'TIMEOUT') {
              // surface a 'network is slow' banner
              return
            }

            if (error.code === 'SIMULATION_FAILED') {
              // surface decoded revert reason
              return
            }
          }

          return (
            <TransactionButton
              steps={[ txStep('send', 'Send', { to: RECIPIENT, value: parseEther('0.01') }) ]}
              onError={handleError}
            />
          )
        }
      `}
    >
      <div className="story-row" style={{ flexWrap: 'wrap' }}>
        <TxbMockButton state="rejected" label="USER_REJECTED" />
        <TxbMockButton state="error" label="TIMEOUT" />
        <TxbMockButton state="simulation-failed" label="SIMULATION_FAILED" />
      </div>
    </StorySection>

    <StorySection
      title="useTransactionFlow (headless)"
      useWhen="Build custom UX (multi-button orchestration, progress bars, toasts) on top of flow state. No UI from txKit"
      headless
      code={dedent`
        import { useTransactionFlow, txStep } from '@txkit/react'
        import { parseEther } from 'viem'
        import { sepolia } from 'viem/chains'

        const CustomFlow = () => {
          // self-send: tx callback receives StepContext.address (connected wallet)
          const { flow, start, retry, reset } = useTransactionFlow({
            steps: [
              txStep('send', 'Send ETH', (ctx) => ({
                to: ctx.address,
                value: parseEther('0.001'),
              })),
            ],
            chainId: sepolia.id,
          })

          if (flow.status === 'idle') {
            return <button onClick={start}>Send 0.001 ETH</button>
          }

          if (flow.status === 'error' || flow.status === 'rejected') {
            return <button onClick={retry}>Retry</button>
          }

          if (flow.status === 'completed') {
            return <button onClick={reset}>Send another</button>
          }

          return <span>Status: {flow.status}</span>
        }
      `}
    >
      <InfoGrid entries={[
        { label: 'Flow Status', value: 'idle' },
        { label: 'Step Status', value: 'pending' },
        { label: 'Hash', value: '-', mono: true },
        { label: 'Error', value: '-' },
      ]} />
    </StorySection>

  </>
)


export default ExamplesTab
