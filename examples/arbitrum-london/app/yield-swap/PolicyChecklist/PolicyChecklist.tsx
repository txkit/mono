'use client'

import { useEffect, useRef, useState } from 'react'

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

// Reveal pacing: a beat before the first check, then one check per beat -
// slow enough that each invariant registers as it lands instead of the whole
// list flashing in at once.
const FIRST_CHECK_DELAY_S = 0.5
const CHECK_STAGGER_S = 0.4

// The cascade starts only once half the card is actually on screen: the
// checklist sits low in the review panel, so a mount-time animation would
// finish below the fold and read as "already all green" after the scroll.
const REVEAL_THRESHOLD = 0.5

/**
 * Pre-flight view of the policy-gate checks for a prepared envelope. Each check
 * pops in green, staggered, as a reveal of constraints the envelope already
 * satisfies - not a live verification with fake latency. The reveal waits for
 * the card to scroll into view, so the cascade always plays in front of the
 * user.
 */
export const PolicyChecklist = () => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [ isRevealed, setRevealed ] = useState(false)

  useEffect(() => {
    const node = cardRef.current
    if (node === null) {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setRevealed(true)
        observer.disconnect()
      }
    }, { threshold: REVEAL_THRESHOLD })

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={cardRef}
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
            className={`flex items-start gap-3 ${isRevealed ? 'tx-anim-enter-y' : 'opacity-0'}`}
            style={isRevealed ? { animationDelay: `${FIRST_CHECK_DELAY_S + index * CHECK_STAGGER_S}s` } : undefined}
          >
            <span
              className={isRevealed ? 'tx-anim-pop' : 'opacity-0'}
              style={isRevealed ? { animationDelay: `${FIRST_CHECK_DELAY_S + index * CHECK_STAGGER_S + 0.1}s` } : undefined}
            >
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
