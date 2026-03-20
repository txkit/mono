import { useState } from 'react'
import { erc20Abi, parseEther } from 'viem'
import { sepolia } from 'viem/chains'
import {
  TxKitProvider,
  TransactionButton,
  TokenBalance,
  FlowSteps,
  FlowProgress,
  FlowToast,
  useTransactionFlow,
  txStep,
  approveAndExecute,
} from '@txkit/react'

import StorySection from '../StorySection'
import StateVisualizer from './StateVisualizer'
import useControls from '../controls/useControls'
import ControlPanel from '../controls/ControlPanel'
import { usePlayground } from '../PlaygroundContext'
import { defaultConfig, useStoryConfig, USDC_ADDRESS, VITALIK_ADDRESS } from '../config'


const HeadlessFlowExample = () => {
  const {
    flow,
    steps,
    start,
    reset,
    retry,
  } = useTransactionFlow({
    steps: [
      txStep('send', 'Send ETH', {
        to: VITALIK_ADDRESS,
        value: parseEther('0.001'),
      }),
    ],
    chainId: sepolia.id,
  })

  const currentStep = flow.steps[flow.currentStepIndex]

  return (
    <div>
      <div className="story-info-grid">
        <span className="story-info-key">Flow Status</span>
        <span className="story-info-value">{flow.status}</span>
        <span className="story-info-key">Step Status</span>
        <span className="story-info-value">{currentStep?.status ?? '-'}</span>
        <span className="story-info-key">Hash</span>
        <span className="story-info-value" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
          {currentStep?.hash ? `${currentStep.hash.slice(0, 10)}...${currentStep.hash.slice(-8)}` : '-'}
        </span>
        <span className="story-info-key">Error</span>
        <span className="story-info-value" style={{ color: currentStep?.error ? '#ef4444' : undefined }}>
          {currentStep?.error ? currentStep.error.message : '-'}
        </span>
      </div>
      <div className="headless-tx-actions" style={{ marginTop: 8 }}>
        {
          flow.status === 'idle' && (
            <button type="button" className="headless-tx-btn" onClick={start}>
              Send 0.001 ETH
            </button>
          )
        }
        {
          (flow.status === 'error' || flow.status === 'rejected') && (
            <button type="button" className="headless-tx-btn headless-tx-btn--retry" onClick={retry}>
              Retry
            </button>
          )
        }
        {
          flow.status === 'completed' && (
            <button type="button" className="headless-tx-btn headless-tx-btn--success" onClick={reset}>
              Reset
            </button>
          )
        }
      </div>
    </div>
  )
}

const InteractiveTransactionButton = () => {
  const { values, entries, reset } = useControls({
    label: { type: 'string', default: 'Send 0.001 ETH' },
    delayMs: { type: 'number', default: 0, min: 0, max: 15000, step: 1000 },
    showExplorerLink: { type: 'boolean', default: true },
    disabled: { type: 'boolean', default: false },
  })

  return (
    <>
      <ControlPanel entries={entries} onReset={reset} />
      <div className="story-card">
        <TransactionButton
          steps={[
            txStep('send', 'Send ETH', {
              to: VITALIK_ADDRESS,
              value: parseEther('0.001'),
            }),
          ]}
          chainId={sepolia.id}
          label={values.label}
          safety={{ delayMs: values.delayMs }}
          showExplorerLink={values.showExplorerLink}
          disabled={values.disabled}
        />
      </div>
    </>
  )
}

const TransactionButtonStory = () => {
  const { theme, variant } = usePlayground()
  const config = useStoryConfig(defaultConfig, theme, variant)
  const [ activeState, setActiveState ] = useState('pending')

  return (
    <TxKitProvider config={config}>
      <div>
        <div className="story-section">
          <h3>State Machine</h3>
          <p className="story-description">Click a state to highlight it in the lifecycle flow</p>
          <StateVisualizer currentState={activeState} onStateClick={setActiveState} />
        </div>

        <div className="story-section">
          <h3>Interactive</h3>
          <p className="story-description">Toggle props to see changes live</p>
          <InteractiveTransactionButton />
        </div>

        <StorySection
          title="Simple ETH Transfer (Sepolia)"
          description="Send 0.001 ETH using the new steps API"
          code={`<TransactionButton
  steps={[ txStep('send', 'Send ETH', { to: '0xd8dA6BF...', value: parseEther('0.001') }) ]}
  chainId={sepolia.id}
  label="Send 0.001 ETH"
/>`}
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
          code={`<TransactionButton
  steps={approveAndExecute({
    token: USDC_ADDRESS,
    spender: VITALIK_ADDRESS,
    amount: 1000000n,
    tx: { address: USDC_ADDRESS, abi: erc20Abi, functionName: 'transfer', args: [...] },
    label: 'Transfer USDC',
  })}
  label="Approve + Transfer"
/>`}
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
          code={`<TransactionButton steps={[...]} label="Multi-step" />
{/* These can be anywhere in the tree */}
<FlowSteps />
<FlowProgress />`}
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
          code={`<TransactionButton
  steps={[ txStep('send', 'Send', { to: '0x...', value: parseEther('0.001') }) ]}
  safety={{ delayMs: 5000 }}
  label="Send with Delay"
/>`}
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
          code={`<TokenBalance /> {/* auto-refreshes after tx */}
<TransactionButton steps={[...]} />`}
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
          description="Full control via useTransactionFlow hook"
        >
          <HeadlessFlowExample />
        </StorySection>
      </div>

      <FlowToast />
    </TxKitProvider>
  )
}


export default TransactionButtonStory
