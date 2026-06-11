export type PolicyStatus = 'allow' | 'warn' | 'block'

type PolicyStatusBadgeProps = {
  status: PolicyStatus,
  reason?: string,
}

const STATUS_STYLES: Record<PolicyStatus, string> = {
  allow: 'bg-success-bg text-success border-success',
  warn: 'bg-warning-bg text-warning border-warning',
  block: 'bg-error-bg text-error border-error',
}

const STATUS_LABELS: Record<PolicyStatus, string> = {
  allow: 'ALLOW',
  warn: 'WARN',
  block: 'BLOCK',
}

export const PolicyStatusBadge = (props: PolicyStatusBadgeProps) => {
  const { status, reason } = props
  const hasReason = reason !== undefined && reason.length > 0
  const reasonNode = hasReason ? <span className="opacity-80">{' - '}{reason}</span> : null

  return (
    // max-w-full + the label/reason in one wrapping span keeps the badge inside
    // its container on narrow screens (the reason wraps to extra lines) instead
    // of overflowing; the dot stays pinned to the first line.
    <span
      className={`inline-flex max-w-full items-start gap-2 rounded-md border px-2.5 py-1 text-xs font-mono leading-relaxed ${STATUS_STYLES[status]}`}
      title={reason}
    >
      {/* The dot wrapper is exactly one line-box tall (leading-relaxed x the
          text-xs font size) and centers the dot, so it lands on the first line's
          optical center whether the reason fits one line or wraps - no magic
          top-margin nudge. */}
      <span className="flex h-[1.625em] shrink-0 items-center" aria-hidden="true">
        <span className="size-1.5 rounded-full bg-current" />
      </span>
      <span>
        {STATUS_LABELS[status]}
        {reasonNode}
      </span>
    </span>
  )
}
