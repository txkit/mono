import { test, expect } from '../../fixtures'


/**
 * When ?simulate=false, the TransactionButton skips the simulating phase and
 * goes directly to signing after the button is clicked.
 *
 * Wallet must be connected for the button to be clickable.
 * The state machine should jump: pending -> signing (no simulating in between).
 */
test('TransactionButton skips simulating when simulate=false', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia&simulate=false#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const button = page.locator('button[class*="tx-txb-button"]').first()
  await expect(button).toBeVisible({ timeout: 15_000 })
  await expect(button).toHaveAttribute('data-state', 'pending')

  await button.click()

  // With simulation off, state goes directly to signing (no simulating step).
  await expect(button).toHaveAttribute('data-state', 'signing', { timeout: 10_000 })
})
