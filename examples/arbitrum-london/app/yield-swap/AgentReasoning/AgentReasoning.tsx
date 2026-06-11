import { useRef, type ReactNode } from 'react'

import { Icon, type IconName } from '@/src/ui/Icon'

import { formatTxHashShort } from '../utils/formatters'
import { TypedText } from './TypedText'


export type ReasoningStatus = 'preparing' | 'replied' | 'prepared' | 'rejected' | 'executed' | 'connect' | 'connected'

export type ExecutedTx = {
  hash: string,
  href: string,
}

type AgentReasoningProps = {
  reasoningLines: string[],
  status: ReasoningStatus,
  pipelineSteps?: string[],
  executedTx?: ExecutedTx,
  isInstant?: boolean,
  children?: ReactNode,
  onTypedComplete?: () => void,
}

type ReasoningTheme = {
  card: string,
  iconCircle: string,
  iconName: IconName,
  iconColor: string,
  heading: string,
  lineText: string,
}

// Active = the live blue "thinking" card. Rejected goes neutral-grey (dismissed)
// with an x-circle; executed goes success-green with a check-circle - so the same
// card transitions blue -> green in place when the tx confirms, instead of a
// separate success card appearing below.
const ACTIVE_THEME: ReasoningTheme = {
  card: 'bg-accent/10',
  iconCircle: 'bg-accent',
  iconName: 'brain',
  iconColor: 'text-accent-text',
  heading: 'text-accent',
  lineText: 'text-foreground',
}

const REJECTED_THEME: ReasoningTheme = {
  card: 'bg-card',
  iconCircle: 'bg-card-sunken',
  iconName: 'x-circle',
  iconColor: 'text-muted',
  heading: 'text-muted',
  lineText: 'text-muted',
}

const EXECUTED_THEME: ReasoningTheme = {
  card: 'bg-card',
  iconCircle: 'bg-success-bg',
  iconName: 'check-circle',
  iconColor: 'text-success',
  heading: 'text-success',
  lineText: 'text-foreground',
}

const THEME_BY_STATUS: Record<ReasoningStatus, ReasoningTheme> = {
  preparing: ACTIVE_THEME,
  replied: ACTIVE_THEME,
  prepared: ACTIVE_THEME,
  rejected: REJECTED_THEME,
  executed: EXECUTED_THEME,
  connect: ACTIVE_THEME,
  connected: EXECUTED_THEME,
}

// The card's single header line next to the status icon. Every status has
// one - the icon + status pair IS the card identity (no separate block title).
const STATUS_HEADINGS: Record<ReasoningStatus, string> = {
  preparing: 'Preparing transaction...',
  replied: 'Replied',
  prepared: 'Transaction prepared',
  rejected: 'Transaction rejected',
  executed: 'Transaction confirmed',
  connect: 'Wallet required',
  connected: 'Wallet connected',
}

/**
 * The "agent thinking" card for every bot turn in the Pendle / RWA flows. Each
 * assistant turn renders as one of these (never a plain bubble), so a turn that
 * prepared, was declined, replied, or executed keeps the same card identity
 * through the whole conversation. The header is just the status icon + status
 * line (no block title) - state lives in that pair + the card theme, so on
 * confirmation the same card greens in place ("Transaction confirmed") and the
 * agent voices the outcome itself via the executedTx line ("Transaction
 * submitted: ..." + the explorer link), with no duplicate success card below.
 * While a turn is in flight the card pulses and shows typing dots; once a reply
 * lands its real text (sentence-split upstream) renders as staggered reasoning
 * lines, so the card is an honest recap of why the envelope was prepared.
 */
export const AgentReasoning = (props: AgentReasoningProps) => {
  const { reasoningLines, status, pipelineSteps, executedTx, isInstant, children, onTypedComplete } = props
  const isPreparing = status === 'preparing'
  const isExecuted = status === 'executed'
  const hasLines = reasoningLines.length > 0
  const hasSteps = pipelineSteps !== undefined && pipelineSteps.length > 0
  const heading = STATUS_HEADINGS[status]
  const theme = THEME_BY_STATUS[status]

  const iconPulseClass = isPreparing ? 'tx-anim-pulse' : ''
  // The pop celebrates the live prepared -> executed flip; a turn restored
  // from storage is history and must not replay it.
  const iconPopClass = isExecuted && !isInstant ? 'tx-anim-pop' : ''
  const iconAnimationClass = iconPulseClass || iconPopClass

  // Lines type in parallel, so "typing finished" = every line reported in.
  // The counter lives in a ref (render-independent); the callback is read from
  // props at call time, so it is never stale.
  const typedLineCountRef = useRef(0)
  const handleLineTyped = () => {
    typedLineCountRef.current += 1
    if (typedLineCountRef.current >= reasoningLines.length) {
      onTypedComplete?.()
    }
  }

  // The pipeline trace persists on the turn like an LLM thinking block: the
  // steps shown while preparing never disappear - they settle above the reply
  // as the muted record of what the agent loop did for this turn.
  const stepsNode = hasSteps ? (
    <div className={`space-y-1 ${hasLines ? 'mb-3' : ''}`}>
      {pipelineSteps.map((step) => (
        <p key={step} className="font-mono text-xs text-muted">
          {step}
        </p>
      ))}
    </div>
  ) : null

  // Only a live incoming reply types out; a turn restored from storage is
  // history and renders its full text at once (LLM apps never replay typing).
  const linesNode = hasLines ? (
    <div className="space-y-2">
      {reasoningLines.map((line, index) => (
        <p key={index} className={`text-sm leading-relaxed ${theme.lineText}`}>
          {isInstant ? line : <TypedText text={line} onComplete={handleLineTyped} />}
        </p>
      ))}
    </div>
  ) : null

  // The outcome is voiced by the agent inside its own turn (LLM-style), so the
  // explorer link lives here rather than as a separate block under the review.
  // The short hash + icon IS the link - no "View on ..." text.
  const executedTxNode = executedTx !== undefined ? (
    <p className={`text-sm leading-relaxed ${hasLines ? 'mt-2' : ''} ${theme.lineText}`}>
      Transaction submitted:{' '}
      <a
        href={executedTx.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View transaction ${executedTx.hash} on the block explorer`}
        className="inline-flex items-center gap-1 rounded font-mono text-accent transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {formatTxHashShort(executedTx.hash)}
        <Icon name="external-link" className="size-3.5 shrink-0" />
      </a>
    </p>
  ) : null

  const typingNode = isPreparing ? (
    <div className="flex gap-1 pt-2" aria-hidden="true">
      <span className="size-1 rounded-full bg-accent tx-anim-typing" style={{ animationDelay: '0s' }} />
      <span className="size-1 rounded-full bg-accent tx-anim-typing" style={{ animationDelay: '0.2s' }} />
      <span className="size-1 rounded-full bg-accent tx-anim-typing" style={{ animationDelay: '0.4s' }} />
    </div>
  ) : null

  return (
    // data-status lets the chat scroll the freshly prepared turn to the top of
    // the transcript; scroll-mt clears the scroll area's top fade.
    <div role="status" aria-live="polite" data-status={status} className={`scroll-mt-5 rounded-lg border border-border p-5 ${theme.card}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-full ${theme.iconCircle} ${iconAnimationClass}`}>
          <Icon name={theme.iconName} className={`size-5 ${theme.iconColor}`} />
        </span>
        <h3 className={`text-sm font-semibold ${theme.heading}`}>{heading}</h3>
      </div>
      {stepsNode}
      {linesNode}
      {children}
      {executedTxNode}
      {typingNode}
    </div>
  )
}
