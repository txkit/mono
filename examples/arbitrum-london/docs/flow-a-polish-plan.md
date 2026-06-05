# flow-a demo polish - implementation plan (from Figma design)

> Written before a context compaction so the design analysis survives. Execute from this file.

**Branch:** `feat/arbitrum-pendle-real-tx` (off main). PR #26 open.
**Goal:** adapt the approved Figma design into the real `app/flow-a` Pendle flow - the 3 hero moments for the 90-second buildathon demo video, on the deployed Arbitrum Sepolia contracts.

## Design source

- Zip: `~/Downloads/TransactionSafetyFlowDesign.zip` (extracted earlier to `/tmp/txsfd`, may not survive compaction - re-unzip if needed).
- It is a standalone Vite+React+Tailwind+shadcn prototype with SIMULATED timers. We take its UX/structure, NOT its code (wrong stack), and wire it to real flow-a data.
- Key design files: `src/app/App.tsx` (flow state machine), `src/app/components/{agent-reasoning,policy-verification,transaction-preview,execution-success}.tsx`.

## Stack translation (the design does NOT drop in)

The design uses `motion/react` (Framer Motion), `lucide-react` (inline SVG), shadcn `Card/Badge/Button`. txKit forbids all three. Translate:
- **Framer Motion -> CSS keyframe animations.** Use the example's Tailwind + the `--tx-duration-*` / `--tx-ease-*` tokens. Respect `prefers-reduced-motion` (one block at end of each CSS file).
- **lucide inline SVG -> CSS-mask icons.** Rule: `assets/icons/<name>.svg` + a `<span>` with CSS mask. Icons needed: `brain`, `shield`, `check-circle`, `external-link`, `copy`. Check `app/flow-a` / `src/ui` for existing mask-icon pattern first (CopyableValue may already have copy/external-link).
- **shadcn Card/Badge/Button -> plain divs with the example's Tailwind classes** (the example already styles cards as `rounded-lg border border-border bg-card p-6`).

## Token mapping (design token -> example Tailwind class)

The example uses Tailwind classes backed by `--tx-*` via `@theme inline` (NOT raw `--tx-` vars). Verify the exact class set at build time: `grep -rE '@theme|--color-' app/globals.css` (or wherever the theme block is) + reuse the classes already in `PendleAgentChat.tsx` / `EnvelopePreview.tsx`.

| Design raw token | Meaning | Example Tailwind class |
|---|---|---|
| `--tx-color-primary` | brand indigo | `text-accent` / `bg-accent` |
| `--tx-color-primary-light` | indigo tint bg | `bg-accent/10` (color-mix) or `bg-card-sunken` |
| `--tx-color-success` | green | `text-success` |
| `--tx-color-success-light` | green tint bg | `bg-success-bg` (verify name) |
| `--tx-color-mono` | main/code text | `text-foreground` |
| `--tx-color-mono-light` | code block bg | `bg-card-sunken` |
| `--tx-border-default` | card border | `border-border` |
| `--tx-border-strong` | emphasized border | `border-border-hover` (or `border-accent`) |
| `--tx-color-danger(-light)` | error | `text-error` / `bg-error-bg` |
| `--tx-color-warning(-light)` | amber | `text-warning` / `bg-warning-bg` |

## The 4 components (design intent -> txKit build)

### 1. AgentReasoning (NEW) - HERO 1
Card, indigo-tinted bg, `border-border`. Header: a pulsing round icon (brain, success/accent), title "Agent Reasoning" (`text-accent`), subtitle "Preparing transaction..." -> "Transaction prepared" (driven by state). Body: reasoning lines stagger-fade in (each: a small accent dot + the line); while in-progress show a 3-dot typing animation.
- **Animation (CSS):** icon pulse (scale 1 -> 1.05, ~2s loop, ease-in-out); line entry (opacity 0 + translateX(-10px) -> 1/0, staggered); typing dots (scale 1 -> 1.5, 3 dots, staggered delays 0/0.2/0.4s).
- **HONESTY - reasoning source:** do NOT hardcode "Reading your yield position...". Use the agent's REAL `reply` text (from `/api/agent`) as the reasoning line(s), plus real flow-state status lines ("Preparing envelope", "Signing"). If the reply is one sentence, that is the single reasoning line - honest beats fabricated.

