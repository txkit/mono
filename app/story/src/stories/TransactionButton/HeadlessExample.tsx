import { parseEther } from 'viem'
import { sepolia } from 'viem/chains'
import { useTransactionFlow, txStep } from '@txkit/react'

import { InfoGrid } from '../../components'


const HeadlessFlowExample = () => {
  const {
    flow,
    start,
    reset,
    retry,
  } = useTransactionFlow({
    steps: [
      txStep('send', 'Send ETH', (context) => ({
        to: context.address,
        value: parseEther('0.001'),
      })),
    ],
    chainId: sepolia.id,
  })

  const currentStep = flow.steps[flow.currentStepIndex]

  return (
    <div>
      <InfoGrid entries={[
        { label: 'Flow Status', value: flow.status },
        { label: 'Step Status', value: currentStep?.status ?? '-' },
        {
          label: 'Hash',
          value: currentStep?.hash ? `${currentStep.hash.slice(0, 10)}...${currentStep.hash.slice(-8)}` : '-',
          mono: true,
        },
        {
          label: 'Error',
          value: currentStep?.error ? currentStep.error.message : '-',
          color: currentStep?.error ? '#ef4444' : undefined,
        },
      ]} />
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
