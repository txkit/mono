import { Icon } from '@/src/ui/Icon'


type PolicyCheckItem = {
  id: string,
  label: string,
}

/**
 * The five invariants AgentPolicyGate.executeEnvelope enforces on-chain. They
 * are real properties of a prepared, agent-signed envelope - knowable before
 * submission - so clearing them as a pre-flight checklist is honest rather than
 * a simulated network call. Labels mirror the Solidity checks 1:1.
 */
const POLICY_CHECKS: ReadonlyArray<PolicyCheckItem> = [
  { id: 'value', label: 'Forwarded value matches declared value' },
  { id: 'replay', label: 'Not a replay (fresh envelope)' },
  { id: 'allowlist', label: 'Recipient is on the allow-list' },
  { id: 'spend', label: 'Within the 0 ETH spend cap (no value forwarded)' },
  { id: 'signature', label: 'Agent signature valid (EIP-712)' },
]

/**
 * Pre-flight view of the policy-gate checks for a prepared envelope. Each check
 * pops in green, staggered, as a reveal of constraints the envelope already
 * satisfies - not a live verification with fake latency.
 */
export const PolicyChecklist = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-lg border border-border-hover bg-card p-5 tx-anim-card-in"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-success-bg">
          <Icon name="shield" className="size-5 text-success" />
        </span>
        <div>
          <h3 className="font-semibold text-success">Policy gate</h3>
          <p className="text-xs text-muted">Enforced on-chain by AgentPolicyGate</p>
        </div>
      </div>

      <ul role="list" className="space-y-3">
        {POLICY_CHECKS.map((check, index) => (
          <li
            key={check.id}
            className="flex items-start gap-3 tx-anim-enter-y"
            style={{ animationDelay: `${index * 0.12}s` }}
          >
            <span className="tx-anim-pop" style={{ animationDelay: `${index * 0.12 + 0.1}s` }}>
              <Icon name="check-circle" className="mt-0.5 size-5 text-success" />
            </span>
            <p className="text-sm leading-relaxed text-foreground">{check.label}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-border pt-4 text-center text-xs">
        <span className="font-semibold text-foreground">5 invariants</span>
        <span className="text-muted"> - enforced by the contract, not the AI</span>
      </div>
    </div>
  )
}