### 2. PolicyChecklist (NEW) - HERO 2
Card, `border-border-hover`. Header: shield icon (success), title "Policy-Gate Verification" (`text-success`), subtitle "Running on-chain safety checks..." -> "All checks passed". Body: the 5 checks, each with state pending (faint circle, opacity 40) / checking (spinning circle, accent) / passed (green check, springs in). Label opacity tracks state. Footer when complete: "Transaction meets all policy requirements".
- **The 5 checks (exact labels):** (1) "Forwarded value matches declared value", (2) "Not a replay (fresh envelope)", (3) "Recipient is on the allow-list", (4) "Within the spend cap", (5) "Agent signature valid (EIP-712)".
- **Animation (CSS):** check entry (opacity 0 + translateY(5px) -> 1/0, staggered); passed check pops (scale 0 + rotate -180 -> 1/0, spring-ish); checking spinner (rotate 360, 1s linear loop).
- **HONESTY:** these 5 are real properties of the prepared+signed envelope, knowable before submission - so a pre-sign "checklist clearing" is honest. Frame as "the checks AgentPolicyGate.executeEnvelope enforces on-chain", shown pre-flight. Drive the pass sequence off envelope readiness (after `/api/agent` returns a signed envelope), not a blind timer. Replaces the single `PolicyStatusBadge`.

### 3. EnvelopePreview upgrade
Current `src/ui/EnvelopePreview.tsx` already shows chain, target, decoded args, hash, validity, fee slot. Adopt the design's richer formatting:
- Chain as a pill/badge (`bg-accent/10 text-accent`, mono).
- Decoded function call block: function name in `text-accent`, args indented as `name: value` rows in a `bg-card-sunken` block.
- A 3-column grid footer: Valid Until / Gas Estimate / Sequencer Fee (the existing `SequencerFeeRow` provides the sequencer fee; wire gas estimate if available, else show the sequencer fee row as-is).
- Keep existing copy buttons + focus-visible rings.

### 4. ExecutionSuccess (upgrade of existing tx-link) - HERO 3
`SignEnvelopeActions` already renders the post-tx explorer link. Upgrade the success state to a card: green border, a check icon that springs in, "Executed On-Chain" + "Transaction confirmed", the tx hash in a `bg-card-sunken` mono row + an external-link to Arbiscan ("View on Arbiscan"). Reuse `resolveExplorerLabel` / `formatTxExplorerUrl` (already multi-chain).

## flow-a wiring (state -> component)

`PendleAgentChat.tsx` already has: messages, isLoading, envelope, decodedInner, txHash, isSigning/isConfirming/isConfirmed. Map:
- isLoading (agent call in flight) -> AgentReasoning in "preparing" state (subtitle "Preparing transaction...", typing dots).
- envelope returned -> AgentReasoning "complete" + EnvelopePreview + PolicyChecklist (run the pass sequence on envelope arrival).
- envelope present + not signing -> Sign / Reject buttons (exist in SignEnvelopeActions).
- isSigning -> "Waiting for wallet signature..." pill.
- isConfirmed + txHash -> ExecutionSuccess card.
- Keep the existing `DeployPendingBanner` (now clears - contracts deployed).

## Files

- Create: `app/flow-a/AgentReasoning/AgentReasoning.tsx` (+ `.css`), `app/flow-a/PolicyChecklist/PolicyChecklist.tsx` (+ `.css`). Folder-per-component (project rule). Scoped helpers in `utils/` if needed.
- Modify: `src/ui/EnvelopePreview.tsx` (+ its css) - function-call formatting + 3-col grid.
- Modify: `app/flow-a/SignEnvelopeActions.tsx` - success card.
- Modify: `app/flow-a/PendleAgentChat.tsx` - render the new components per state; pass real reply as reasoning.
- Add icons: `assets/icons/{brain,shield,check-circle}.svg` (+ external-link/copy if not already present). MD5-dedup check before adding.

## Code rules (apply throughout)

Arrow functions; `const Component: React.FC<Props>` for internal, `forwardRef` + displayName + data-testid for public; blank line before `return (`; destructure when 3+ accesses; no double ternaries (split into `const xNode = cond ? <A/> : null` + `||` chain); no single-line if; no inline SVG (CSS mask); `||` over `??`; no em-dash (hyphen only); WCAG AA (focus-visible rings, `role`/`aria-live` on status, `prefers-reduced-motion` block per CSS file, 44px touch targets); English in code.

## Verification

- `pnpm exec tsc --noEmit` · `pnpm exec eslint app src` · `pnpm exec next build` · em-dash scan (`git diff main...HEAD | grep -nP '[\x{2014}\x{2013}]'`).
- Visual: `pnpm dev` -> `/flow-a` - the 3 hero moments render; reduced-motion respected. (Full agent run needs ANTHROPIC_API_KEY + Mike; verify the static/preview render + build.)
- Do NOT touch the other-session uncommitted changes in the working tree (Robinhood deploy sync in deployed.json/decoder-data/README - intentional, leave them; `git add` only flow-a polish files).
- Commit per component; PR #26 stays open (not merge).
