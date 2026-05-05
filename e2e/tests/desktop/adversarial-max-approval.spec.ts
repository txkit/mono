import { test, expect } from '../../fixtures'


/**
 * Anti-phishing: MAX_UINT256 approval should trigger risk warning UI.
 *
 * TODO: This spec requires story playground support for adversarial fixtures.
 * The ?adversarial=max-approval URL param is not yet implemented in the story.
 * Until story support is added, this spec will navigate to the TransactionButton
 * story with warnMaxApproval=true and assert the warning control is present.
 *
 * Full implementation: story should accept ?adversarial=max-approval to load the
 * max-approval-erc20.json PreparedEnvelope and render it via TransactionButton.
 * The button should enter confirming-risk state and show "Unlimited" in the
 * decoded calldata preview.
 *
 * STORY CHANGE NEEDED: Add ?adversarial URL param support to InteractiveTransactionButton
 * that loads fixtures from e2e/fixtures/adversarial/ and renders them.
 */
test('warnMaxApproval=true control is active in story (adversarial fixture placeholder)', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })

  // TODO: Replace with ?adversarial=max-approval once story support is added.
  await page.goto('/?chainId=sepolia&warnMaxApproval=true#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const button = page.locator('button[class*="tx-txb-button"]').first()
  await expect(button).toBeVisible({ timeout: 15_000 })

  // Verify warnMaxApproval=true is reflected in the story controls panel.
  // The ControlPanel renders boolean toggles with checked state.
  // "warn max approval" label should appear in the panel.
  const controlPanel = page.locator('.story-live-right')
  await expect(controlPanel).toContainText(/warn.*max.*approval/i, { timeout: 5_000 })
})
