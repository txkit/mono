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
  <ol className="txkit-fs-list" aria-label="Transaction steps">
    {
      steps.map((step) => (
        <li
          key={step.id}
          className="txkit-fs-item"
          data-status={stepStatus(step)}
          aria-current={step.current ? 'step' : undefined}
        >
          <span className="txkit-fs-bullet" aria-hidden="true" />
          <span className="txkit-fs-label">{step.label}</span>
        </li>
      ))
    }
  </ol>
)


const ExamplesTab = () => (
  <>
    <p className="story-description">Code examples and advanced usage patterns - static mocks show button states, Live components require a wallet</p>

    <StorySection
      title="Simple ETH Transfer (Sepolia)"
      description="Four key states of a single-step flow"
      code={dedent`
        <TransactionButton
          steps={[ txStep('send', 'Send ETH', { to: '0xd8dA6BF...', value: parseEther('0.001') }) ]}
          chainId={sepolia.id}
          label="Send 0.001 ETH"
        />
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
      description="approveAndExecute helper auto-skips approve when allowance is sufficient"
      code={dedent`
        <TransactionButton
          steps={approveAndExecute({
            token: USDC_ADDRESS,
            spender: VITALIK_ADDRESS,
            amount: 1000000n,
            tx: { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'transfer', args: [...] },
            label: 'Transfer USDC',
          })}
          label="Approve + Transfer"
        />
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MockFlowSteps steps={[
          { id: 'approve', label: 'Approve USDC', current: false, done: true },
          { id: 'transfer', label: 'Transfer USDC', current: true, done: false },
        ]} />
        <TxbMockButton state="tx-pending" label="Sending Transfer..." />
      </div>
    </StorySection>

    <StorySection
      title="Safety Delay"
      description="5-second confirmation countdown via safety.delayMs"
      code={dedent`
        <TransactionButton
          steps={[ txStep('send', 'Send', { to: '0x...', value: parseEther('0.001') }) ]}
          safety={{ delayMs: 5000 }}
        />
      `}
    >
      <TxbMockButton state="confirming-risk" label="Confirm in 5s..." />
    </StorySection>

    <StorySection
      title="Rejected by User"
      description="Distinct state from error - user closed the wallet prompt"
    >
      <TxbMockButton state="rejected" />
    </StorySection>

    <StorySection
      title="Compound Components"
      description="FlowSteps + FlowProgress placed anywhere - auto-connect via TxKitProvider"
      code={dedent`
        <TransactionButton steps={[...]} label="Multi-step" />
        {/* These can be anywhere in the tree */}
        <FlowSteps />
        <FlowProgress />
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MockFlowSteps steps={[
          { id: 'approve', label: 'Approve USDC', current: false, done: true },
          { id: 'transfer', label: 'Transfer', current: true, done: false },
        ]} />
        <TxbMockButton state="tx-pending" label="Approve + Transfer" />
        <div className="txkit-fp" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
          <div className="txkit-fp-bar" style={{ width: '50%' }} />
        </div>
      </div>
    </StorySection>

    <StorySection
      title="Headless Hook (useTransactionFlow)"
      description="Headless - your UI, txKit logic. Mock shows ready-state payload"
      headless
      code={dedent`
        const { flow, start, retry, reset } = useTransactionFlow({
          steps: [ txStep('send', 'Send', { to, value }) ],
          chainId: sepolia.id,
        })
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
