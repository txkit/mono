import { useState } from 'react'

import StateVisualizer from '../shared/StateVisualizer'


const stateLabels: Record<string, string> = {
  pending: 'Send 0.001 ETH',
  simulating: 'Simulating...',
  'confirming-risk': 'Confirm Risk',
  'simulation-failed': 'Simulation Failed',
  signing: 'Confirm in Wallet',
  'tx-pending': 'Transaction Pending',
  waiting: 'Waiting...',
  completed: 'Completed',
  skipped: 'Skipped',
  error: 'Error - Try Again',
  rejected: 'Rejected',
  canceled: 'Canceled',
}

const stateDataState: Record<string, string> = {
  pending: 'idle',
  simulating: 'simulating',
  'confirming-risk': 'confirming-risk',
  'simulation-failed': 'simulation-failed',
  signing: 'signing',
  'tx-pending': 'tx-pending',
  waiting: 'waiting',
  completed: 'completed',
  skipped: 'skipped',
  error: 'error',
  rejected: 'rejected',
  canceled: 'canceled',
}

const MockPreview = () => {
  const [ activeState, setActiveState ] = useState('pending')

  return (
    <>
      <p className="story-description">Click a state to see how the button looks - no wallet needed</p>
      <StateVisualizer currentState={activeState} onStateClick={setActiveState} />
      <div className="story-card" style={{ marginTop: 16 }}>
        <div className="txkit-root txkit-dark" style={{ display: 'inline-block' }}>
          <div className="txkit-txb">
            <button
              type="button"
              className="txkit-txb-button"
              data-state={stateDataState[activeState] ?? 'idle'}
              disabled={activeState === 'signing' || activeState === 'tx-pending' || activeState === 'waiting'}
              style={{ pointerEvents: 'none' }}
            >
              {stateLabels[activeState] ?? 'Send 0.001 ETH'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}


export default MockPreview
