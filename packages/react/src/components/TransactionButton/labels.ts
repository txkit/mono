export type TransactionButtonLabels = {
  /** Button text in idle state */
  send?: string
  /** Button text during transaction simulation */
  simulating?: string
  /** Button text during risk review */
  confirmingRisk?: string
  /** Button text when simulation fails */
  simulationFailed?: string
  /** Button text during token approval */
  approving?: string
  /** Button text while waiting for wallet signature */
  awaitingSignature?: string
  /** Button text while transaction is pending on-chain */
  pending?: string
  /** Button text after successful confirmation */
  success?: string
  /** Button text when transaction fails */
  error?: string
  /** Button text when user rejects in wallet */
  rejected?: string
  /** Button text to retry after failure */
  retry?: string
  /** Risk review dialog confirm button text */
  confirm?: string
  /** Risk review dialog cancel button text */
  cancel?: string
  /** Button text to submit despite simulation failure */
  forceSubmit?: string
  /** Link text to skip an optional step */
  skipStep?: string
  /** Link text to view transaction on block explorer */
  viewOnExplorer?: string
  /** Status announcement template while simulating - {step} is the step label */
  statusSimulating?: string
  /** Status announcement while reviewing tx risk + decoded calldata */
  statusConfirmingRisk?: string
  /** Status announcement template after simulation fails - {error} is the inner message */
  statusSimulationFailed?: string
  /** Status announcement template after the tx is broadcast - {step} is the step label */
  statusTxPending?: string
  /** Status announcement template while polling a condition - {step} is the step label */
  statusWaiting?: string
  /** Status announcement after a successful flow */
  statusCompleted?: string
  /** Status announcement template for a failed flow - {error} is the inner message */
  statusError?: string
  /** Status announcement when the wallet popup is rejected */
  statusRejected?: string
  /** Status announcement when the user cancels the flow */
  statusCanceled?: string
  /** Default fallback noun used inside `statusSimulating` when no step label is provided */
  fallbackTransaction?: string
  /** Default fallback noun used inside `statusWaiting` when no step label is provided */
  fallbackCondition?: string
}

export const defaultLabels: Required<TransactionButtonLabels> = {
  send: 'Send',
  simulating: 'Simulating',
  confirmingRisk: 'Review Transaction',
  simulationFailed: 'Simulation Failed',
  approving: 'Approving',
  awaitingSignature: 'Confirm in Wallet',
  pending: 'Pending',
  success: 'Confirmed',
  error: 'Failed',
  rejected: 'Rejected',
  retry: 'Try Again',
  confirm: 'Confirm',
  cancel: 'Cancel',
  forceSubmit: 'Send Anyway',
  skipStep: 'Skip step',
  viewOnExplorer: 'View on Explorer',
  statusSimulating: 'Simulating {step}...',
  statusConfirmingRisk: 'Review transaction details before confirming',
  statusSimulationFailed: 'Simulation failed{error}',
  statusTxPending: '{step} submitted. Waiting for confirmation...',
  statusWaiting: 'Waiting for {step}...',
  statusCompleted: 'Transaction confirmed!',
  statusError: 'Transaction failed{error}',
  statusRejected: 'Transaction rejected',
  statusCanceled: 'Transaction canceled',
  fallbackTransaction: 'Transaction',
  fallbackCondition: 'condition',
}
