import { test, expect } from '../../fixtures'


/**
 * Verifies that FlowToast appears after a completed tx flow when
 * ?stepsCount=1&showToast=true is set.
 *
 * FlowToast only renders on terminal states (completed/error/rejected/canceled).
 * We click the button, wait for the flow to complete, then assert toast presence.
 *
 * NOTE: The wallet is connected and on Sepolia so the actual Anvil tx can go
 * through. If Anvil is not running, the tx will fail and the toast will still
 * appear with an error state. Either way, a toast element should be visible.
 */
test('FlowToast appears after flow reaches terminal state', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia&stepsCount=1&showToast=true&simulate=false#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const button = page.locator('button[class*="tx-txb-button"]').first()
  await expect(button).toBeVisible({ timeout: 15_000 })

  await button.click()

  // Wait for the flow to reach a terminal state (completed or error).
  // FlowToast portals to document.body, so we query from root.
  const toast = page.locator('[class*="tx-toast"], [class*="tx-ft"], [role="status"][class*="tx-"]').first()

  await expect(toast).toBeVisible({ timeout: 45_000 })
})
