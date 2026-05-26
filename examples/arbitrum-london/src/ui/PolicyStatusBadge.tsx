export type PolicyStatus = 'allow' | 'warn' | 'block'

type PolicyStatusBadgeProps = {
  status: PolicyStatus,
  reason?: string,
}

const STATUS_STYLES: Record<PolicyStatus, string> = {
  allow: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  warn: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  block: 'bg-red-500/15 text-red-300 border-red-500/40',
}

const STATUS_LABELS: Record<PolicyStatus, string> = {
  allow: 'ALLOW',
  warn: 'WARN',
  block: 'BLOCK',
}

export const PolicyStatusBadge = ({ status, reason }: PolicyStatusBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-mono ${STATUS_STYLES[status]}`}
      title={reason}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
      {reason !== undefined && reason.length > 0 ? (
        <span className="opacity-70">- {reason}</span>
      ) : null}
    </span>
  )
}
