import { formatTxExplorerUrl, resolveExplorerLabel, resolveSendErrorText } from './utils/formatters'


type SignEnvelopeActionsProps = {
  isConnected: boolean,
  isSigning: boolean,
  isConfirming: boolean,
  isBusySendingTx: boolean,
  txHash: `0x${string}` | undefined,
  sendError: Error | null,
  envelopeChainId: number | null,
  onReject: () => void,
  onSign: () => void | Promise<void>,
}

/**
 * Review actions for a prepared envelope: reject, sign (one click via wagmi in
 * the parent), and the pending-tx link while waiting for the receipt. Split out
 * of PendleAgentChat so the chat component stays focused on conversation state.
 * Unmounts on confirmation - the executed turn card carries the final
 * "Transaction submitted" line + explorer link itself.
 */
export const SignEnvelopeActions = (props: SignEnvelopeActionsProps) => {
  const {
    onSign,
    onReject,
    txHash,
    sendError,
    isSigning,
    isConnected,
    isConfirming,
    isBusySendingTx,
    envelopeChainId,
  } = props

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

  const explorerLabel = resolveExplorerLabel(envelopeChainId)
  const explorerUrl = txHash !== undefined && envelopeChainId !== null
    ? formatTxExplorerUrl(envelopeChainId, txHash)
    : null

  const pendingLinkNode = txHash !== undefined && explorerUrl !== null ? (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-center text-xs font-mono text-muted hover:text-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
    >
      View pending tx on {explorerLabel}: {txHash}
    </a>
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
      {pendingLinkNode}
    </div>
  )
}
