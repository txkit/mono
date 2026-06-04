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
  const reasonNode = hasReason ? <span className="opacity-80">- {reason}</span> : null

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-mono ${STATUS_STYLES[status]}`}
      title={reason}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
      {reasonNode}
    </span>
  )
}
