import { test, expect } from '../../fixtures'


/**
 * Verifies that TransactionButton renders in the Live tab with the default
 * label "Run flow" and starts in data-state="pending" (idle/not clicked).
 */
test('TransactionButton renders with default label and pending state', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const button = page.locator('button[class*="tx-txb-button"]').first()

  await expect(button).toBeVisible({ timeout: 15_000 })
  await expect(button).toContainText(/run flow/i)
  await expect(button).toHaveAttribute('data-state', 'pending')
})
