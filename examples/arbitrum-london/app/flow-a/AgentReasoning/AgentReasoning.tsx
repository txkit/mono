import { Icon } from '@/src/ui/Icon'


type AgentReasoningProps = {
  reasoningLines: string[],
  isPreparing: boolean,
  isPrepared: boolean,
}

const resolveStatus = (isPreparing: boolean, isPrepared: boolean, hasLines: boolean): string => {
  if (isPreparing) {
    return 'Preparing transaction...'
  }

  if (isPrepared) {
    return 'Transaction prepared'
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
 * honest recap of why the envelope was prepared.
 */
export const AgentReasoning = (props: AgentReasoningProps) => {
  const { reasoningLines, isPreparing, isPrepared } = props
  const hasLines = reasoningLines.length > 0
  const status = resolveStatus(isPreparing, isPrepared, hasLines)
  const iconAnimationClass = isPreparing ? 'tx-anim-pulse' : ''

  const linesNode = hasLines ? (
    <div className="space-y-2">
      {reasoningLines.map((line, index) => (
        <div
          key={`${index}-${line}`}
          className="flex items-start gap-2 tx-anim-enter-x"
          style={{ animationDelay: `${index * 0.12}s` }}
        >
          <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
          <p className="text-sm leading-relaxed text-foreground">{line}</p>
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
    <div role="status" aria-live="polite" className="rounded-lg border border-border bg-accent/10 p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-full bg-accent ${iconAnimationClass}`}>
          <Icon name="brain" className="size-5 text-accent-text" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-accent">Agent reasoning</h3>
          <p className="text-xs text-muted">{status}</p>
        </div>
      </div>
      {linesNode}
      {typingNode}
    </div>
  )
}
