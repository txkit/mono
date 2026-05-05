import { test, expect } from '../../fixtures'


/**
 * Verifies that TokenBalance renders without error in the Live tab on Sepolia.
 * Does not assert specific balance values (wagmi reads public RPC, not Anvil).
 */
test('TokenBalance renders without error on Sepolia', async ({ page, wallet }) => {
  await wallet.init({ chain: 'sepolia' })
  await page.goto('/?chainId=sepolia#tokenbalance')

  await page.locator('button.story-tab', { hasText: 'Live' }).click()

  // TokenBalance root element - any element with the tx-tb- class prefix.
  const balanceEl = page.locator('[class*="tx-tb"]').first()

  await expect(balanceEl).toBeVisible({ timeout: 20_000 })

  // Should not show an error boundary message.
  await expect(page.locator('text=Something went wrong')).not.toBeVisible()
})
