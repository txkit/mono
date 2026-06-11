import { Icon, type IconName } from '@/src/ui/Icon'

import { TypedText } from './TypedText'


export type ReasoningStatus = 'preparing' | 'replied' | 'prepared' | 'rejected' | 'executed'

type AgentReasoningProps = {
  reasoningLines: string[],
  status: ReasoningStatus,
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
}

// Subtitle under the card heading. A plain clarifying reply has no outcome to
// report, so its subtitle is omitted - the reasoning lines (the agent's actual
// reply) carry the message on their own.
const STATUS_SUBTITLES: Record<ReasoningStatus, string | null> = {
  preparing: 'Preparing transaction...',
  replied: null,
  prepared: 'Transaction prepared',
  rejected: 'Transaction rejected',
  executed: 'Transaction confirmed',
}

/**
 * The "agent thinking" card for every bot turn in the Pendle / RWA flows. Each
 * assistant turn renders as one of these (never a plain bubble), so a turn that
 * prepared, was declined, replied, or executed keeps the same card identity
 * through the whole conversation - only the heading, subtitle and theme change.
 * On confirmation the prepared card becomes the executed card in place ("Executed
 * on-chain" / "Transaction confirmed"), so there is no duplicate success card.
 * While a turn is in flight the card pulses and shows typing dots; once a reply
 * lands its real text (sentence-split upstream) renders as staggered reasoning
 * lines, so the card is an honest recap of why the envelope was prepared.
 */
export const AgentReasoning = (props: AgentReasoningProps) => {
  const { reasoningLines, status } = props
  const isPreparing = status === 'preparing'
  const isExecuted = status === 'executed'
  const hasLines = reasoningLines.length > 0
  const subtitle = STATUS_SUBTITLES[status]
  const theme = THEME_BY_STATUS[status]
  const heading = isExecuted ? 'Executed on-chain' : 'Agent reasoning'

  const iconPulseClass = isPreparing ? 'tx-anim-pulse' : ''
  const iconPopClass = isExecuted ? 'tx-anim-pop' : ''
  const iconAnimationClass = iconPulseClass || iconPopClass

  const subtitleNode = subtitle !== null ? <p className="text-xs text-muted">{subtitle}</p> : null

  const linesNode = hasLines ? (
    <div className="space-y-2">
      {reasoningLines.map((line, index) => (
        <p key={`${index}-${line}`} className={`text-sm leading-relaxed ${theme.lineText}`}>
          <TypedText text={line} />
        </p>
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
          <h3 className={`text-sm font-semibold ${theme.heading}`}>{heading}</h3>
          {subtitleNode}
        </div>
      </div>
      {linesNode}
      {typingNode}
    </div>
  )
}
