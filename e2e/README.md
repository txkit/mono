# txkit-e2e

End-to-end tests for txKit, run with Playwright against the story
playground and a local Anvil fork.

**Standalone package** — not part of the pnpm workspace. Has its own
`node_modules`. See [plans/txkit-testing-strategy-v0.1.md](../plans/txkit-testing-strategy-v0.1.md)
for the full architecture rationale.

## Setup

```bash
# 1. Install isolated deps
cd e2e
pnpm install --ignore-workspace

# 2. Install Playwright browsers
pnpm exec playwright install chromium

# 3. Configure RPC for Anvil fork
cp .env.example .env
# Edit .env, paste your Alchemy/QuickNode Sepolia URL into SEPOLIA_RPC_URL

# 4. Verify Foundry is available
anvil --version || curl -L https://foundry.paradigm.xyz | bash && foundryup
```

## Run

```bash
pnpm test               # all projects (desktop + mobile)
pnpm test:desktop       # desktop chrome 1280x800
pnpm test:mobile        # iPhone 14 viewport
pnpm test:headed        # non-headless (watch the browser)
pnpm test:debug         # interactive Playwright debugger
pnpm report             # open last HTML report
```

Playwright auto-starts both the story dev server (`pnpm --filter @txkit/story dev`)
and Anvil fork (`./scripts/anvil-ci.sh`). Just run `pnpm test`.

For smoke tests against the deployed playground:

```bash
E2E_BASE_URL=https://story.txkit.dev pnpm test
```

## Architecture

- **EIP-1193 injection** — `helpers/eip1193-provider.js` replaces
  `window.ethereum` with a stub that forwards to Anvil and bridges
  signing to ethers `Wallet` via `page.exposeFunction`. Adapted from
  StakeWise testwise.
- **Anvil fork** — Sepolia fork at `localhost:8545`, block-time 2s.
  `anvil_impersonateAccount` + `anvil_setBalance` give each test a
  funded address without needing a real private key.
- **EIP-6963 announce** — the injected provider announces itself so
  wagmi's connector discovery picks it up automatically.
- **Risk fixtures** — `fixtures/risk/*.json` capture real Blowfish /
  Blockaid / GoPlus responses. `risk.use('blowfish-warn-token-drain')`
  routes outbound API calls to the fixture instead of upstream.

## Writing a new spec

```ts
import { test, expect } from '../../fixtures'


test('TransactionButton runs full happy path', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?state=pending')
  await wallet.connect()

  await page.locator('[data-testid="transaction-button-main"]').click()

  await expect(
    page.locator('[data-testid="transaction-button-main"]')
  ).toHaveAttribute('data-state', 'completed', { timeout: 30_000 })
})
```

State of the world is controlled via URL search params (story reads
them in `useControls()`):

```
?state=signing                    # force a specific TransactionButton state
?safetyDelayMs=5000               # safety countdown
?warnMaxApproval=true             # max-approval risk warning enabled
?riskMode=warn                    # mock risk-provider mode
?clearSigning=registry|fallback   # ERC-7730 vs ABI fallback
```

## Debugging a failing test

```bash
# Replay the trace from a failed run
pnpm exec playwright show-trace test-results/.../trace.zip

# Or step through interactively
pnpm test:debug -g "your test name"
```

Each retry produces a video (`test-results/.../video.webm`) and
screenshot for forensics.

## CI

Single Playwright workflow runs both projects with `workers=1` (Anvil
shared state). Foundry preinstalled via
`foundry-rs/foundry-toolchain@v1` action. See `.github/workflows/e2e.yml`.

## Conventions

- Test files end in `.spec.ts`, never `.test.ts`
- Imports through `../../fixtures` (extended `test`, not raw Playwright)
- Wallet init **before** `page.goto` so injection happens on first frame
- Test names use plain ASCII (`->` not `→`); they appear in CI logs
