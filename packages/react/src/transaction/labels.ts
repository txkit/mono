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
  /** Link text to view transaction on block explorer */
  viewOnExplorer?: string
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
  viewOnExplorer: 'View on Explorer',
}
