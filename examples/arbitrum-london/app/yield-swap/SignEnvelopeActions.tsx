import { Icon } from '@/src/ui/Icon'

import { formatTxExplorerUrl, resolveExplorerLabel, resolveSendErrorText } from './utils/formatters'


type SignEnvelopeActionsProps = {
  isConnected: boolean,
  isSigning: boolean,
  isConfirming: boolean,
  isConfirmed: boolean,
  isBusySendingTx: boolean,
  txHash: `0x${string}` | undefined,
  sendError: Error | null,
  envelopeChainId: number | null,
  onReject: () => void,
  onSign: () => void | Promise<void>,
}

/**
 * Review actions for a prepared envelope: reject, sign (one click via wagmi in
 * the parent), and the explorer link once a tx hash is returned. Split out of
 * PendleAgentChat so the chat component stays focused on conversation state.
 */
export const SignEnvelopeActions = (props: SignEnvelopeActionsProps) => {
  const {
    onSign,
    onReject,
    txHash,
    sendError,
    isSigning,
    isConnected,
    isConfirmed,
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

  const pendingLinkNode = txHash !== undefined && explorerUrl !== null && !isConfirmed ? (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block text-center text-xs font-mono text-muted hover:text-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
    >
      View pending tx on {explorerLabel}: {txHash}
    </a>
  ) : null

  // The "Executed on-chain" heading now lives in the reasoning card (it flips to
  // the executed theme on confirm), so this is just the explorer CTA - a clean
  // "View on <explorer>" link rather than the raw hash.
  const successNode = txHash !== undefined && explorerUrl !== null && isConfirmed ? (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card-sunken px-4 py-3 text-sm font-medium text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      View on {explorerLabel}
      <Icon name="external-link" className="size-4 shrink-0 text-accent opacity-60 transition-opacity group-hover:opacity-100" />
    </a>
  ) : null

  // Once the tx is confirmed the success card is the terminal state, so the
  // Reject / sign actions drop away - a clean "Executed on-chain" card is all
  // that remains (navigate via the header to run another flow).
  const actionsRowNode = !isConfirmed ? (
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
  ) : null

  return (
    <div className="space-y-3">
      {successNode}
      {actionsRowNode}
      {notConnectedNode}
      {sendErrorNode}
      {pendingLinkNode}
    </div>
  )
}
