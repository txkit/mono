import { resolveSendErrorText } from './utils/formatters'


type SignEnvelopeActionsProps = {
  isConnected: boolean,
  isSigning: boolean,
  isConfirming: boolean,
  sendError: Error | null,
  onReject: () => void,
  onSign: () => void | Promise<void>,
}

/**
 * Review actions for a prepared envelope: reject and sign (one click via
 * wagmi in the parent). Split out of the chat components (Pendle + RWA) so
 * each stays focused on conversation state. Unmounts on confirmation - the
 * executed turn card carries the final "Transaction submitted" line +
 * explorer link itself.
 */
export const SignEnvelopeActions = (props: SignEnvelopeActionsProps) => {
  const {
    onSign,
    onReject,
    sendError,
    isSigning,
    isConnected,
    isConfirming,
  } = props

  const isBusySendingTx = isSigning || isConfirming

  const resolveTxButtonLabel = (): string => {
    if (isSigning) {
      return 'Sign in your wallet...'
    }

    if (isConfirming) {
      return 'Waiting for confirmation...'
    }

    return 'Sign tx in wallet'
  }

  const notConnectedNode = !isConnected ? (
    <p className="text-xs text-muted text-center">Connect your wallet to sign</p>
  ) : null

  const sendErrorNode = sendError !== null ? (
    <div role="alert" className="rounded-md border border-error bg-error-bg px-3 py-2 text-xs text-error break-words">
      {resolveSendErrorText(sendError)}
    </div>
  ) : null

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onReject}
          disabled={isBusySendingTx}
          className="flex-1 rounded-md border border-border bg-transparent px-4 py-3 text-sm text-muted hover:text-foreground hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={onSign}
          disabled={!isConnected || isBusySendingTx}
          className="flex-1 rounded-md border border-success bg-success-bg px-4 py-3 text-sm text-success hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resolveTxButtonLabel()}
        </button>
      </div>
      {notConnectedNode}
      {sendErrorNode}
    </div>
  )
}
