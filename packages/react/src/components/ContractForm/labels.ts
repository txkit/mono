export type ContractFormLabels = {
  /** Submit button label. @default functionName */
  submit: string
  /** Submit button label while transaction is pending */
  submitting: string
  /** Message for unsupported field types (tuple, array in Phase 1) */
  unsupportedType: string
  /** Error message when function is overloaded */
  overloadedError: string
  /** Error message when function not found in ABI */
  notFoundError: string
  /** Review section toggle label */
  reviewTransaction: string
  /** Copy button label */
  copyCalldata: string
  /** Payable value field label */
  payableValue: string
  /** Required field validation message */
  required: string
  /** Invalid address message */
  invalidAddress: string
  /** Invalid number message */
  invalidNumber: string
  /** Out of range message */
  outOfRange: string
  /** Invalid hex message */
  invalidHex: string
  /** Invalid length message */
  invalidLength: string
  /** Precision loss message */
  precisionLoss: string
}

export const defaultLabels: ContractFormLabels = {
  submit: 'Submit',
  submitting: 'Submitting...',
  unsupportedType: 'Complex type - use headless hook for custom rendering',
  overloadedError: 'Function is overloaded. Overload resolution is not yet supported.',
  notFoundError: 'Function not found in ABI (or is view/pure)',
  reviewTransaction: 'Review transaction',
  copyCalldata: 'Copy calldata',
  payableValue: 'Value (ETH)',
  required: 'Required',
  invalidAddress: 'Invalid Ethereum address',
  invalidNumber: 'Invalid number',
  outOfRange: 'Value out of range',
  invalidHex: 'Invalid hex format',
  invalidLength: 'Invalid length',
  precisionLoss: 'Precision exceeds 18 decimals',
}
