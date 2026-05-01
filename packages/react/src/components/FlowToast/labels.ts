export type FlowToastLabels = {
  /** Toast title shown when the flow completes successfully */
  successMessage?: string
  /** Toast description for the success state */
  successDescription?: string
  /** Toast title shown when the flow errors */
  errorMessage?: string
  /** Toast title shown when the user rejects the wallet popup */
  rejectedMessage?: string
  /** Toast description for the rejected state */
  rejectedDescription?: string
  /** Toast title shown when the user cancels the flow */
  canceledMessage?: string
  /** Toast description for the canceled state */
  canceledDescription?: string
  /** ARIA label for the dismiss button */
  dismiss?: string
}

export const defaultLabels: Required<FlowToastLabels> = {
  successMessage: 'Transaction confirmed',
  successDescription: 'Your transaction has been confirmed on the blockchain.',
  errorMessage: 'Transaction failed',
  rejectedMessage: 'Transaction rejected',
  rejectedDescription: 'The transaction was declined in the wallet.',
  canceledMessage: 'Transaction canceled',
  canceledDescription: 'You canceled the flow before signing.',
  dismiss: 'Dismiss',
}
