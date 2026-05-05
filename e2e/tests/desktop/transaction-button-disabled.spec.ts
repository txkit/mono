import { test, expect } from '../../fixtures'


/**
 * Verifies that ?disabled=true URL param (hydrated via useControls) renders
 * the TransactionButton in a disabled state, preventing interaction.
 */
test('TransactionButton is disabled when ?disabled=true', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia&disabled=true#transactionbutton')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  const button = page.locator('button[class*="tx-txb-button"]').first()

  await expect(button).toBeVisible({ timeout: 15_000 })
  await expect(button).toBeDisabled()
})
