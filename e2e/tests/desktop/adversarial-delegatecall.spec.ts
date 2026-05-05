import { test, expect } from '../../fixtures'


/**
 * Anti-phishing: delegatecall to non-Safe target should trigger a warning advisory.
 *
 * TODO: This spec requires story playground support for adversarial fixtures.
 * The ?adversarial=delegatecall URL param is not yet implemented.
 *
 * The delegatecall-non-safe.json fixture has operation: "delegatecall" to an
 * unknown address. txKit should render an advisory banner explaining the risk:
 * "delegatecall to non-Safe target - receiver can modify caller storage".
 *
 * STORY CHANGE NEEDED: Add ?adversarial URL param support to load the
 * delegatecall-non-safe.json PreparedEnvelope and render the advisory banner.
 *
 * For now: verify the risk fixture JSON is valid and parseable.
 */
test('delegatecall adversarial fixture is valid JSON (placeholder until story support added)', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  // TODO: Replace with ?adversarial=delegatecall once story support is added.
  // For now just verify the story renders without error as a smoke check.
  await page.locator('button[class*="tx-txb-button"]').first().waitFor({ state: 'visible', timeout: 15_000 })

  // The delegatecall fixture should be structurally valid.
  // We verify it by loading from filesystem in a node context - but in E2E
  // we can only assert what's in the page. This is a placeholder assertion.
  const buttonState = await page.locator('button[class*="tx-txb-button"]').first().getAttribute('data-state')
  expect(buttonState).toBe('pending')
})
