import { parseEther } from 'viem'
import { sepolia } from 'viem/chains'
import { useTransactionFlow, txStep } from '@txkit/react'

import { VITALIK_ADDRESS } from '../../config'


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


export default HeadlessFlowExample
