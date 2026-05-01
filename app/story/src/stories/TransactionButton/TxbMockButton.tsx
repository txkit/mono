import React from 'react'


type MockState =
  | 'idle'
  | 'simulating'
  | 'confirming-risk'
  | 'simulation-failed'
  | 'signing'
  | 'tx-pending'
  | 'waiting'
  | 'completed'
  | 'skipped'
  | 'error'
  | 'rejected'
  | 'canceled'

type Props = {
  state?: MockState
  label?: string
}

const disabledStates: readonly MockState[] = [ 'signing', 'tx-pending', 'waiting', 'completed', 'skipped', 'canceled' ]

const stateLabels: Record<MockState, string> = {
  idle: 'Send 0.001 ETH',
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

const TxbMockButton: React.FC<Props> = ({ state = 'idle', label }) => (
  <div className="tx-txb">
    <button
      type="button"
      className="tx-txb-button"
      data-state={state}
      disabled={disabledStates.includes(state)}
    >
      {label ?? stateLabels[state]}
    </button>
  </div>
)


export default TxbMockButton
