import { erc20Abi, parseEther } from 'viem'
import { sepolia } from 'viem/chains'
import {
  TxKitProvider,
  TransactionButton,
  TokenBalance,
  FlowSteps,
  FlowProgress,
  FlowToast,
  approveAndExecute,
  txStep,
} from '@txkit/react'

import StorySection from '../../StorySection'
import dedent from '../shared/dedent'
import HeadlessFlowExample from './HeadlessExample'
import { USDC_ADDRESS, VITALIK_ADDRESS } from '../../config'


const ExamplesTab = ({ config }: { config: TxKit.Config }) => (
  <TxKitProvider config={config}>
    <p className="story-description">Code examples and advanced usage patterns</p>
    <StorySection
      title="Simple ETH Transfer (Sepolia)"
      description="Send 0.001 ETH using the new steps API"
      code={dedent`
        <TransactionButton
          steps={[ txStep('send', 'Send ETH', { to: '0xd8dA6BF...', value: parseEther('0.001') }) ]}
          chainId={sepolia.id}
          label="Send 0.001 ETH"
        />
      `}
    >
      <TransactionButton
        steps={[
          txStep('send', 'Send ETH', {
            to: VITALIK_ADDRESS,
            value: parseEther('0.001'),
          }),
        ]}
        chainId={sepolia.id}
        label="Send 0.001 ETH"
      />
    </StorySection>

    <StorySection
      title="Multi-Step: Approve + Execute"
      description="Using approveAndExecute helper (auto-skips approve if allowance sufficient)"
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
      <TransactionButton
        steps={approveAndExecute({
          token: USDC_ADDRESS,
          spender: VITALIK_ADDRESS,
          amount: 1000000n,
          tx: {
            address: USDC_ADDRESS,
            abi: erc20Abi,
            functionName: 'transfer',
            args: [ VITALIK_ADDRESS, 1000000n ],
          },
          label: 'Transfer USDC',
        })}
        label="Approve + Transfer"
      />
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
        <FlowSteps />
        <TransactionButton
          steps={approveAndExecute({
            token: USDC_ADDRESS,
            spender: VITALIK_ADDRESS,
            amount: 1000000n,
            tx: {
              address: USDC_ADDRESS,
              abi: erc20Abi,
              functionName: 'transfer',
              args: [ VITALIK_ADDRESS, 1000000n ],
            },
            label: 'Transfer',
          })}
          label="Approve + Transfer"
        />
        <FlowProgress />
      </div>
    </StorySection>

    <StorySection
      title="With Safety Config (Delay Timer)"
      description="5-second confirmation delay"
      code={dedent`
        <TransactionButton
          steps={[ txStep('send', 'Send', { to: '0x...', value: parseEther('0.001') }) ]}
          safety={{ delayMs: 5000 }}
          label="Send with Delay"
        />
      `}
    >
      <TransactionButton
        steps={[
          txStep('send', 'Send ETH', {
            to: VITALIK_ADDRESS,
            value: parseEther('0.001'),
          }),
        ]}
        safety={{ delayMs: 5000 }}
        label="Send with Delay"
      />
    </StorySection>

    <StorySection
      title="Custom Render (Children Function)"
      description="Full control via render function"
    >
      <TransactionButton
        steps={[
          txStep('send', 'Send ETH', {
            to: VITALIK_ADDRESS,
            value: parseEther('0.001'),
          }),
        ]}
      >
        {({ flow, currentStep, explorerUrl, start, retry, reset }) => (
          <div className="custom-tx-render">
            <div>
              Flow: <strong>{flow.status}</strong>
              {currentStep && <> | Step: <strong>{currentStep.status}</strong></>}
            </div>
            {
              currentStep?.hash && (
                <code className="custom-tx-hash">
                  {currentStep.hash.slice(0, 18)}...
                </code>
              )
            }
            {
              explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="custom-tx-link"
                >
                  Explorer
                </a>
              )
            }
            {
              flow.status === 'idle' && (
                <button type="button" className="headless-tx-btn" onClick={start}>
                  Custom Send Button
                </button>
              )
            }
            {
              (flow.status === 'error' || flow.status === 'rejected') && (
                <button type="button" className="headless-tx-btn headless-tx-btn--retry" onClick={retry}>
                  Custom Retry
                </button>
              )
            }
            {
              flow.status === 'completed' && (
                <button type="button" className="headless-tx-btn headless-tx-btn--success" onClick={reset}>
                  Done - Reset
                </button>
              )
            }
          </div>
        )}
      </TransactionButton>
    </StorySection>

    <StorySection
      title="Balance Refresh After Transaction"
      description="TokenBalance auto-updates after TransactionButton completes via targeted invalidation"
      code={dedent`
        <TokenBalance /> {/* auto-refreshes after tx */}
        <TransactionButton steps={[...]} />
      `}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <TokenBalance />
        <TransactionButton
          label="Send 0 ETH"
          steps={[
            txStep('send', 'Send ETH', {
              to: VITALIK_ADDRESS,
              value: parseEther('0'),
            }),
          ]}
        />
      </div>
    </StorySection>

    <StorySection
      title="Headless Hook (Tier 3)"
      description="Headless - your UI, txKit logic. Full control via useTransactionFlow hook"
      headless
    >
      <HeadlessFlowExample />
    </StorySection>

    <FlowToast />
  </TxKitProvider>
)


export default ExamplesTab
