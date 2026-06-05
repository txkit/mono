import { Icon } from '@/src/ui/Icon'

import { formatTxExplorerUrl, resolveExplorerLabel } from './utils/formatters'


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
  onSign: () => void,
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

    if (isConfirmed) {
      return 'Confirmed - sign another?'
    }

    return 'Sign tx in wallet'
  }

  const notConnectedNode = !isConnected ? (
    <p className="text-xs text-muted text-center">Connect your wallet to sign</p>
  ) : null

  const sendErrorNode = sendError !== null ? (
    <div role="alert" className="rounded-md border border-error bg-error-bg px-3 py-2 text-xs text-error">
      {sendError.message}
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

  const successNode = txHash !== undefined && explorerUrl !== null && isConfirmed ? (
    <div role="status" aria-live="polite" className="rounded-lg border-2 border-success bg-card p-5 tx-anim-card-in">
      <div className="mb-4 flex items-center gap-3">
        <span className="tx-anim-pop flex size-12 items-center justify-center rounded-full bg-success-bg">
          <Icon name="check-circle" className="size-6 text-success" />
        </span>
        <div>
          <h3 className="font-semibold text-success">Executed on-chain</h3>
          <p className="text-sm text-muted">Transaction confirmed</p>
        </div>
      </div>
      <p className="mb-2 text-xs uppercase tracking-wider text-muted">Transaction hash</p>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 rounded-lg bg-card-sunken p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <code className="flex-1 truncate font-mono text-sm text-foreground">{txHash}</code>
        <span className="shrink-0 text-accent opacity-60 transition-opacity group-hover:opacity-100" aria-hidden="true">↗</span>
      </a>
      <p className="mt-2 text-center text-xs text-muted">View on {explorerLabel}</p>
    </div>
  ) : null

  return (
    <div className="space-y-3">
      {successNode}
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
