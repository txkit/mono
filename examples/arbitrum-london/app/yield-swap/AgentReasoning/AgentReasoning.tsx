import { Icon, type IconName } from '@/src/ui/Icon'


type AgentReasoningProps = {
  reasoningLines: string[],
  isPreparing: boolean,
  isPrepared: boolean,
  isRejected: boolean,
}

type ReasoningTheme = {
  card: string,
  iconCircle: string,
  iconName: IconName,
  iconColor: string,
  heading: string,
  lineDot: string,
  lineText: string,
}

// Active = the live blue "thinking" card. Rejected mirrors the same layout but
// goes neutral-grey (dismissed) with an x-circle, the way the success card goes
// green - so a declined transaction reads as "no longer active", not an error.
const ACTIVE_THEME: ReasoningTheme = {
  card: 'bg-accent/10',
  iconCircle: 'bg-accent',
  iconName: 'brain',
  iconColor: 'text-accent-text',
  heading: 'text-accent',
  lineDot: 'bg-accent',
  lineText: 'text-foreground',
}

const REJECTED_THEME: ReasoningTheme = {
  card: 'bg-card',
  iconCircle: 'bg-card-sunken',
  iconName: 'x-circle',
  iconColor: 'text-muted',
  heading: 'text-muted',
  lineDot: 'bg-muted',
  lineText: 'text-muted',
}

const resolveStatus = (isPreparing: boolean, isPrepared: boolean, isRejected: boolean, hasLines: boolean): string => {
  if (isPreparing) {
    return 'Preparing transaction...'
  }

  if (isPrepared) {
    return 'Transaction prepared'
  }

  if (isRejected) {
    return 'Transaction rejected'
  }

  if (hasLines) {
    return 'Awaiting your confirmation'
  }

  return 'Ready'
}

/**
 * The visible "agent thinking" indicator for the Pendle flow. While the agent
 * call is in flight it pulses and shows typing dots; once a reply lands its real
 * text (sentence-split upstream) renders as staggered reasoning lines. The lines
 * are never fabricated - they are the agent's actual reply, so the card is an
 * honest recap of why the envelope was prepared. After a Reject the same card
 * persists but turns grey + "Transaction rejected" (no reflow into a bubble).
 */
export const AgentReasoning = (props: AgentReasoningProps) => {
  const { reasoningLines, isPreparing, isPrepared, isRejected } = props
  const hasLines = reasoningLines.length > 0
  const status = resolveStatus(isPreparing, isPrepared, isRejected, hasLines)
  const theme = isRejected ? REJECTED_THEME : ACTIVE_THEME
  const iconAnimationClass = isPreparing ? 'tx-anim-pulse' : ''

  const linesNode = hasLines ? (
    <div className="space-y-2">
      {reasoningLines.map((line, index) => (
        <div
          key={`${index}-${line}`}
          className="flex items-start gap-2 tx-anim-enter-x"
          style={{ animationDelay: `${index * 0.12}s` }}
        >
          <span className={`mt-2 size-1 shrink-0 rounded-full ${theme.lineDot}`} />
          <p className={`text-sm leading-relaxed ${theme.lineText}`}>{line}</p>
        </div>
      ))}
    </div>
  ) : null

  const typingNode = isPreparing ? (
    <div className="flex gap-1 pt-2" aria-hidden="true">
      <span className="size-1 rounded-full bg-accent tx-anim-typing" style={{ animationDelay: '0s' }} />
      <span className="size-1 rounded-full bg-accent tx-anim-typing" style={{ animationDelay: '0.2s' }} />
      <span className="size-1 rounded-full bg-accent tx-anim-typing" style={{ animationDelay: '0.4s' }} />
    </div>
  ) : null

  return (
    <div role="status" aria-live="polite" className={`rounded-lg border border-border p-5 ${theme.card}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-full ${theme.iconCircle} ${iconAnimationClass}`}>
          <Icon name={theme.iconName} className={`size-5 ${theme.iconColor}`} />
        </span>
        <div>
          <h3 className={`text-sm font-semibold ${theme.heading}`}>Agent reasoning</h3>
          <p className="text-xs text-muted">{status}</p>
        </div>
      </div>
      {linesNode}
      {typingNode}
    </div>
  )
}
